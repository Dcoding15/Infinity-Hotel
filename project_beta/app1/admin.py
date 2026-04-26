from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User, Room, Booking, Payment, Review


# ──────────────────────────────
# USER
# ──────────────────────────────
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ["username", "email", "role", "phone", "is_active", "date_joined"]
    list_filter = ["role", "is_active"]
    search_fields = ["username", "email", "phone"]
    ordering = ["-date_joined"]

    fieldsets = BaseUserAdmin.fieldsets + (
        ("Hotel Profile", {"fields": ("role", "phone")}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ("Hotel Profile", {"fields": ("role", "phone")}),
    )


# ──────────────────────────────
# ROOM
# ──────────────────────────────
@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = [
        "room_number", "room_type", "price",
        "capacity", "is_active", "is_available_display",
    ]
    list_filter = ["room_type", "is_active"]
    search_fields = ["room_number", "description"]
    ordering = ["room_number"]

    @admin.display(description="Available Today", boolean=True)
    def is_available_display(self, obj):
        return obj.is_available


# ──────────────────────────────
# BOOKING
# ──────────────────────────────
@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = [
        "id", "user", "room", "check_in_date",
        "check_out_date", "nights_display", "total_price", "status", "created_at",
    ]
    list_filter = ["status", "room__room_type"]
    search_fields = ["user__username", "user__email", "room__room_number"]
    ordering = ["-created_at"]
    date_hierarchy = "check_in_date"
    readonly_fields = ["total_price", "created_at", "updated_at"]

    @admin.display(description="Nights")
    def nights_display(self, obj):
        return obj.nights

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("user", "room")


# ──────────────────────────────
# PAYMENT
# ──────────────────────────────
@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = [
        "id", "user", "booking", "amount",
        "payment_method", "payment_status", "transaction_id", "created_at",
    ]
    list_filter = ["payment_status", "payment_method"]
    search_fields = ["user__username", "transaction_id", "booking__id"]
    ordering = ["-created_at"]
    readonly_fields = ["created_at", "updated_at"]

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("user", "booking")


# ──────────────────────────────
# REVIEW
# ──────────────────────────────
@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "room", "rating", "created_at"]
    list_filter = ["rating", "room__room_type"]
    search_fields = ["user__username", "room__room_number", "comment"]
    ordering = ["-created_at"]
    readonly_fields = ["created_at", "updated_at"]

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("user", "room")
