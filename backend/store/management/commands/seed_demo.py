from decimal import Decimal
from io import BytesIO
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from PIL import Image

from store.models import Category, Product


BASE_QUERY = "?auto=format&fit=crop&w=1400&q=88"


def unsplash_photo(photo_id):
    return f"https://unsplash.com/photos/{photo_id}/download?force=true&w=1400"


PHOTO_SOURCES = {
    "categories/smartphones.jpg": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9" + BASE_QUERY,
    "categories/laptops-tablets.jpg": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853" + BASE_QUERY,
    "categories/headphones-audio.jpg": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e" + BASE_QUERY,
    "categories/gaming-gear.jpg": unsplash_photo("vSSDUv_iYZU"),
    "categories/wearables.jpg": "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9" + BASE_QUERY,
    "categories/tech-accessories.jpg": unsplash_photo("XxvKhAUs2PA"),
    "products/nova-edge-smartphone.jpg": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9" + BASE_QUERY,
    "products/aurora-fold-smartphone.jpg": "https://images.unsplash.com/photo-1598327105666-5b89351aff97" + BASE_QUERY,
    "products/obsidian-camera-phone.jpg": "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5" + BASE_QUERY,
    "products/orion-pro-laptop.jpg": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853" + BASE_QUERY,
    "products/celeste-ultra-tablet.jpg": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0" + BASE_QUERY,
    "products/slatebook-air-laptop.jpg": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8" + BASE_QUERY,
    "products/studio-view-monitor.jpg": unsplash_photo("h8Ot-KfpHVs"),
    "products/nocturne-halo-headphones.jpg": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e" + BASE_QUERY,
    "products/pulse-wireless-earbuds.jpg": "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46" + BASE_QUERY,
    "products/monolith-speaker-360.jpg": unsplash_photo("eeEsmrTVH7Q"),
    "products/streamcast-microphone.jpg": "https://images.unsplash.com/photo-1590602847861-f357a9332bbc" + BASE_QUERY,
    "products/apex-mechanical-keyboard.jpg": unsplash_photo("tBG35b1ju2U"),
    "products/vanta-gaming-mouse.jpg": unsplash_photo("vSSDUv_iYZU"),
    "products/phantom-gaming-headset.jpg": "https://images.unsplash.com/photo-1599669454699-248893623440" + BASE_QUERY,
    "products/nebula-game-controller.jpg": "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3" + BASE_QUERY,
    "products/aurum-active-smartwatch.jpg": "https://images.unsplash.com/photo-1523275335684-37898b6baf30" + BASE_QUERY,
    "products/celeste-sport-smartwatch.jpg": "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9" + BASE_QUERY,
    "products/eclipse-smart-ring.jpg": unsplash_photo("MdFNFErNOz4"),
    "products/vanta-usb-c-hub.jpg": unsplash_photo("XxvKhAUs2PA"),
    "products/voltmax-power-bank.jpg": unsplash_photo("SzyTG1SqGEQ"),
    "products/magdock-wireless-charger.jpg": unsplash_photo("M9MwL-5CC_A"),
    "products/shield-external-ssd.jpg": unsplash_photo("qqJXQd7EJV4"),
}


def download_photo(url):
    request = Request(
        url,
        headers={
            "User-Agent": "ECOM-3D-STORE-tech-catalog-downloader/1.0",
            "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        },
    )
    with urlopen(request, timeout=45) as response:
        return response.read()


def normalize_photo(image_bytes, size=(1200, 900)):
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    src_ratio = image.width / image.height
    target_ratio = size[0] / size[1]
    if src_ratio > target_ratio:
        new_width = int(image.height * target_ratio)
        left = (image.width - new_width) // 2
        image = image.crop((left, 0, left + new_width, image.height))
    else:
        new_height = int(image.width / target_ratio)
        top = (image.height - new_height) // 2
        image = image.crop((0, top, image.width, top + new_height))
    return image.resize(size, Image.Resampling.LANCZOS)


def ensure_photo(relative_path):
    target = Path(settings.MEDIA_ROOT) / relative_path
    if target.exists():
        return relative_path

    source = PHOTO_SOURCES.get(relative_path)
    if not source:
        raise CommandError(f"No tech product photo source configured for {relative_path}.")

    target.parent.mkdir(parents=True, exist_ok=True)
    try:
        image = normalize_photo(download_photo(source))
        image.save(target, "JPEG", quality=88, optimize=True, progressive=True)
    except (HTTPError, URLError, OSError, TimeoutError) as exc:
        raise CommandError(
            f"Real tech product photo missing for {relative_path}. "
            "Provide a local JPG manually or restore internet access for seed_demo."
        ) from exc
    return relative_path


CATEGORY_DATA = [
    ("Smartphones", "smartphones", "categories/smartphones.jpg"),
    ("Laptops & Tablets", "laptops-tablets", "categories/laptops-tablets.jpg"),
    ("Headphones & Audio", "headphones-audio", "categories/headphones-audio.jpg"),
    ("Gaming Gear", "gaming-gear", "categories/gaming-gear.jpg"),
    ("Smart Watches & Wearables", "wearables", "categories/wearables.jpg"),
    ("Tech Accessories", "tech-accessories", "categories/tech-accessories.jpg"),
]


PRODUCT_DATA = [
    {
        "name": "Nova Edge Smartphone",
        "slug": "nova-edge-smartphone",
        "category": "smartphones",
        "description": "A premium glass smartphone with a vivid edge display, fast daily performance, and a clean pro camera layout.",
        "price": Decimal("999.00"),
        "old_price": Decimal("1199.00"),
        "image": "products/nova-edge-smartphone.jpg",
        "stock": 18,
        "low_stock_threshold": 5,
        "rating": Decimal("4.82"),
        "is_featured": True,
    },
    {
        "name": "Aurora Fold 5G",
        "slug": "aurora-fold-smartphone",
        "category": "smartphones",
        "description": "A flagship 5G smartphone experience with a cinematic display, polished software, and pocket-ready power.",
        "price": Decimal("1799.00"),
        "old_price": Decimal("2099.00"),
        "image": "products/aurora-fold-smartphone.jpg",
        "stock": 9,
        "low_stock_threshold": 4,
        "rating": Decimal("4.88"),
        "is_featured": True,
    },
    {
        "name": "Obsidian Camera Phone",
        "slug": "obsidian-camera-phone",
        "category": "smartphones",
        "description": "A pro camera phone for creators, with a sharp screen, premium hand feel, and reliable all-day battery life.",
        "price": Decimal("1199.00"),
        "old_price": Decimal("1399.00"),
        "image": "products/obsidian-camera-phone.jpg",
        "stock": 15,
        "low_stock_threshold": 5,
        "rating": Decimal("4.74"),
        "is_featured": False,
    },
    {
        "name": "Orion Pro Laptop",
        "slug": "orion-pro-laptop",
        "category": "laptops-tablets",
        "description": "A slim premium laptop for work and creative flow, with a clean display, responsive keyboard, and travel-ready frame.",
        "price": Decimal("1499.00"),
        "old_price": Decimal("1799.00"),
        "image": "products/orion-pro-laptop.jpg",
        "stock": 13,
        "low_stock_threshold": 5,
        "rating": Decimal("4.76"),
        "is_featured": True,
    },
    {
        "name": "Celeste Ultra Tablet",
        "slug": "celeste-ultra-tablet",
        "category": "laptops-tablets",
        "description": "A lightweight tablet with a luminous glass display, responsive touch controls, and elegant couch-to-studio versatility.",
        "price": Decimal("799.00"),
        "old_price": Decimal("949.00"),
        "image": "products/celeste-ultra-tablet.jpg",
        "stock": 20,
        "low_stock_threshold": 6,
        "rating": Decimal("4.66"),
        "is_featured": False,
    },
    {
        "name": "SlateBook Air Laptop",
        "slug": "slatebook-air-laptop",
        "category": "laptops-tablets",
        "description": "A thin performance laptop with cool lighting, premium aluminum feel, and a quiet productivity footprint.",
        "price": Decimal("1299.00"),
        "old_price": Decimal("1549.00"),
        "image": "products/slatebook-air-laptop.jpg",
        "stock": 8,
        "low_stock_threshold": 5,
        "rating": Decimal("4.70"),
        "is_featured": False,
    },
    {
        "name": "StudioView 4K Monitor",
        "slug": "studio-view-monitor",
        "category": "laptops-tablets",
        "description": "A premium desk monitor for immersive work, pairing crisp visuals with a modern productivity setup.",
        "price": Decimal("699.00"),
        "old_price": Decimal("849.00"),
        "image": "products/studio-view-monitor.jpg",
        "stock": 11,
        "low_stock_threshold": 4,
        "rating": Decimal("4.64"),
        "is_featured": False,
    },
    {
        "name": "Nocturne Halo Headphones",
        "slug": "nocturne-halo-headphones",
        "category": "headphones-audio",
        "description": "Premium wireless over-ear headphones with soft cushions, deep listening comfort, and clean studio sound.",
        "price": Decimal("649.00"),
        "old_price": Decimal("799.00"),
        "image": "products/nocturne-halo-headphones.jpg",
        "stock": 22,
        "low_stock_threshold": 5,
        "rating": Decimal("4.80"),
        "is_featured": True,
    },
    {
        "name": "Pulse Wireless Earbuds",
        "slug": "pulse-wireless-earbuds",
        "category": "headphones-audio",
        "description": "Compact true wireless earbuds with a premium charging case, low-latency listening, and vivid neon styling.",
        "price": Decimal("229.00"),
        "old_price": Decimal("299.00"),
        "image": "products/pulse-wireless-earbuds.jpg",
        "stock": 35,
        "low_stock_threshold": 7,
        "rating": Decimal("4.58"),
        "is_featured": False,
    },
    {
        "name": "Monolith Speaker 360",
        "slug": "monolith-speaker-360",
        "category": "headphones-audio",
        "description": "A compact portable speaker with a premium mesh face, carry cord, and room-filling everyday sound.",
        "price": Decimal("399.00"),
        "old_price": Decimal("499.00"),
        "image": "products/monolith-speaker-360.jpg",
        "stock": 16,
        "low_stock_threshold": 5,
        "rating": Decimal("4.75"),
        "is_featured": True,
    },
    {
        "name": "StreamCast Microphone",
        "slug": "streamcast-microphone",
        "category": "headphones-audio",
        "description": "A studio-style streaming microphone for podcasts, gaming, and live sessions with clean desk presence.",
        "price": Decimal("189.00"),
        "old_price": Decimal("239.00"),
        "image": "products/streamcast-microphone.jpg",
        "stock": 24,
        "low_stock_threshold": 6,
        "rating": Decimal("4.62"),
        "is_featured": False,
    },
    {
        "name": "Apex Mechanical Keyboard",
        "slug": "apex-mechanical-keyboard",
        "category": "gaming-gear",
        "description": "A premium mechanical keyboard with crisp switches, RGB lighting, and a responsive gaming feel.",
        "price": Decimal("249.00"),
        "old_price": Decimal("319.00"),
        "image": "products/apex-mechanical-keyboard.jpg",
        "stock": 30,
        "low_stock_threshold": 8,
        "rating": Decimal("4.72"),
        "is_featured": True,
    },
    {
        "name": "Vanta RGB Gaming Mouse",
        "slug": "vanta-gaming-mouse",
        "category": "gaming-gear",
        "description": "A lightweight gaming mouse with fast glide, sharp click response, and a high-contrast desk setup aesthetic.",
        "price": Decimal("129.00"),
        "old_price": Decimal("169.00"),
        "image": "products/vanta-gaming-mouse.jpg",
        "stock": 42,
        "low_stock_threshold": 8,
        "rating": Decimal("4.57"),
        "is_featured": False,
    },
    {
        "name": "Phantom Gaming Headset",
        "slug": "phantom-gaming-headset",
        "category": "gaming-gear",
        "description": "A closed-back gaming headset with plush isolation, clean mic-ready styling, and immersive session comfort.",
        "price": Decimal("299.00"),
        "old_price": Decimal("379.00"),
        "image": "products/phantom-gaming-headset.jpg",
        "stock": 17,
        "low_stock_threshold": 5,
        "rating": Decimal("4.69"),
        "is_featured": False,
    },
    {
        "name": "Nebula Game Controller",
        "slug": "nebula-game-controller",
        "category": "gaming-gear",
        "description": "A wireless controller for console-style play, with premium grips, low-latency response, and lounge-ready setup.",
        "price": Decimal("159.00"),
        "old_price": Decimal("199.00"),
        "image": "products/nebula-game-controller.jpg",
        "stock": 28,
        "low_stock_threshold": 7,
        "rating": Decimal("4.55"),
        "is_featured": False,
    },
    {
        "name": "Aurum Active Smartwatch",
        "slug": "aurum-active-smartwatch",
        "category": "wearables",
        "description": "A clean round smartwatch with soft straps, daily wellness tracking, and a refined minimal profile.",
        "price": Decimal("449.00"),
        "old_price": Decimal("549.00"),
        "image": "products/aurum-active-smartwatch.jpg",
        "stock": 19,
        "low_stock_threshold": 5,
        "rating": Decimal("4.71"),
        "is_featured": True,
    },
    {
        "name": "Celeste Sport Smartwatch",
        "slug": "celeste-sport-smartwatch",
        "category": "wearables",
        "description": "A wrist-worn sport smartwatch with quick stats, connected alerts, and a lightweight active strap.",
        "price": Decimal("379.00"),
        "old_price": Decimal("459.00"),
        "image": "products/celeste-sport-smartwatch.jpg",
        "stock": 26,
        "low_stock_threshold": 6,
        "rating": Decimal("4.63"),
        "is_featured": False,
    },
    {
        "name": "Eclipse Smart Ring",
        "slug": "eclipse-smart-ring",
        "category": "wearables",
        "description": "A black smart ring with a minimal tech finish, designed for discreet wellness and sleep tracking.",
        "price": Decimal("329.00"),
        "old_price": Decimal("429.00"),
        "image": "products/eclipse-smart-ring.jpg",
        "stock": 42,
        "low_stock_threshold": 6,
        "rating": Decimal("4.60"),
        "is_featured": False,
    },
    {
        "name": "Vanta USB-C Hub",
        "slug": "vanta-usb-c-hub",
        "category": "tech-accessories",
        "description": "A multi-port USB hub with individual switches, compact desk sizing, and practical daily connectivity.",
        "price": Decimal("119.00"),
        "old_price": Decimal("159.00"),
        "image": "products/vanta-usb-c-hub.jpg",
        "stock": 55,
        "low_stock_threshold": 10,
        "rating": Decimal("4.55"),
        "is_featured": False,
    },
    {
        "name": "VoltMax Power Bank",
        "slug": "voltmax-power-bank",
        "category": "tech-accessories",
        "description": "A compact portable charger and phone power setup for daily carry, travel, and backup energy.",
        "price": Decimal("139.00"),
        "old_price": Decimal("189.00"),
        "image": "products/voltmax-power-bank.jpg",
        "stock": 36,
        "low_stock_threshold": 8,
        "rating": Decimal("4.49"),
        "is_featured": False,
    },
    {
        "name": "MagDock Wireless Charger",
        "slug": "magdock-wireless-charger",
        "category": "tech-accessories",
        "description": "A desktop wireless charging dock with upright phone placement, clean cable flow, and modern office styling.",
        "price": Decimal("129.00"),
        "old_price": Decimal("169.00"),
        "image": "products/magdock-wireless-charger.jpg",
        "stock": 23,
        "low_stock_threshold": 6,
        "rating": Decimal("4.52"),
        "is_featured": False,
    },
    {
        "name": "Shield External SSD",
        "slug": "shield-external-ssd",
        "category": "tech-accessories",
        "description": "A portable external SSD for fast project backup, laptop workflows, and compact digital storage.",
        "price": Decimal("229.00"),
        "old_price": Decimal("299.00"),
        "image": "products/shield-external-ssd.jpg",
        "stock": 14,
        "low_stock_threshold": 5,
        "rating": Decimal("4.67"),
        "is_featured": False,
    },
]


class Command(BaseCommand):
    help = "Seed a premium electronics-only catalog with local realistic JPG photos."

    def handle(self, *args, **options):
        categories = {}
        active_category_slugs = [slug for _, slug, _ in CATEGORY_DATA]

        for name, slug, image in CATEGORY_DATA:
            ensure_photo(image)
            category, _ = Category.objects.update_or_create(
                slug=slug,
                defaults={"name": name, "image": image, "is_active": True},
            )
            categories[slug] = category

        product_slugs = []
        for item in PRODUCT_DATA:
            product = item.copy()
            image = product.pop("image")
            category_slug = product.pop("category")
            ensure_photo(image)

            Product.objects.update_or_create(
                slug=product["slug"],
                defaults={
                    **product,
                    "category": categories[category_slug],
                    "image": image,
                    "is_active": True,
                },
            )
            product_slugs.append(product["slug"])

        Product.objects.exclude(slug__in=product_slugs).update(
            is_active=False,
            is_featured=False,
        )
        Category.objects.exclude(slug__in=active_category_slugs).update(is_active=False)

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {len(categories)} electronics categories and {len(product_slugs)} active tech products."
            )
        )
