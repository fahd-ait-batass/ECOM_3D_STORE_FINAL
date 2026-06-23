from django.conf import settings
from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True)
    image = models.ImageField(upload_to="categories/", blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name


class Product(models.Model):
    STOCK_IN = "in_stock"
    STOCK_LOW = "low_stock"
    STOCK_OUT = "out_of_stock"

    name = models.CharField(max_length=180)
    slug = models.SlugField(max_length=200, unique=True)
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="products",
    )
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    old_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
    )
    image = models.ImageField(upload_to="products/", blank=True, null=True)
    stock = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=5)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=5.00)
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name

    @property
    def stock_status(self):
        if self.stock <= 0:
            return self.STOCK_OUT
        if self.low_stock_threshold and self.stock <= self.low_stock_threshold:
            return self.STOCK_LOW
        return self.STOCK_IN


class Review(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    rating = models.PositiveSmallIntegerField()
    title = models.CharField(max_length=140, blank=True)
    comment = models.TextField()
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["product", "user"],
                name="store_review_one_per_user_product",
            ),
        ]

    def __str__(self):
        return f"{self.product.name} review by {self.user}"


class WishlistItem(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wishlist_items",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="wishlist_items",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "product"],
                name="store_wishlist_one_item_per_user_product",
            ),
        ]

    def __str__(self):
        return f"{self.user} saved {self.product.name}"


class StoreSettings(models.Model):
    store_name = models.CharField(max_length=160, default="ECOM 3D")
    phone = models.CharField(max_length=40, default="+212 600280950")
    whatsapp = models.CharField(max_length=40, default="+212 600 280950")
    email = models.EmailField(default="fahdmama1@gmail.com")
    address = models.CharField(
        max_length=255,
        default="Marrakech, Maroc",
    )
    instagram = models.URLField(blank=True, default="https://www.instagram.com")
    facebook = models.URLField(blank=True, default="https://www.facebook.com")
    delivery_price = models.DecimalField(max_digits=10, decimal_places=2, default=35.00)
    free_delivery_threshold = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=500.00,
    )
    currency = models.CharField(max_length=8, default="MAD")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Store settings"

    @classmethod
    def load(cls):
        settings, _ = cls.objects.get_or_create(pk=1)
        return settings

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def __str__(self):
        return self.store_name
