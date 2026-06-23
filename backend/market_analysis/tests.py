from decimal import Decimal

from django.core.management import call_command
from django.test import TestCase
from rest_framework.test import APIClient

from .models import AvitoListing
from .scraper import parse_avito_html


SAMPLE_HTML = """
<html>
  <body>
    <article data-testid="ad-card">
      <a href="/fr/casablanca/telephones/telephone_premium_12345678.htm">
        <img src="https://content.avito.ma/images/phone.jpg" alt="Telephone premium">
        <h2 data-testid="ad-title">Telephone premium</h2>
        <p data-testid="ad-price">4 500 DH</p>
        <span data-testid="ad-location">Casablanca</span>
      </a>
    </article>
  </body>
</html>
"""


class AvitoParserTests(TestCase):
    def test_public_listing_fields_are_parsed(self):
        listings = parse_avito_html(SAMPLE_HTML, "https://www.avito.ma/", limit=30)

        self.assertEqual(len(listings), 1)
        self.assertEqual(listings[0].title, "Telephone premium")
        self.assertEqual(listings[0].price_value, Decimal("4500"))
        self.assertEqual(listings[0].city, "Casablanca")

    def test_public_api_returns_stats(self):
        AvitoListing.objects.create(
            title="Telephone premium",
            price_text="4 500 DH",
            price_value=Decimal("4500"),
            city="Casablanca",
            listing_url=(
                "https://www.avito.ma/fr/casablanca/telephones/"
                "telephone_premium_12345678.htm"
            ),
            is_demo=True,
        )

        response = APIClient().get("/api/avito-listings/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["total_listings"], 1)
        self.assertEqual(response.data["demo_count"], 1)
        self.assertEqual(response.data["live_count"], 0)
        self.assertEqual(response.data["stats"]["average_price"], 4500.0)

    def test_demo_seed_is_idempotent(self):
        call_command("seed_avito_demo")
        call_command("seed_avito_demo")

        self.assertEqual(AvitoListing.objects.filter(is_demo=True).count(), 12)
        self.assertEqual(AvitoListing.objects.filter(is_demo=False).count(), 0)
