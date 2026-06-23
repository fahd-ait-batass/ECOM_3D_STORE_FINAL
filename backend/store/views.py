from decimal import Decimal, InvalidOperation

from django.db.models import Avg, Count, F, Q, Sum
from django.shortcuts import get_object_or_404
from rest_framework.generics import (
    ListAPIView,
    ListCreateAPIView,
    RetrieveAPIView,
    RetrieveUpdateDestroyAPIView,
)
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView

from .models import Category, Product, Review, StoreSettings, WishlistItem
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    ProductWriteSerializer,
    ReviewAdminSerializer,
    ReviewApprovalSerializer,
    ReviewSerializer,
    ReviewWriteSerializer,
    StoreSettingsSerializer,
    WishlistItemSerializer,
    has_delivered_purchase,
)


class ProductPagination(PageNumberPagination):
    page_size = 8
    page_size_query_param = "page_size"
    max_page_size = 48


def apply_product_filters(queryset, query_params):
    search = query_params.get("search") or query_params.get("q")
    category = query_params.get("category")
    min_price = query_params.get("min_price")
    max_price = query_params.get("max_price")
    sort = query_params.get("sort") or query_params.get("ordering")

    if search:
        queryset = queryset.filter(
            Q(name__icontains=search)
            | Q(description__icontains=search)
            | Q(category__name__icontains=search)
        )

    if category:
        if str(category).isdigit():
            queryset = queryset.filter(category_id=category)
        else:
            queryset = queryset.filter(category__slug=category)

    if min_price:
        try:
            queryset = queryset.filter(price__gte=Decimal(min_price))
        except InvalidOperation:
            pass

    if max_price:
        try:
            queryset = queryset.filter(price__lte=Decimal(max_price))
        except InvalidOperation:
            pass

    ordering_map = {
        "newest": "-created_at",
        "price_asc": "price",
        "price_desc": "-price",
        "rating": "-rating",
        "-rating": "-rating",
        "name": "name",
    }
    if sort in ordering_map:
        queryset = queryset.order_by(ordering_map[sort])

    return queryset


class CategoryListView(ListAPIView):
    serializer_class = CategorySerializer

    def get_queryset(self):
        return Category.objects.filter(is_active=True)


class ProductListView(ListAPIView):
    serializer_class = ProductSerializer
    pagination_class = ProductPagination

    def get_queryset(self):
        queryset = Product.objects.select_related("category").filter(is_active=True)
        return apply_product_filters(queryset, self.request.query_params)


class FeaturedProductListView(ListAPIView):
    serializer_class = ProductSerializer

    def get_queryset(self):
        return Product.objects.select_related("category").filter(
            is_active=True,
            is_featured=True,
        )


class ProductDetailView(RetrieveAPIView):
    serializer_class = ProductSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return Product.objects.select_related("category").filter(is_active=True)


class ProductReviewListCreateView(ListCreateAPIView):
    permission_classes = [AllowAny]

    def get_product(self):
        return get_object_or_404(Product.objects.filter(is_active=True), slug=self.kwargs["slug"])

    def get_queryset(self):
        return (
            Review.objects.select_related("product", "user")
            .filter(product=self.get_product(), is_approved=True)
            .order_by("-created_at")
        )

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ReviewWriteSerializer
        return ReviewSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["product"] = self.get_product()
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = serializer.save()
        return Response(
            ReviewSerializer(review, context=self.get_serializer_context()).data,
            status=status.HTTP_201_CREATED,
        )


class ProductReviewSummaryView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug):
        product = get_object_or_404(Product.objects.filter(is_active=True), slug=slug)
        approved_reviews = Review.objects.filter(product=product, is_approved=True)
        stats = approved_reviews.aggregate(average=Avg("rating"), count=Count("id"))
        review_count = stats["count"] or 0
        average_rating = (
            round(float(stats["average"] or 0), 2)
            if review_count
            else float(product.rating or 0)
        )
        breakdown = {
            rating: approved_reviews.filter(rating=rating).count()
            for rating in range(5, 0, -1)
        }

        current_user_review = None
        can_review = False
        message = "Log in to review this product."

        if request.user.is_authenticated:
            own_review = Review.objects.filter(product=product, user=request.user).first()
            if own_review:
                current_user_review = ReviewSerializer(
                    own_review,
                    context={"request": request},
                ).data
                message = (
                    "Your review is live."
                    if own_review.is_approved
                    else "Your review is pending approval."
                )
            elif has_delivered_purchase(request.user, product):
                can_review = True
                message = "You can review this delivered purchase."
            else:
                message = "Only customers with a delivered purchase can review this product."

        return Response(
            {
                "average_rating": average_rating,
                "review_count": review_count,
                "breakdown": breakdown,
                "can_review": can_review,
                "message": message,
                "current_user_review": current_user_review,
            }
        )


class ReviewOwnerDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = ReviewWriteSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "put", "patch", "delete"]

    def get_queryset(self):
        return Review.objects.select_related("product", "user").filter(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method == "GET":
            return ReviewSerializer
        return ReviewWriteSerializer

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        review = self.get_object()
        return Response(ReviewSerializer(review, context=self.get_serializer_context()).data)


class ReviewAdminListView(ListAPIView):
    serializer_class = ReviewAdminSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = Review.objects.select_related("product", "user").all()
        review_status = self.request.query_params.get("status")
        if review_status == "approved":
            queryset = queryset.filter(is_approved=True)
        elif review_status == "pending":
            queryset = queryset.filter(is_approved=False)
        return queryset.order_by("-created_at")


class ReviewAdminDetailView(RetrieveUpdateDestroyAPIView):
    queryset = Review.objects.select_related("product", "user").all()
    permission_classes = [IsAdminUser]
    http_method_names = ["patch", "delete"]

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return ReviewApprovalSerializer
        return ReviewAdminSerializer

    def patch(self, request, *args, **kwargs):
        review = self.get_object()
        serializer = self.get_serializer(review, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ReviewAdminSerializer(review, context=self.get_serializer_context()).data)


class WishlistListCreateView(ListCreateAPIView):
    serializer_class = WishlistItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            WishlistItem.objects.select_related("product", "product__category")
            .filter(user=self.request.user)
            .order_by("-created_at")
        )


class WishlistDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, product_id):
        item = get_object_or_404(
            WishlistItem,
            user=request.user,
            product_id=product_id,
        )
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StockAlertView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        active_products = Product.objects.select_related("category").filter(is_active=True)
        out_of_stock = active_products.filter(stock=0)
        low_stock = active_products.filter(
            stock__gt=0,
            stock__lte=F("low_stock_threshold"),
        )
        alert_products = (out_of_stock | low_stock).distinct().order_by("stock", "name")
        total_stock_units = active_products.aggregate(total=Sum("stock")).get("total") or 0

        return Response(
            {
                "out_of_stock_count": out_of_stock.count(),
                "low_stock_count": low_stock.count(),
                "total_stock_units": total_stock_units,
                "results": ProductSerializer(
                    alert_products,
                    many=True,
                    context={"request": request},
                ).data,
            }
        )


class CategoryManageListCreateView(ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    permission_classes = [IsAdminUser]


class CategoryManageDetailView(RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    permission_classes = [IsAdminUser]

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active"])


class ProductManageListCreateView(ListCreateAPIView):
    serializer_class = ProductWriteSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    pagination_class = ProductPagination
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = Product.objects.select_related("category").all()
        return apply_product_filters(queryset, self.request.query_params)


class ProductManageDetailView(RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.select_related("category").all()
    serializer_class = ProductWriteSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    permission_classes = [IsAdminUser]

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active"])


class StoreSettingsView(APIView):
    parser_classes = (JSONParser, FormParser, MultiPartParser)

    def get_permissions(self):
        if self.request.method == "PUT":
            return [IsAdminUser()]
        return [AllowAny()]

    def get(self, request):
        serializer = StoreSettingsSerializer(StoreSettings.load())
        return Response(serializer.data)

    def put(self, request):
        serializer = StoreSettingsSerializer(
            StoreSettings.load(),
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
