from django.db import models


class AvitoListing(models.Model):
    title = models.CharField(max_length=255)
    price_text = models.CharField(max_length=100, blank=True)
    price_value = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )
    city = models.CharField(max_length=120, null=True, blank=True)
    image_url = models.URLField(max_length=1000, null=True, blank=True)
    listing_url = models.URLField(max_length=1000, unique=True)
    scraped_at = models.DateTimeField(auto_now=True)
    source = models.CharField(max_length=40, default="Avito")
    is_demo = models.BooleanField(default=False)

    class Meta:
        ordering = ("-scraped_at", "-id")

    def __str__(self):
        return self.title
