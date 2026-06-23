from django.contrib import admin

from .models import Category, Product, Review, StoreSettings, WishlistItem


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active")
    list_filter = ("is_active",)
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name",)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "category",
        "price",
        "old_price",
        "stock",
        "low_stock_threshold",
        "stock_status",
        "rating",
        "is_featured",
        "is_active",
        "created_at",
    )
    list_filter = ("category", "is_featured", "is_active", "created_at")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name", "description")

    @admin.display(description="Stock status")
    def stock_status(self, obj):
        return obj.stock_status


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = (
        "product",
        "user",
        "rating",
        "title",
        "is_approved",
        "created_at",
        "updated_at",
    )
    list_filter = ("is_approved", "rating", "created_at", "updated_at")
    search_fields = ("product__name", "user__username", "user__email", "title", "comment")


@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):
    list_display = ("user", "product", "created_at")
    list_filter = ("created_at",)
    search_fields = ("user__username", "user__email", "product__name")


@admin.register(StoreSettings)
class StoreSettingsAdmin(admin.ModelAdmin):
    list_display = (
        "store_name",
        "phone",
        "whatsapp",
        "email",
        "delivery_price",
        "free_delivery_threshold",
        "currency",
    )
