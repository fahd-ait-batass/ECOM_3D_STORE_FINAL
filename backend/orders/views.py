from datetime import datetime, time, timedelta
from decimal import Decimal

from django.db.models import Count, DecimalField, ExpressionWrapper, F, Q, Sum
from django.db.models.functions import TruncDay, TruncMonth
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView, UpdateAPIView
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from store.models import Product
from .models import Coupon, Order, OrderItem
from .serializers import (
    CouponSerializer,
    CouponValidateSerializer,
    OrderCreateSerializer,
    OrderSerializer,
    OrderStatusUpdateSerializer,
)


ANALYTICS_PERIODS = {
    "7d": timedelta(days=6),
    "30d": timedelta(days=29),
    "90d": timedelta(days=89),
    "12m": timedelta(days=365),
}


def decimal_to_float(value):
    return float(value or Decimal("0.00"))


def parse_filter_datetime(value, end_of_day=False):
    if not value:
        return None

    parsed = parse_datetime(value)
    if parsed is None:
        parsed_date = parse_date(value)
        if parsed_date:
            parsed = datetime.combine(parsed_date, time.max if end_of_day else time.min)

    if parsed is None:
        return None

    if timezone.is_naive(parsed):
        parsed = timezone.make_aware(parsed, timezone.get_current_timezone())
    return parsed


def add_month(value):
    year = value.year + (value.month // 12)
    month = 1 if value.month == 12 else value.month + 1
    return value.replace(year=year, month=month, day=1)


def build_time_buckets(date_from, date_to, group_by):
    buckets = []
    if group_by == "month":
        current = date_from.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end = date_to.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        while current <= end:
            key = current.strftime("%Y-%m")
            buckets.append({"key": key, "label": current.strftime("%b %Y")})
            current = add_month(current)
        return buckets

    current_date = timezone.localtime(date_from).date()
    end_date = timezone.localtime(date_to).date()
    while current_date <= end_date:
        buckets.append(
            {
                "key": current_date.isoformat(),
                "label": current_date.strftime("%d %b"),
            }
        )
        current_date += timedelta(days=1)
    return buckets


class CouponValidateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CouponValidateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = serializer.validated_data["result"].copy()
        result.pop("coupon", None)
        return Response(result)


class CouponManageListCreateView(ListCreateAPIView):
    queryset = Coupon.objects.all()
    serializer_class = CouponSerializer
    permission_classes = [IsAdminUser]


class CouponManageDetailView(RetrieveUpdateDestroyAPIView):
    queryset = Coupon.objects.all()
    serializer_class = CouponSerializer
    permission_classes = [IsAdminUser]


class OrderListCreateView(ListCreateAPIView):
    queryset = Order.objects.prefetch_related("items__product").all()

    def get_serializer_class(self):
        if self.request.method == "POST":
            return OrderCreateSerializer
        return OrderSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [AllowAny()]
        return [IsAdminUser()]


class OrderStatusUpdateView(UpdateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderStatusUpdateSerializer
    http_method_names = ["patch"]
    permission_classes = [IsAdminUser]

    def patch(self, request, *args, **kwargs):
        order = self.get_object()
        previous_status = order.status
        previous_tracking_number = order.tracking_number
        serializer = self.get_serializer(order, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        from .emails import send_order_status_update_email

        send_order_status_update_email(
            order,
            previous_status=previous_status,
            previous_tracking_number=previous_tracking_number,
        )
        return Response(OrderSerializer(order, context=self.get_serializer_context()).data)


class MyOrderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = (
            Order.objects.prefetch_related("items__product", "items__product__category")
            .filter(user=request.user)
            .order_by("-created_at")
        )
        serializer = OrderSerializer(orders, many=True, context={"request": request})
        return Response(serializer.data)


class DashboardSummaryView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        revenue = (
            Order.objects.exclude(status=Order.STATUS_CANCELLED)
            .aggregate(total=Sum("total_price"))
            .get("total")
            or 0
        )
        return Response(
            {
                "total_products": Product.objects.count(),
                "active_products": Product.objects.filter(is_active=True).count(),
                "total_orders": Order.objects.count(),
                "pending_orders": Order.objects.filter(status=Order.STATUS_PENDING).count(),
                "revenue": revenue,
            }
        )


class DashboardAnalyticsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        now = timezone.now()
        requested_period = request.query_params.get("period", "30d")
        period = requested_period if requested_period in ANALYTICS_PERIODS else "30d"
        date_to = parse_filter_datetime(request.query_params.get("date_to"), end_of_day=True) or now
        date_from = (
            parse_filter_datetime(request.query_params.get("date_from"))
            or date_to
            - ANALYTICS_PERIODS[period]
        )

        if date_from > date_to:
            date_from, date_to = date_to, date_from

        days_in_range = max(1, (timezone.localtime(date_to).date() - timezone.localtime(date_from).date()).days)
        group_by = "month" if period == "12m" or days_in_range > 120 else "day"
        trunc_func = TruncMonth if group_by == "month" else TruncDay

        orders = Order.objects.filter(created_at__gte=date_from, created_at__lte=date_to)
        revenue_orders = orders.exclude(status=Order.STATUS_CANCELLED)

        status_counts = {
            status_key: orders.filter(status=status_key).count()
            for status_key, _ in Order.STATUS_CHOICES
        }
        revenue_total = revenue_orders.aggregate(total=Sum("total_price")).get("total") or Decimal("0.00")
        revenue_order_count = revenue_orders.count()
        average_order_value = (
            revenue_total / revenue_order_count if revenue_order_count else Decimal("0.00")
        )
        coupon_discounts = (
            revenue_orders.aggregate(total=Sum("discount_amount")).get("total") or Decimal("0.00")
        )
        delivery_revenue = (
            revenue_orders.aggregate(total=Sum("delivery_price")).get("total") or Decimal("0.00")
        )

        customer_keys = set()
        for order in orders.only("user_id", "phone", "full_name"):
            if order.user_id:
                customer_keys.add(f"user:{order.user_id}")
            else:
                customer_keys.add(f"guest:{(order.phone or order.full_name or order.pk).strip()}")

        active_products = Product.objects.filter(is_active=True)
        out_of_stock_products = active_products.filter(stock=0)
        low_stock_products = active_products.filter(
            stock__gt=0,
            stock__lte=F("low_stock_threshold"),
        )
        stock_alert_products = (
            active_products.filter(Q(stock=0) | Q(stock__gt=0, stock__lte=F("low_stock_threshold")))
            .select_related("category")
            .order_by("stock", "name")
        )

        buckets = build_time_buckets(date_from, date_to, group_by)
        trend_map = {
            bucket["key"]: {
                "date": bucket["key"],
                "label": bucket["label"],
                "revenue": 0.0,
                "orders": 0,
            }
            for bucket in buckets
        }

        def trend_key(bucket_value):
            local_value = timezone.localtime(bucket_value)
            if group_by == "month":
                return local_value.strftime("%Y-%m")
            return local_value.date().isoformat()

        for row in (
            revenue_orders.annotate(bucket=trunc_func("created_at"))
            .values("bucket")
            .annotate(revenue=Sum("total_price"))
            .order_by("bucket")
        ):
            key = trend_key(row["bucket"])
            if key in trend_map:
                trend_map[key]["revenue"] = decimal_to_float(row["revenue"])

        for row in (
            orders.annotate(bucket=trunc_func("created_at"))
            .values("bucket")
            .annotate(order_count=Count("id"))
            .order_by("bucket")
        ):
            key = trend_key(row["bucket"])
            if key in trend_map:
                trend_map[key]["orders"] = row["order_count"]

        def line_revenue_sum():
            return Sum(
                ExpressionWrapper(
                    F("price") * F("quantity"),
                    output_field=DecimalField(max_digits=12, decimal_places=2),
                ),
                output_field=DecimalField(max_digits=12, decimal_places=2),
            )

        top_products_base = OrderItem.objects.filter(order__in=revenue_orders)
        top_product_values = (
            "product_id",
            "product__name",
            "product__slug",
        )
        top_by_quantity = (
            top_products_base.values(*top_product_values)
            .annotate(units_sold=Sum("quantity"), revenue=line_revenue_sum())
            .order_by("-units_sold", "-revenue")[:8]
        )
        top_by_revenue = (
            top_products_base.values(*top_product_values)
            .annotate(units_sold=Sum("quantity"), revenue=line_revenue_sum())
            .order_by("-revenue", "-units_sold")[:8]
        )

        recent_orders = []
        for order in orders.order_by("-created_at")[:8]:
            recent_orders.append(
                {
                    "id": order.id,
                    "order_number": f"EC3D-{order.pk:06d}",
                    "customer": order.full_name,
                    "status": order.status,
                    "status_label": order.get_status_display(),
                    "total_price": decimal_to_float(order.total_price),
                    "created_at": order.created_at,
                }
            )

        low_stock_data = []
        for product in stock_alert_products[:10]:
            low_stock_data.append(
                {
                    "id": product.id,
                    "name": product.name,
                    "slug": product.slug,
                    "category": product.category.name if product.category_id else "",
                    "stock": product.stock,
                    "low_stock_threshold": product.low_stock_threshold,
                    "stock_status": product.stock_status,
                }
            )

        coupon_usage = []
        for row in (
            revenue_orders.exclude(coupon_code="")
            .values("coupon_code")
            .annotate(
                orders=Count("id"),
                total_discount=Sum("discount_amount"),
            )
            .order_by("-total_discount", "-orders")[:8]
        ):
            coupon_usage.append(
                {
                    "code": row["coupon_code"],
                    "orders": row["orders"],
                    "total_discount": decimal_to_float(row["total_discount"]),
                }
            )

        def format_top_product(row):
            return {
                "product_id": row["product_id"],
                "name": row["product__name"] or "Deleted product",
                "slug": row["product__slug"] or "",
                "quantity": row["units_sold"] or 0,
                "revenue": decimal_to_float(row["revenue"]),
            }

        trend_data = list(trend_map.values())
        status_distribution = [
            {
                "status": status_key,
                "label": status_label,
                "count": status_counts.get(status_key, 0),
            }
            for status_key, status_label in Order.STATUS_CHOICES
        ]

        return Response(
            {
                "filters": {
                    "period": period,
                    "date_from": date_from,
                    "date_to": date_to,
                    "group_by": group_by,
                },
                "revenue_rule": "Revenue, average order value, coupon discounts, delivery revenue, and top products exclude cancelled orders. Pending orders are included until cancelled.",
                "kpis": {
                    "total_revenue": decimal_to_float(revenue_total),
                    "total_orders": orders.count(),
                    "average_order_value": decimal_to_float(average_order_value),
                    "total_customers": len(customer_keys),
                    "pending_orders": status_counts.get(Order.STATUS_PENDING, 0),
                    "confirmed_orders": status_counts.get(Order.STATUS_CONFIRMED, 0),
                    "processing_orders": status_counts.get(Order.STATUS_PROCESSING, 0),
                    "shipped_orders": status_counts.get(Order.STATUS_SHIPPED, 0),
                    "delivered_orders": status_counts.get(Order.STATUS_DELIVERED, 0),
                    "cancelled_orders": status_counts.get(Order.STATUS_CANCELLED, 0),
                    "total_products": Product.objects.count(),
                    "low_stock_products": low_stock_products.count(),
                    "out_of_stock_products": out_of_stock_products.count(),
                    "total_coupon_discounts": decimal_to_float(coupon_discounts),
                    "total_delivery_revenue": decimal_to_float(delivery_revenue),
                },
                "charts": {
                    "revenue_by_period": [
                        {
                            "date": item["date"],
                            "label": item["label"],
                            "revenue": item["revenue"],
                        }
                        for item in trend_data
                    ],
                    "orders_by_period": [
                        {
                            "date": item["date"],
                            "label": item["label"],
                            "orders": item["orders"],
                        }
                        for item in trend_data
                    ],
                    "trend": trend_data,
                    "order_status_distribution": status_distribution,
                    "top_selling_products_by_quantity": [
                        format_top_product(row) for row in top_by_quantity
                    ],
                    "top_selling_products_by_revenue": [
                        format_top_product(row) for row in top_by_revenue
                    ],
                    "coupon_usage": coupon_usage,
                },
                "recent_orders": recent_orders,
                "low_stock_products": low_stock_data,
            }
        )
