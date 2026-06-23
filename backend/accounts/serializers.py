from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers

from .models import UserProfile


class UserSerializer(serializers.ModelSerializer):
    phone = serializers.SerializerMethodField()
    city = serializers.SerializerMethodField()
    address = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "city",
            "address",
            "is_staff",
            "is_superuser",
        )

    def _profile(self, obj):
        profile, _ = UserProfile.objects.get_or_create(user=obj)
        return profile

    def get_phone(self, obj):
        return self._profile(obj).phone

    def get_city(self, obj):
        return self._profile(obj).city

    def get_address(self, obj):
        return self._profile(obj).address


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=40, required=False, allow_blank=True)
    city = serializers.CharField(max_length=120, required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, style={"input_type": "password"})
    password_confirm = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )

    def validate_username(self, value):
        username = value.strip()
        if len(username) < 3:
            raise serializers.ValidationError("Username should be at least 3 characters.")
        if User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError("This username is already taken.")
        return username

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("This email is already registered.")
        return email

    def validate_phone(self, value):
        phone = value.strip()
        if phone and len(phone) < 8:
            raise serializers.ValidationError("Phone number is too short.")
        return phone

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        validate_password(attrs["password"])
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        profile_data = {
            "phone": validated_data.pop("phone", "").strip(),
            "city": validated_data.pop("city", "").strip(),
            "address": validated_data.pop("address", "").strip(),
        }
        password = validated_data.pop("password")
        validated_data.pop("password_confirm")
        user = User.objects.create_user(password=password, **validated_data)
        UserProfile.objects.create(user=user, **profile_data)
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate(self, attrs):
        identifier = attrs.get("username", "").strip()
        password = attrs.get("password")
        username = identifier

        if "@" in identifier:
            user = User.objects.filter(email__iexact=identifier).first()
            if user:
                username = user.username

        user = authenticate(
            request=self.context.get("request"),
            username=username,
            password=password,
        )
        if not user:
            raise serializers.ValidationError("Invalid username/email or password.")
        if not user.is_active:
            raise serializers.ValidationError("This account is disabled.")

        attrs["user"] = user
        return attrs


class UserUpdateSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=40, required=False, allow_blank=True)
    city = serializers.CharField(max_length=120, required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)

    def validate_email(self, value):
        email = value.strip().lower()
        user = self.context["request"].user
        if User.objects.filter(email__iexact=email).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("This email is already registered.")
        return email

    def validate_phone(self, value):
        phone = value.strip()
        if phone and len(phone) < 8:
            raise serializers.ValidationError("Phone number is too short.")
        return phone

    def update(self, instance, validated_data):
        profile, _ = UserProfile.objects.get_or_create(user=instance)
        for field in ("email", "first_name", "last_name"):
            if field in validated_data:
                setattr(instance, field, validated_data[field].strip())
        instance.save(update_fields=["email", "first_name", "last_name"])

        profile_fields = []
        for field in ("phone", "city", "address"):
            if field in validated_data:
                setattr(profile, field, validated_data[field].strip())
                profile_fields.append(field)
        if profile_fields:
            profile.save(update_fields=[*profile_fields, "updated_at"])
        return instance

    def to_representation(self, instance):
        return UserSerializer(instance, context=self.context).data
