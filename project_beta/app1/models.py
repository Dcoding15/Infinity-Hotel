from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.timezone import now


# ----------------------
# Custom User Model
# ----------------------
class User(AbstractUser):
    ROLE_CHOICES = (
        ("admin", "Admin"),
        ("customer", "Customer"),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="customer")
    phone = models.CharField(max_length=15, blank=True)

    def __str__(self):
        return self.username

    @property
    def is_admin_role(self):
        return self.role == "admin"


# ----------------------
# Room Model
# ----------------------
class Room(models.Model):
    ROOM_TYPE_CHOICES = (
        ("single", "Single"),
        ("double", "Double"),
        ("suite", "Suite"),
    )

    room_number = models.CharField(max_length=10, unique=True)
    room_type = models.CharField(max_length=10, choices=ROOM_TYPE_CHOICES)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    capacity = models.PositiveIntegerField()
    description = models.TextField(blank=True)
    amenities = models.TextField(
        blank=True,
        help_text="Comma-separated list e.g. WiFi, AC, TV"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Inactive rooms are hidden from listings"
    )

    class Meta:
        ordering = ["room_number"]

    def __str__(self):
        return f"Room {self.room_number} ({self.get_room_type_display()})"

    @property
    def is_available(self):
        """True if the room has no active (pending/confirmed) bookings today."""
        today = now().date()
        return not self.bookings.filter(
            status__in=["pending", "confirmed"],
            check_in_date__lte=today,
            check_out_date__gt=today,
        ).exists()


# ----------------------
# Booking Model
# ----------------------
class Booking(models.Model):
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("confirmed", "Confirmed"),
        ("cancelled", "Cancelled"),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bookings")
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="bookings")

    check_in_date = models.DateField()
    check_out_date = models.DateField()
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def clean(self):
        if self.check_in_date and self.check_out_date:
            if self.check_out_date <= self.check_in_date:
                raise ValidationError("Check-out must be after check-in.")
            if self.check_in_date < now().date():
                raise ValidationError("Cannot book past dates.")

    def __str__(self):
        return f"{self.user.username} | Room {self.room.room_number} | {self.status}"

    @property
    def nights(self):
        return (self.check_out_date - self.check_in_date).days

    @property
    def can_cancel(self):
        """Cancellation allowed only if check-in is more than 24 hours away."""
        from datetime import timedelta
        return (
            self.status != "cancelled"
            and self.check_in_date > (now().date() + timedelta(days=1))
        )


# ----------------------
# Payment Model
# ----------------------
class Payment(models.Model):
    PAYMENT_STATUS_CHOICES = (
        ("pending", "Pending"),
        ("paid", "Paid"),
        ("failed", "Failed"),
        ("refunded", "Refunded"),
    )

    PAYMENT_METHOD_CHOICES = (
        ("card", "Card"),
        ("upi", "UPI"),
        ("cash", "Cash"),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="payments")
    booking = models.OneToOneField(
        Booking, on_delete=models.CASCADE, related_name="payment"
    )

    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(
        max_length=10, choices=PAYMENT_STATUS_CHOICES, default="pending"
    )
    payment_method = models.CharField(max_length=10, choices=PAYMENT_METHOD_CHOICES)
    transaction_id = models.CharField(max_length=100, blank=True)
    razorpay_order_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"Payment #{self.id} | {self.user.username} | "
            f"Booking #{self.booking.id} | {self.payment_status}"
        )


# ----------------------
# Review Model
# ----------------------
class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reviews")
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="reviews")

    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = ("user", "room")  # one review per user per room

    def __str__(self):
        return f"{self.user.username} → Room {self.room.room_number} ({self.rating}★)"
