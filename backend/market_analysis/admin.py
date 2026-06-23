from django.contrib import admin

from .models import AvitoListing


@admin.register(AvitoListing)
class AvitoListingAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "price_text",
        "price_value",
        "city",
        "source",
        "is_demo",
        "scraped_at",
    )
    list_filter = ("is_demo", "source", "city", "scraped_at")
    search_fields = ("title", "city", "listing_url")
    readonly_fields = ("scraped_at",)
