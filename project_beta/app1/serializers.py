from rest_framework import serializers
from django.contrib.auth import authenticate
from django.utils.timezone import now

from .models import User, Room, Booking, Payment, Review


# ======================
# USER
# ======================
class UserSerializer(serializers.ModelSerializer):
    """Read-only snapshot embedded in other serializers."""
    class Meta:
        model = User
        fields = ["id", "username", "email", "role", "phone"]
        read_only_fields = fields


class UserProfileSerializer(serializers.ModelSerializer):
    """Allows a customer to update their own profile (no role change)."""
    class Meta:
        model = User
        fields = ["id", "username", "email", "phone", "first_name", "last_name"]
        read_only_fields = ["id"]


class CustomerAdminSerializer(serializers.ModelSerializer):
    """Full user view for admins — includes role."""
    booking_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "role", "phone",
            "first_name", "last_name", "date_joined",
            "is_active", "booking_count",
        ]
        read_only_fields = ["id", "date_joined", "booking_count"]

    def get_booking_count(self, obj):
        return obj.bookings.exclude(status="cancelled").count()


# ======================
# ROOM
# ======================
class RoomSerializer(serializers.ModelSerializer):
    is_available = serializers.BooleanField(read_only=True)

    class Meta:
        model = Room
        fields = [
            "id", "room_number", "room_type", "price",
            "capacity", "description", "amenities",
            "is_active", "is_available",
        ]


class RoomWriteSerializer(serializers.ModelSerializer):
    """Used by admin for create / update — excludes computed fields."""
    class Meta:
        model = Room
        fields = [
            "room_number", "room_type", "price",
            "capacity", "description", "amenities", "is_active",
        ]


# ======================
# BOOKING
# ======================
class BookingSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    room_number = serializers.CharField(source="room.room_number", read_only=True)
    nights = serializers.IntegerField(read_only=True)
    can_cancel = serializers.BooleanField(read_only=True)
    total_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    has_payment = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            "id", "user", "room", "room_number",
            "check_in_date", "check_out_date",
            "nights", "total_price", "status",
            "can_cancel", "created_at", "has_payment",   # add has_payment here
        ]
        read_only_fields = ["user", "status", "total_price", "created_at", "has_payment"]

    def validate(self, data):
        check_in = data.get("check_in_date")
        check_out = data.get("check_out_date")

        if check_in and check_out:
            if check_out <= check_in:
                raise serializers.ValidationError(
                    {"check_out_date": "Check-out must be after check-in."}
                )
            if check_in < now().date():
                raise serializers.ValidationError(
                    {"check_in_date": "Cannot book past dates."}
                )
        return data
    
    def get_has_payment(self, obj):
        return hasattr(obj, 'payment')


class BookingAdminSerializer(BookingSerializer):
    """Same as BookingSerializer but exposes update of status for admins."""
    class Meta(BookingSerializer.Meta):
        read_only_fields = ["user", "total_price", "created_at"]


# ======================
# PAYMENT
# ======================
class PaymentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    booking_total = serializers.DecimalField(
        source="booking.total_price",
        max_digits=10, decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = Payment
        fields = [
            "id", "user", "booking", "booking_total",
            "amount", "payment_status", "payment_method",
            "transaction_id", "created_at",
        ]
        read_only_fields = ["user", "created_at"]

    def validate(self, data):
        booking = data.get("booking")
        amount = data.get("amount")

        if booking and amount and booking.total_price != amount:
            raise serializers.ValidationError(
                {"amount": f"Amount must match booking total (₹{booking.total_price})."}
            )
        return data


class PaymentStatusSerializer(serializers.ModelSerializer):
    """Admin-only: update payment status."""
    class Meta:
        model = Payment
        fields = ["payment_status", "transaction_id"]


# ======================
# REVIEW
# ======================
class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    room_number = serializers.CharField(source="room.room_number", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id", "user", "room", "room_number",
            "rating", "comment", "created_at",
        ]
        read_only_fields = ["user", "created_at"]

    def validate(self, data):
        request = self.context.get("request")
        room = data.get("room")

        # On create, prevent duplicate review (update uses PATCH on existing instance)
        if self.instance is None and request and room:
            if Review.objects.filter(user=request.user, room=room).exists():
                raise serializers.ValidationError(
                    "You have already reviewed this room."
                )
        return data


# ======================
# AUTH
# ======================
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["username", "email", "password", "phone"]

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data["username"], password=data["password"])
        if not user:
            raise serializers.ValidationError("Invalid username or password.")
        if not user.is_active:
            raise serializers.ValidationError("This account has been deactivated.")
        return user
