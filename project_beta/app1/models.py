from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.utils.timezone import now
# Create your models here.


# ----------------------
# Custom User Model
# ----------------------
class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('customer', 'Customer'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='customer')

    def __str__(self):
        return self.username


# ----------------------
# Room Model
# ----------------------
class Room(models.Model):
    ROOM_TYPE_CHOICES = (
        ('single', 'Single'),
        ('double', 'Double'),
        ('suite', 'Suite'),
    )

    room_number = models.CharField(max_length=10, unique=True)
    room_type = models.CharField(max_length=10, choices=ROOM_TYPE_CHOICES)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    capacity = models.IntegerField()
    description = models.TextField(blank=True)

    def __str__(self):
        return f"Room {self.room_number}"


# ----------------------
# Booking Model
# ----------------------
class Booking(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='bookings')

    check_in_date = models.DateField()
    check_out_date = models.DateField()

    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if self.check_out_date <= self.check_in_date:
            raise ValidationError("Check-out must be after check-in")
        if self.check_in_date < now().date():
            raise ValidationError("Cannot book past dates")

    def __str__(self):
        return f"{self.user.username} booking for Room {self.room.room_number}"


# ----------------------
# Payment Model
# ----------------------
class Payment(models.Model):
    PAYMENT_STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
    )

    PAYMENT_METHOD_CHOICES = (
        ('card', 'Card'),
        ('upi', 'UPI'),
        ('cash', 'Cash'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='payment')

    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(max_length=10, choices=PAYMENT_STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=10, choices=PAYMENT_METHOD_CHOICES)

    transaction_id = models.CharField(max_length=100, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment - {self.booking.user.username} for Booking {self.booking.id}"

# ----------------------
# User Review Model
# ----------------------
class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    room = models.ForeignKey(Room, on_delete=models.CASCADE)

    rating = models.IntegerField()
    comment = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.room.room_number}"