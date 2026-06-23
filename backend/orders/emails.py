import logging
from decimal import Decimal

from django.conf import settings as django_settings
from django.core.exceptions import ValidationError
from django.core.mail import EmailMultiAlternatives
from django.core.validators import validate_email
from django.template.loader import render_to_string
from django.utils import timezone

from store.models import StoreSettings

from .models import Order


logger = logging.getLogger(__name__)


def is_valid_email(value):
    email = (value or "").strip()
    if not email:
        return False
    try:
        validate_email(email)
    except ValidationError:
        return False
    return True


def money(value):
    return Decimal(value or 0).quantize(Decimal("0.01"))


def order_number(order):
    return f"EC3D-{order.pk:06d}"


def get_email_order(order_id):
    return (
        Order.objects.select_related("user")
        .prefetch_related("items__product")
        .get(pk=order_id)
    )


def build_order_context(order):
    store_settings = StoreSettings.load()
    items = []
    for item in order.items.all():
        items.append(
            {
                "name": item.product.name if item.product_id else "Product",
                "quantity": item.quantity,
                "price": money(item.price),
                "line_total": money(item.price * item.quantity),
            }
        )

    return {
        "order": order,
        "order_number": order_number(order),
        "items": items,
        "store": store_settings,
        "subtotal": money(order.subtotal),
        "discount_amount": money(order.discount_amount),
        "delivery_price": money(order.delivery_price),
        "total_price": money(order.total_price),
        "payment_label": order.get_payment_method_display(),
        "status_label": order.get_status_display(),
        "updated_at": timezone.localtime(order.updated_at),
    }


def send_templated_email(subject, recipient, template_base, context):
    if not is_valid_email(recipient):
        return False

    try:
        text_body = render_to_string(f"emails/{template_base}.txt", context)
        html_body = render_to_string(f"emails/{template_base}.html", context)
        message = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=django_settings.DEFAULT_FROM_EMAIL,
            to=[recipient],
        )
        message.attach_alternative(html_body, "text/html")
        message.send(fail_silently=False)
        return True
    except Exception:
        logger.exception("Could not send %s email to %s.", template_base, recipient)
        return False


def send_order_confirmation_email(order):
    if isinstance(order, int):
        order = get_email_order(order)
    if not is_valid_email(order.email):
        return False

    context = build_order_context(order)
    subject = f"Your {context['store'].store_name} order {context['order_number']}"
    return send_templated_email(subject, order.email, "order_confirmation", context)


def send_admin_new_order_email(order):
    if isinstance(order, int):
        order = get_email_order(order)
    store_settings = StoreSettings.load()
    if not is_valid_email(store_settings.email):
        return False

    context = build_order_context(order)
    subject = f"New order {context['order_number']} - {store_settings.store_name}"
    return send_templated_email(subject, store_settings.email, "admin_new_order", context)


def send_order_created_emails(order_id):
    try:
        order = get_email_order(order_id)
    except Order.DoesNotExist:
        logger.warning("Skipped order emails because order %s no longer exists.", order_id)
        return

    send_order_confirmation_email(order)
    send_admin_new_order_email(order)


def send_order_status_update_email(order, previous_status="", previous_tracking_number=""):
    if isinstance(order, int):
        order = get_email_order(order)
    if not is_valid_email(order.email):
        return False

    status_changed = previous_status != order.status
    tracking_changed = (previous_tracking_number or "") != (order.tracking_number or "")
    useful_tracking_update = tracking_changed and bool(order.tracking_number)
    if not status_changed and not useful_tracking_update:
        return False

    context = build_order_context(order)
    context.update(
        {
            "previous_status": previous_status,
            "previous_tracking_number": previous_tracking_number,
            "status_changed": status_changed,
            "tracking_changed": tracking_changed,
        }
    )
    subject = f"Order {context['order_number']} update: {context['status_label']}"
    return send_templated_email(subject, order.email, "order_status_update", context)
