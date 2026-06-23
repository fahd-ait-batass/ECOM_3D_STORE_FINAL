from decimal import Decimal, ROUND_HALF_UP
from collections import defaultdict

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from store.models import Product, StoreSettings
from store.serializers import ProductSerializer

from .models import Coupon, Order, OrderItem


MONEY_QUANT = Decimal("0.01")


def money(value):
    return Decimal(value or 0).quantize(MONEY_QUANT, rounding=ROUND_HALF_UP)


def normalize_coupon_code(value):
    return (value or "").strip().upper()


def calculate_coupon_discount(coupon, subtotal):
    subtotal = money(subtotal)
    if coupon.discount_type == Coupon.DISCOUNT_PERCENTAGE:
        discount = subtotal * money(coupon.discount_value) / Decimal("100")
    else:
        discount = money(coupon.discount_value)

    if coupon.maximum_discount_amount is not None:
        discount = min(discount, money(coupon.maximum_discount_amount))

    return min(money(discount), subtotal)


def validate_coupon_instance(coupon, subtotal):
    subtotal = money(subtotal)
    now = timezone.now()
    discount_amount = Decimal("0.00")
    message = "Promo code applied."
    valid = True

    if not coupon.is_active:
        valid = False
        message = "Promo code is inactive."
    elif coupon.valid_from and now < coupon.valid_from:
        valid = False
        message = "Promo code is not active yet."
    elif coupon.valid_until and now > coupon.valid_until:
        valid = False
        message = "Promo code has expired."
    elif coupon.usage_limit is not None and coupon.used_count >= coupon.usage_limit:
        valid = False
        message = "Promo code usage limit has been reached."
    elif subtotal < money(coupon.minimum_order_amount):
        valid = False
        message = f"Minimum order amount is {money(coupon.minimum_order_amount)}."
    else:
        discount_amount = calculate_coupon_discount(coupon, subtotal)
        if discount_amount <= 0:
            valid = False
            message = "Promo code does not apply a discount."

    return {
        "valid": valid,
        "code": coupon.code,
        "discount_type": coupon.discount_type,
        "discount_value": str(money(coupon.discount_value)),
        "discount_amount": str(money(discount_amount if valid else 0)),
        "message": message,
        "coupon": coupon if valid else None,
    }


def validate_coupon_code(code, subtotal):
    normalized_code = normalize_coupon_code(code)
    subtotal = money(subtotal)
    if not normalized_code:
        return {
            "valid": False,
            "code": "",
            "discount_type": "",
            "discount_value": "0.00",
            "discount_amount": "0.00",
            "message": "Enter a promo code.",
            "coupon": None,
        }

    coupon = Coupon.objects.filter(code__iexact=normalized_code).first()
    if not coupon:
        return {
            "valid": False,
            "code": normalized_code,
            "discount_type": "",
            "discount_value": "0.00",
            "discount_amount": "0.00",
            "message": "Promo code was not found.",
            "coupon": None,
        }

    return validate_coupon_instance(coupon, subtotal)


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = (
            "id",
            "code",
            "discount_type",
            "discount_value",
            "minimum_order_amount",
            "maximum_discount_amount",
            "usage_limit",
            "used_count",
            "is_active",
            "valid_from",
            "valid_until",
            "created_at",
        )
        read_only_fields = ("id", "used_count", "created_at")

    def validate_code(self, value):
        code = normalize_coupon_code(value)
        if len(code) < 3:
            raise serializers.ValidationError("Coupon code should be at least 3 characters.")
        queryset = Coupon.objects.filter(code__iexact=code)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("Coupon code already exists.")
        return code

    def validate_discount_value(self, value):
        if value <= 0:
            raise serializers.ValidationError("Discount value must be greater than zero.")
        return value

    def validate_minimum_order_amount(self, value):
        if value < 0:
            raise serializers.ValidationError("Minimum order amount cannot be negative.")
        return value

    def validate_maximum_discount_amount(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError("Maximum discount amount must be greater than zero.")
        return value

    def validate_usage_limit(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError("Usage limit must be greater than zero.")
        return value

    def validate(self, attrs):
        discount_type = attrs.get("discount_type", getattr(self.instance, "discount_type", None))
        discount_value = attrs.get("discount_value", getattr(self.instance, "discount_value", None))
        valid_from = attrs.get("valid_from", getattr(self.instance, "valid_from", None))
        valid_until = attrs.get("valid_until", getattr(self.instance, "valid_until", None))

        if discount_type == Coupon.DISCOUNT_PERCENTAGE and discount_value and discount_value > 100:
            raise serializers.ValidationError(
                {"discount_value": "Percentage discount cannot be greater than 100."}
            )
        if valid_from and valid_until and valid_from >= valid_until:
            raise serializers.ValidationError(
                {"valid_until": "Valid until must be after valid from."}
            )
        return attrs


class CouponValidateSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=40)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0)

    def validate(self, attrs):
        result = validate_coupon_code(attrs["code"], attrs["subtotal"])
        attrs["result"] = result
        return attrs


class OrderItemReadSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = ("id", "product", "quantity", "price")


class OrderItemWriteSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1, max_value=99)

    def validate_product_id(self, value):
        if not Product.objects.filter(id=value).exists():
            raise serializers.ValidationError("Product does not exist.")
        return value


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemReadSerializer(many=True, read_only=True)
    order_number = serializers.SerializerMethodField()
    customer = serializers.SerializerMethodField()
    payment_label = serializers.CharField(
        source="get_payment_method_display",
        read_only=True,
    )
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "order_number",
            "user",
            "customer",
            "full_name",
            "email",
            "phone",
            "city",
            "address",
            "payment_method",
            "payment_label",
            "subtotal",
            "coupon_code",
            "discount_amount",
            "delivery_price",
            "total_price",
            "status",
            "status_label",
            "tracking_number",
            "created_at",
            "updated_at",
            "items",
        )
        read_only_fields = (
            "id",
            "order_number",
            "user",
            "customer",
            "email",
            "subtotal",
            "coupon_code",
            "discount_amount",
            "delivery_price",
            "total_price",
            "status",
            "status_label",
            "tracking_number",
            "payment_label",
            "created_at",
            "updated_at",
            "items",
        )

    def get_order_number(self, obj):
        return f"EC3D-{obj.pk:06d}"

    def get_customer(self, obj):
        if not obj.user_id:
            return None
        profile = getattr(obj.user, "profile", None)
        return {
            "id": obj.user_id,
            "username": obj.user.username,
            "email": obj.user.email,
            "first_name": obj.user.first_name,
            "last_name": obj.user.last_name,
            "phone": getattr(profile, "phone", ""),
            "city": getattr(profile, "city", ""),
            "address": getattr(profile, "address", ""),
        }


class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemWriteSerializer(many=True, write_only=True)
    coupon_code = serializers.CharField(max_length=40, required=False, allow_blank=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "full_name",
            "email",
            "phone",
            "city",
            "address",
            "payment_method",
            "coupon_code",
            "subtotal",
            "discount_amount",
            "delivery_price",
            "total_price",
            "items",
        )
        read_only_fields = ("id", "subtotal", "discount_amount", "delivery_price", "total_price")

    def validate_full_name(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Full name is too short.")
        return value.strip()

    def validate_email(self, value):
        return (value or "").strip().lower()

    def validate_phone(self, value):
        clean = value.strip()
        if len(clean) < 8:
            raise serializers.ValidationError("Phone number is too short.")
        return clean

    def validate_city(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError("City is too short.")
        return value.strip()

    def validate_address(self, value):
        if len(value.strip()) < 8:
            raise serializers.ValidationError("Address is too short.")
        return value.strip()

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Add at least one product to the order.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items")
        coupon_code = normalize_coupon_code(validated_data.pop("coupon_code", ""))
        requested_quantities = defaultdict(int)
        for item in items_data:
            requested_quantities[item["product_id"]] += item["quantity"]

        products = Product.objects.select_for_update().filter(
            id__in=requested_quantities.keys(),
        )
        product_map = {product.id: product for product in products}
        stock_errors = []

        for product_id, quantity in requested_quantities.items():
            product = product_map.get(product_id)
            if not product:
                stock_errors.append(f"Product {product_id} does not exist.")
            elif not product.is_active:
                stock_errors.append(f"{product.name} is no longer available.")
            elif product.stock <= 0:
                stock_errors.append(f"{product.name} is out of stock.")
            elif quantity > product.stock:
                stock_errors.append(f"{product.name} only has {product.stock} left in stock.")

        if stock_errors:
            raise serializers.ValidationError({"items": stock_errors})

        subtotal = Decimal("0.00")
        order_items = []

        for item in items_data:
            product = product_map[item["product_id"]]
            quantity = item["quantity"]
            line_total = product.price * quantity
            subtotal += line_total
            order_items.append(
                OrderItem(
                    product=product,
                    quantity=quantity,
                    price=product.price,
                )
            )

        subtotal = money(subtotal)
        discount_amount = Decimal("0.00")
        applied_coupon = None

        if coupon_code:
            coupon_validation = validate_coupon_code(coupon_code, subtotal)
            if not coupon_validation["valid"]:
                raise serializers.ValidationError({"coupon_code": coupon_validation["message"]})
            applied_coupon = Coupon.objects.select_for_update().get(
                pk=coupon_validation["coupon"].pk,
            )
            coupon_validation = validate_coupon_instance(applied_coupon, subtotal)
            if not coupon_validation["valid"]:
                raise serializers.ValidationError({"coupon_code": coupon_validation["message"]})
            discount_amount = money(coupon_validation["discount_amount"])
            coupon_code = applied_coupon.code

        store_settings = StoreSettings.load()
        delivery_price = money(store_settings.delivery_price)
        free_threshold = money(store_settings.free_delivery_threshold)
        if free_threshold and subtotal >= free_threshold:
            delivery_price = Decimal("0.00")
        delivery_price = money(delivery_price)
        total_price = money(max(Decimal("0.00"), subtotal - discount_amount) + delivery_price)

        request = self.context.get("request")
        user = request.user if request and request.user.is_authenticated else None
        if user and not validated_data.get("email") and user.email:
            validated_data["email"] = user.email
        order = Order.objects.create(
            user=user,
            subtotal=subtotal,
            coupon_code=coupon_code,
            discount_amount=discount_amount,
            delivery_price=delivery_price,
            total_price=total_price,
            **validated_data,
        )
        for order_item in order_items:
            order_item.order = order
        OrderItem.objects.bulk_create(order_items)
        for product_id, quantity in requested_quantities.items():
            product = product_map[product_id]
            product.stock -= quantity
            product.save(update_fields=["stock"])
        if applied_coupon:
            applied_coupon.used_count += 1
            applied_coupon.save(update_fields=["used_count"])
        from .emails import send_order_created_emails

        transaction.on_commit(lambda order_id=order.id: send_order_created_emails(order_id))
        return order

    def to_representation(self, instance):
        return OrderSerializer(instance, context=self.context).data


class OrderStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ("id", "status", "tracking_number")

    def validate_status(self, value):
        valid_statuses = {status for status, _ in Order.STATUS_CHOICES}
        if value not in valid_statuses:
            raise serializers.ValidationError("Unsupported order status.")
        return value

    def validate_tracking_number(self, value):
        tracking_number = value.strip()
        if len(tracking_number) > 80:
            raise serializers.ValidationError("Tracking number is too long.")
        return tracking_number
