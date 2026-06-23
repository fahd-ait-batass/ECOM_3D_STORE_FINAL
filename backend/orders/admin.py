from django.contrib import admin

from .models import Coupon, Order, OrderItem


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = (
        "code",
        "discount_type",
        "discount_value",
        "minimum_order_amount",
        "maximum_discount_amount",
        "usage_limit",
        "used_count",
        "is_active",
        "valid_from",
        "valid_until",
    )
    list_filter = ("discount_type", "is_active", "valid_from", "valid_until")
    search_fields = ("code",)
    readonly_fields = ("used_count", "created_at")


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("price",)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "full_name",
        "email",
        "phone",
        "city",
        "payment_method",
        "subtotal",
        "coupon_code",
        "discount_amount",
        "delivery_price",
        "total_price",
        "status",
        "tracking_number",
        "created_at",
        "updated_at",
    )
    list_filter = ("status", "payment_method", "city", "created_at", "updated_at")
    search_fields = (
        "full_name",
        "email",
        "phone",
        "city",
        "address",
        "tracking_number",
        "user__username",
        "user__email",
    )
    inlines = [OrderItemInline]


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ("order", "product", "quantity", "price")
    list_filter = ("product",)
    search_fields = ("order__full_name", "product__name")
