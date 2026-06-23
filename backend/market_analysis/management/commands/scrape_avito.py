from django.core.management.base import BaseCommand, CommandError

from market_analysis.models import AvitoListing
from market_analysis.scraper import AvitoScrapeError, fetch_avito_listings


class Command(BaseCommand):
    help = "Collect a limited set of public Avito listings for market analysis."

    def add_arguments(self, parser):
        parser.add_argument("--url", required=True, help="Public Avito search URL")
        parser.add_argument("--limit", type=int, default=30, help="Maximum 30 listings")
        parser.add_argument(
            "--delay",
            type=float,
            default=1.5,
            help="Polite delay in seconds before the public request",
        )

    def handle(self, *args, **options):
        limit = options["limit"]
        if limit < 1 or limit > 30:
            raise CommandError("--limit must be between 1 and 30.")

        try:
            listings = fetch_avito_listings(
                options["url"],
                limit=limit,
                delay=options["delay"],
            )
        except AvitoScrapeError as exc:
            raise CommandError(str(exc)) from exc

        added = 0
        updated = 0
        for listing in listings:
            _, created = AvitoListing.objects.update_or_create(
                listing_url=listing.listing_url,
                defaults={
                    "title": listing.title,
                    "price_text": listing.price_text,
                    "price_value": listing.price_value,
                    "city": listing.city,
                    "image_url": listing.image_url,
                    "source": "Avito",
                    "is_demo": False,
                },
            )
            if created:
                added += 1
            else:
                updated += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Avito scraping complete: {added} added, {updated} updated "
                f"({len(listings)} processed)."
            )
        )
