from rest_framework import serializers

from .models import AvitoListing


class AvitoListingSerializer(serializers.ModelSerializer):
    class Meta:
        model = AvitoListing
        fields = (
            "id",
            "title",
            "price_text",
            "price_value",
            "city",
            "image_url",
            "listing_url",
            "scraped_at",
            "source",
            "is_demo",
        )
