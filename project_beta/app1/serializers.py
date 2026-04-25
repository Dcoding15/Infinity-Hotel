from rest_framework import serializers
from django.contrib.auth import authenticate
from django.utils.timezone import now
from datetime import timedelta
from .models import User, Room, Booking, Payment, Review


# ======================
# USER
# ======================
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "role"]


# ======================
# ROOM
# ======================
class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = "__all__"


# ======================
# BOOKING
# ======================
class BookingSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Booking
        fields = "__all__"
        read_only_fields = ["user", "status", "created_at", "total_price"]

    def validate(self, data):
        check_in = data.get("check_in_date")
        check_out = data.get("check_out_date")

        if check_out <= check_in:
            raise serializers.ValidationError("Check-out must be after check-in")

        if check_in < now().date():
            raise serializers.ValidationError("Cannot book past dates")

        return data

    def create(self, validated_data):
        room = validated_data["room"]
        check_in = validated_data["check_in_date"]
        check_out = validated_data["check_out_date"]

        days = (check_out - check_in).days
        total_price = room.price * days

        validated_data["total_price"] = total_price

        return Booking.objects.create(**validated_data)


# ======================
# PAYMENT
# ======================
class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = "__all__"
        read_only_fields = ["user"]

    def validate(self, data):
        # Optional: ensure amount matches booking
        booking = data.get("booking")
        amount = data.get("amount")

        if booking and amount and booking.total_price != amount:
            raise serializers.ValidationError("Amount must match booking total price")

        return data


# ======================
# REVIEW
# ======================
class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = "__all__"

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value


# ======================
# AUTH
# ======================
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(**data)
        if not user:
            raise serializers.ValidationError("Invalid credentials")
        return user