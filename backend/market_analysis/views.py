from django.db.models import Avg, Max, Min
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AvitoListing
from .serializers import AvitoListingSerializer


def decimal_to_float(value):
    return float(value) if value is not None else None


class AvitoListingListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        listings = AvitoListing.objects.all()
        aggregates = listings.aggregate(
            average_price=Avg("price_value"),
            minimum_price=Min("price_value"),
            maximum_price=Max("price_value"),
            last_scraping_date=Max("scraped_at"),
        )

        return Response(
            {
                "total_listings": listings.count(),
                "demo_count": listings.filter(is_demo=True).count(),
                "live_count": listings.filter(is_demo=False).count(),
                "results": AvitoListingSerializer(listings, many=True).data,
                "stats": {
                    "average_price": decimal_to_float(aggregates["average_price"]),
                    "minimum_price": decimal_to_float(aggregates["minimum_price"]),
                    "maximum_price": decimal_to_float(aggregates["maximum_price"]),
                    "last_scraping_date": aggregates["last_scraping_date"],
                },
            }
        )
