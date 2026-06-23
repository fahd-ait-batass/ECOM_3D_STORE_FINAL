from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import UserProfile


ADMIN_USERNAME = "admin"
ADMIN_EMAIL = "fahdmama1@gmail.com"
ADMIN_PASSWORD = "Admin@12345"


class Command(BaseCommand):
    help = "Create or refresh the default ECOM 3D administrator account."

    @transaction.atomic
    def handle(self, *args, **options):
        User = get_user_model()
        user, created = User.objects.get_or_create(username=ADMIN_USERNAME)

        user.email = ADMIN_EMAIL
        user.is_active = True
        user.is_staff = True
        user.is_superuser = True
        user.set_password(ADMIN_PASSWORD)
        user.save()
        UserProfile.objects.get_or_create(user=user)

        action = "created" if created else "updated"
        self.stdout.write(
            self.style.SUCCESS(
                "\n".join(
                    (
                        f"Default admin account {action} successfully.",
                        f"Username: {ADMIN_USERNAME}",
                        f"Email: {ADMIN_EMAIL}",
                        f"Password: {ADMIN_PASSWORD}",
                        "Staff access: enabled",
                        "Superuser access: enabled",
                    )
                )
            )
        )
