# Generated for ECOM_3D_STORE phase 2.

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("orders", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="payment_method",
            field=models.CharField(
                choices=[
                    ("cash_on_delivery", "Cash on delivery"),
                    ("whatsapp_order", "WhatsApp order"),
                ],
                default="cash_on_delivery",
                max_length=32,
            ),
        ),
    ]
