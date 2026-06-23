from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("store", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="StoreSettings",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("store_name", models.CharField(default="ECOM 3D STORE", max_length=160)),
                ("phone", models.CharField(default="+212 600 000 000", max_length=40)),
                ("whatsapp", models.CharField(default="212600000000", max_length=40)),
                ("email", models.EmailField(default="concierge@ecom3d.local", max_length=254)),
                (
                    "address",
                    models.CharField(
                        default="Casablanca luxury dispatch studio",
                        max_length=255,
                    ),
                ),
                (
                    "instagram",
                    models.URLField(blank=True, default="https://www.instagram.com"),
                ),
                (
                    "facebook",
                    models.URLField(blank=True, default="https://www.facebook.com"),
                ),
                (
                    "delivery_price",
                    models.DecimalField(decimal_places=2, default=9.0, max_digits=10),
                ),
                (
                    "free_delivery_threshold",
                    models.DecimalField(decimal_places=2, default=500.0, max_digits=10),
                ),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name_plural": "Store settings",
            },
        ),
    ]
