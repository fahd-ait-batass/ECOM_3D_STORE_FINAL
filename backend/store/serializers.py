from django.db.models import Avg, Count
from rest_framework import serializers

from .models import Category, Product, Review, StoreSettings, WishlistItem


def has_delivered_purchase(user, product):
    if not user or not user.is_authenticated:
        return False
    from orders.models import Order, OrderItem

    return OrderItem.objects.filter(
        product=product,
        order__user=user,
        order__status=Order.STATUS_DELIVERED,
    ).exists()


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug", "image", "is_active")

    def validate_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Category name is too short.")
        return value.strip()

    def validate_slug(self, value):
        return value.strip().lower()


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    stock_status = serializers.CharField(read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "category",
            "description",
            "price",
            "old_price",
            "image",
            "stock",
            "low_stock_threshold",
            "stock_status",
            "rating",
            "average_rating",
            "review_count",
            "is_featured",
            "is_active",
            "created_at",
        )

    def get_review_stats(self, obj):
        if hasattr(obj, "_review_stats"):
            return obj._review_stats
        stats = obj.reviews.filter(is_approved=True).aggregate(
            average=Avg("rating"),
            count=Count("id"),
        )
        obj._review_stats = stats
        return stats

    def get_average_rating(self, obj):
        stats = self.get_review_stats(obj)
        if stats["count"]:
            return round(float(stats["average"] or 0), 2)
        return float(obj.rating or 0)

    def get_review_count(self, obj):
        return self.get_review_stats(obj)["count"] or 0


class ProductWriteSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source="category",
        write_only=True,
    )
    stock_status = serializers.CharField(read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "category",
            "category_id",
            "description",
            "price",
            "old_price",
            "image",
            "stock",
            "low_stock_threshold",
            "stock_status",
            "rating",
            "is_featured",
            "is_active",
            "created_at",
        )
        read_only_fields = ("id", "category", "created_at")

    def validate_name(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Product name is too short.")
        return value.strip()

    def validate_slug(self, value):
        return value.strip().lower()

    def validate_description(self, value):
        if len(value.strip()) < 12:
            raise serializers.ValidationError("Description should be at least 12 characters.")
        return value.strip()

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than zero.")
        return value

    def validate_rating(self, value):
        if value < 0 or value > 5:
            raise serializers.ValidationError("Rating must be between 0 and 5.")
        return value

    def validate_low_stock_threshold(self, value):
        if value < 0:
            raise serializers.ValidationError("Low stock threshold cannot be negative.")
        return value

    def validate(self, attrs):
        price = attrs.get("price", getattr(self.instance, "price", None))
        old_price = attrs.get("old_price", getattr(self.instance, "old_price", None))
        if old_price is not None and price is not None and old_price <= price:
            raise serializers.ValidationError(
                {"old_price": "Old price should be higher than current price."}
            )
        return attrs


class ReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.SerializerMethodField()
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_slug = serializers.CharField(source="product.slug", read_only=True)
    verified_purchase = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = (
            "id",
            "product",
            "product_name",
            "product_slug",
            "user",
            "reviewer_name",
            "rating",
            "title",
            "comment",
            "is_approved",
            "verified_purchase",
            "is_owner",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "product",
            "product_name",
            "product_slug",
            "user",
            "reviewer_name",
            "is_approved",
            "verified_purchase",
            "is_owner",
            "created_at",
            "updated_at",
        )

    def get_reviewer_name(self, obj):
        full_name = f"{obj.user.first_name} {obj.user.last_name}".strip()
        return full_name or obj.user.username

    def get_verified_purchase(self, obj):
        return has_delivered_purchase(obj.user, obj.product)

    def get_is_owner(self, obj):
        request = self.context.get("request")
        return bool(request and request.user.is_authenticated and obj.user_id == request.user.id)


class ReviewWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ("id", "rating", "title", "comment")
        read_only_fields = ("id",)

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def validate_title(self, value):
        return value.strip()

    def validate_comment(self, value):
        clean = value.strip()
        if len(clean) < 8:
            raise serializers.ValidationError("Comment should be at least 8 characters.")
        return clean

    def validate(self, attrs):
        request = self.context.get("request")
        product = self.context.get("product")
        if self.instance:
            return attrs
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication is required.")
        if Review.objects.filter(product=product, user=request.user).exists():
            raise serializers.ValidationError("You already reviewed this product.")
        if not has_delivered_purchase(request.user, product):
            raise serializers.ValidationError(
                "Only customers with a delivered purchase can review this product."
            )
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        product = self.context["product"]
        return Review.objects.create(
            product=product,
            user=request.user,
            is_approved=False,
            **validated_data,
        )

    def update(self, instance, validated_data):
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.is_approved = False
        instance.save()
        return instance


class ReviewAdminSerializer(ReviewSerializer):
    customer_email = serializers.EmailField(source="user.email", read_only=True)
    customer_username = serializers.CharField(source="user.username", read_only=True)

    class Meta(ReviewSerializer.Meta):
        fields = ReviewSerializer.Meta.fields + ("customer_email", "customer_username")
        read_only_fields = ReviewSerializer.Meta.read_only_fields + (
            "customer_email",
            "customer_username",
        )


class ReviewApprovalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ("id", "is_approved")


class WishlistProductSerializer(ProductSerializer):
    class Meta(ProductSerializer.Meta):
        fields = (
            "id",
            "name",
            "slug",
            "image",
            "price",
            "old_price",
            "stock",
            "low_stock_threshold",
            "stock_status",
            "average_rating",
            "review_count",
        )


class WishlistItemSerializer(serializers.ModelSerializer):
    product = WishlistProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(is_active=True),
        source="product",
        write_only=True,
    )

    class Meta:
        model = WishlistItem
        fields = ("id", "product", "product_id", "created_at")
        read_only_fields = ("id", "product", "created_at")

    def validate(self, attrs):
        request = self.context.get("request")
        product = attrs.get("product")
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication is required.")
        if WishlistItem.objects.filter(user=request.user, product=product).exists():
            raise serializers.ValidationError("Product is already in your wishlist.")
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        return WishlistItem.objects.create(user=request.user, **validated_data)


class StoreSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreSettings
        fields = (
            "id",
            "store_name",
            "phone",
            "whatsapp",
            "email",
            "address",
            "instagram",
            "facebook",
            "delivery_price",
            "free_delivery_threshold",
            "currency",
            "updated_at",
        )
        read_only_fields = ("id", "updated_at")

    def validate_delivery_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Delivery price cannot be negative.")
        return value

    def validate_free_delivery_threshold(self, value):
        if value < 0:
            raise serializers.ValidationError("Free delivery threshold cannot be negative.")
        return value

    def validate_currency(self, value):
        clean = value.strip().upper()
        if len(clean) < 3:
            raise serializers.ValidationError("Currency code should be at least 3 characters.")
        return clean
