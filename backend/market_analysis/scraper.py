import json
import re
import time
from dataclasses import dataclass
from decimal import Decimal
from urllib.parse import urljoin, urlsplit, urlunsplit

import requests
from bs4 import BeautifulSoup


AVITO_HOSTS = {"avito.ma", "www.avito.ma"}
PRICE_PATTERN = re.compile(r"(?P<price>[\d\s.,]+)\s*(?:DH|MAD)", re.IGNORECASE)
LISTING_PATH_PATTERN = re.compile(r"(?:\.htm$|/annonce/|_\d{5,})", re.IGNORECASE)
BLOCK_PAGE_MARKERS = (
    "enable javascript and cookies to continue",
    "cf-challenge",
    "challenge-platform",
    "captcha",
)


class AvitoScrapeError(RuntimeError):
    pass


@dataclass(frozen=True)
class ScrapedListing:
    title: str
    price_text: str
    price_value: Decimal | None
    city: str | None
    image_url: str | None
    listing_url: str


def clean_text(value):
    return " ".join(str(value or "").replace("\xa0", " ").split()).strip()


def normalize_url(value, base_url):
    if not value:
        return None
    absolute = urljoin(base_url, str(value).strip())
    parts = urlsplit(absolute)
    if parts.scheme not in {"http", "https"}:
        return None
    return urlunsplit((parts.scheme, parts.netloc, parts.path, "", ""))


def parse_price(price_text):
    text = clean_text(price_text)
    match = PRICE_PATTERN.search(text)
    if not match:
        return None
    digits = re.sub(r"\D", "", match.group("price"))
    return Decimal(digits) if digits else None


def image_value(value):
    if isinstance(value, list):
        return value[0] if value else None
    if isinstance(value, dict):
        return value.get("url") or value.get("contentUrl")
    return value


def address_city(value):
    if not isinstance(value, dict):
        return None
    address = value.get("address") if isinstance(value.get("address"), dict) else value
    return clean_text(
        address.get("addressLocality")
        or address.get("addressRegion")
        or address.get("addressCountry")
    ) or None


def listing_from_structured_data(value, base_url):
    if not isinstance(value, dict):
        return None

    item = value.get("item") if isinstance(value.get("item"), dict) else value
    title = clean_text(item.get("name") or item.get("title"))
    listing_url = normalize_url(item.get("url"), base_url)
    if not title or not listing_url or not is_listing_url(listing_url):
        return None

    offers = item.get("offers")
    if isinstance(offers, list):
        offers = offers[0] if offers else {}
    offers = offers if isinstance(offers, dict) else {}
    raw_price = offers.get("price") or item.get("price")
    currency = offers.get("priceCurrency") or "DH"
    price_text = clean_text(f"{raw_price} {currency}") if raw_price is not None else ""
    price_value = None
    if raw_price is not None:
        try:
            price_value = Decimal(str(raw_price).replace(",", "."))
        except Exception:
            price_value = parse_price(price_text)

    image_url = normalize_url(image_value(item.get("image")), base_url)
    city = address_city(item.get("address") or item.get("location"))
    return ScrapedListing(
        title=title,
        price_text=price_text,
        price_value=price_value,
        city=city,
        image_url=image_url,
        listing_url=listing_url,
    )


def walk_json(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from walk_json(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk_json(child)


def is_listing_url(value):
    if not value:
        return False
    parts = urlsplit(value)
    return parts.netloc.lower() in AVITO_HOSTS and bool(
        LISTING_PATH_PATTERN.search(parts.path)
    )


def first_text(node, selectors):
    for selector in selectors:
        match = node.select_one(selector)
        if match:
            value = clean_text(match.get("content") or match.get_text(" ", strip=True))
            if value:
                return value
    return ""


def find_card(anchor):
    node = anchor
    for _ in range(6):
        node = node.parent
        if node is None:
            break
        test_id = str(node.attrs.get("data-testid", "")).lower()
        if node.name in {"article", "li"} or "ad-card" in test_id or "listing" in test_id:
            return node
    return anchor.parent or anchor


def extract_image(card, base_url):
    image = card.select_one("img")
    if not image:
        return None
    source = (
        image.get("src")
        or image.get("data-src")
        or image.get("data-lazy-src")
    )
    if not source and image.get("srcset"):
        source = image.get("srcset").split(",")[0].strip().split(" ")[0]
    return normalize_url(source, base_url)


def parse_avito_html(html, base_url, limit=30):
    soup = BeautifulSoup(html, "html.parser")
    found = {}

    for script in soup.select('script[type="application/ld+json"], script#__NEXT_DATA__'):
        try:
            payload = json.loads(script.string or script.get_text())
        except (TypeError, json.JSONDecodeError):
            continue
        for node in walk_json(payload):
            listing = listing_from_structured_data(node, base_url)
            if listing:
                found[listing.listing_url] = listing
                if len(found) >= limit:
                    return list(found.values())

    for anchor in soup.select("a[href]"):
        listing_url = normalize_url(anchor.get("href"), base_url)
        if not is_listing_url(listing_url) or listing_url in found:
            continue

        card = find_card(anchor)
        title = clean_text(
            anchor.get("title")
            or first_text(
                card,
                (
                    '[data-testid*="title"]',
                    "[itemprop='name']",
                    "h2",
                    "h3",
                    "p",
                ),
            )
        )
        card_text = clean_text(card.get_text(" ", strip=True))
        price_match = PRICE_PATTERN.search(card_text)
        price_text = clean_text(price_match.group(0)) if price_match else ""
        if not title:
            continue

        city = first_text(
            card,
            (
                '[data-testid*="location"]',
                '[data-testid*="city"]',
                "[itemprop='addressLocality']",
            ),
        ) or None
        found[listing_url] = ScrapedListing(
            title=title,
            price_text=price_text,
            price_value=parse_price(price_text),
            city=city,
            image_url=extract_image(card, base_url),
            listing_url=listing_url,
        )
        if len(found) >= limit:
            break

    return list(found.values())


def validate_avito_url(url):
    parts = urlsplit(url)
    if parts.scheme not in {"http", "https"} or parts.netloc.lower() not in AVITO_HOSTS:
        raise AvitoScrapeError("Only public https://www.avito.ma URLs are accepted.")


def fetch_avito_listings(url, limit=30, delay=1.5, timeout=25):
    validate_avito_url(url)
    safe_limit = max(1, min(int(limit), 30))
    time.sleep(max(0.0, float(delay)))
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0 Safari/537.36"
        ),
        "Accept-Language": "fr-MA,fr;q=0.9,en;q=0.7",
        "Accept": "text/html,application/xhtml+xml",
    }

    try:
        response = requests.get(url, headers=headers, timeout=timeout)
    except requests.RequestException as exc:
        raise AvitoScrapeError(f"Avito request failed: {exc}") from exc

    body_lower = response.text.lower()
    if response.status_code in {403, 429} or any(
        marker in body_lower for marker in BLOCK_PAGE_MARKERS
    ):
        raise AvitoScrapeError(
            "Avito blocked the automated request or requested a browser challenge. "
            "No bypass was attempted; wait and retry only if Avito permits access."
        )
    try:
        response.raise_for_status()
    except requests.RequestException as exc:
        raise AvitoScrapeError(
            f"Avito returned HTTP {response.status_code}."
        ) from exc

    listings = parse_avito_html(response.text, url, safe_limit)
    if not listings:
        raise AvitoScrapeError(
            "No public listings were found. Avito may have changed its page markup."
        )
    return listings
