from decimal import Decimal

from django.core.management.base import BaseCommand

from market_analysis.models import AvitoListing


DEMO_LISTINGS = (
    {
        "title": "Nova Edge 5G Smartphone 256 GB",
        "price": "5 400 DH",
        "value": "5400",
        "city": "Casablanca",
        "image": "/media/products/nova-edge-smartphone.jpg",
    },
    {
        "title": "Aurora Fold Premium Smartphone",
        "price": "8 900 DH",
        "value": "8900",
        "city": "Rabat",
        "image": "/media/products/aurora-fold-smartphone.jpg",
    },
    {
        "title": "Orion Pro Laptop 15 pouces",
        "price": "11 200 DH",
        "value": "11200",
        "city": "Casablanca",
        "image": "/media/products/orion-pro-laptop.jpg",
    },
    {
        "title": "SlateBook Air Ultrabook",
        "price": "8 500 DH",
        "value": "8500",
        "city": "Marrakech",
        "image": "/media/products/slatebook-air-laptop.jpg",
    },
    {
        "title": "Nocturne Halo Wireless Headphones",
        "price": "1 450 DH",
        "value": "1450",
        "city": "Tanger",
        "image": "/media/products/nocturne-halo-headphones.jpg",
    },
    {
        "title": "Pulse Pro Wireless Earbuds",
        "price": "780 DH",
        "value": "780",
        "city": "Agadir",
        "image": "/media/products/pulse-wireless-earbuds.jpg",
    },
    {
        "title": "Aurum Active Smartwatch",
        "price": "1 850 DH",
        "value": "1850",
        "city": "Fes",
        "image": "/media/products/aurum-active-smartwatch.jpg",
    },
    {
        "title": "Celeste Sport Smartwatch",
        "price": "1 350 DH",
        "value": "1350",
        "city": "Kenitra",
        "image": "/media/products/celeste-sport-smartwatch.jpg",
    },
    {
        "title": "Nebula Wireless Gaming Controller",
        "price": "620 DH",
        "value": "620",
        "city": "Casablanca",
        "image": "/media/products/nebula-game-controller.jpg",
    },
    {
        "title": "Phantom RGB Gaming Headset",
        "price": "980 DH",
        "value": "980",
        "city": "Rabat",
        "image": "/media/products/phantom-gaming-headset.jpg",
    },
    {
        "title": "Vanta 8-in-1 USB-C Hub",
        "price": "420 DH",
        "value": "420",
        "city": "Marrakech",
        "image": "/media/products/vanta-usb-c-hub.jpg",
    },
    {
        "title": "VoltMax 20 000 mAh Power Bank",
        "price": "350 DH",
        "value": "350",
        "city": "Agadir",
        "image": "/media/products/voltmax-power-bank.jpg",
    },
)


class Command(BaseCommand):
    help = "Insert or refresh 12 presentation listings for Avito Market Analysis."

    def handle(self, *args, **options):
        added = 0
        updated = 0

        for index, item in enumerate(DEMO_LISTINGS, start=1):
            _, created = AvitoListing.objects.update_or_create(
                listing_url=f"https://www.avito.ma/#ecom3d-demo-{index:02d}",
                defaults={
                    "title": item["title"],
                    "price_text": item["price"],
                    "price_value": Decimal(item["value"]),
                    "city": item["city"],
                    "image_url": item["image"],
                    "source": "Avito",
                    "is_demo": True,
                },
            )
            if created:
                added += 1
            else:
                updated += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Avito demo seed complete: {added} added, {updated} updated "
                f"({len(DEMO_LISTINGS)} demo listings available)."
            )
        )
