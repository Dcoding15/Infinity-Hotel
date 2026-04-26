from datetime import timedelta

from django.db import transaction
from django.utils.timezone import now
from django.shortcuts import get_object_or_404

from rest_framework import generics, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, PermissionDenied
from rest_framework.permissions import IsAuthenticated, BasePermission, AllowAny

from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, Room, Booking, Payment, Review
from .serializers import (
    UserSerializer,
    UserProfileSerializer,
    CustomerAdminSerializer,
    RoomSerializer,
    RoomWriteSerializer,
    BookingSerializer,
    BookingAdminSerializer,
    PaymentSerializer,
    PaymentStatusSerializer,
    ReviewSerializer,
    RegisterSerializer,
    LoginSerializer,
)


# ======================
# PERMISSIONS
# ======================
class IsAdminRole(BasePermission):
    """Allows access only to users with role='admin'."""
    message = "Admin access required."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"


class IsOwnerOrAdmin(BasePermission):
    """Object-level: owner of the object or an admin."""
    def has_object_permission(self, request, view, obj):
        if request.user.role == "admin":
            return True
        owner = getattr(obj, "user", None)
        return owner == request.user


# ======================
# AUTH
# ======================
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            }
        )


# ======================
# USER PROFILE
# ======================
class UserProfileView(generics.RetrieveUpdateAPIView):
    """Authenticated user views and updates their own profile."""
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


# ======================
# CUSTOMER MANAGEMENT (ADMIN)
# ======================
class CustomerListView(generics.ListAPIView):
    """Admin: list all customers with booking counts."""
    serializer_class = CustomerAdminSerializer
    permission_classes = [IsAdminRole]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["username", "email", "phone"]
    ordering_fields = ["date_joined", "username"]
    ordering = ["-date_joined"]

    def get_queryset(self):
        queryset = User.objects.filter(role="customer")
        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == "true")
        return queryset


class CustomerDetailView(generics.RetrieveUpdateAPIView):
    """Admin: view or update a single customer (e.g. toggle is_active)."""
    serializer_class = CustomerAdminSerializer
    permission_classes = [IsAdminRole]
    queryset = User.objects.filter(role="customer")


# ======================
# ROOM MANAGEMENT
# ======================
class RoomListView(generics.ListAPIView):
    """Public: list active rooms with optional filters."""
    serializer_class = RoomSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["price", "capacity", "room_number"]
    ordering = ["room_number"]

    def get_queryset(self):
        queryset = Room.objects.filter(is_active=True)
        params = self.request.query_params

        if params.get("room_type"):
            queryset = queryset.filter(room_type=params["room_type"])
        if params.get("min_price"):
            queryset = queryset.filter(price__gte=params["min_price"])
        if params.get("max_price"):
            queryset = queryset.filter(price__lte=params["max_price"])
        if params.get("capacity"):
            queryset = queryset.filter(capacity__gte=params["capacity"])

        # availability filter: resolve in Python using is_available property
        availability = params.get("available")
        if availability is not None:
            want_available = availability.lower() == "true"
            ids = [r.id for r in queryset if r.is_available == want_available]
            queryset = queryset.filter(id__in=ids)

        return queryset


class RoomDetailView(generics.RetrieveAPIView):
    """Public: single room with reviews."""
    serializer_class = RoomSerializer
    queryset = Room.objects.filter(is_active=True)


class AdminRoomListCreateView(generics.ListCreateAPIView):
    """Admin: list ALL rooms (including inactive) and create new ones."""
    permission_classes = [IsAdminRole]
    queryset = Room.objects.all()

    def get_serializer_class(self):
        return RoomWriteSerializer if self.request.method == "POST" else RoomSerializer


class AdminRoomDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin: retrieve, update or soft-delete a room."""
    permission_classes = [IsAdminRole]
    queryset = Room.objects.all()

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return RoomWriteSerializer
        return RoomSerializer

    def destroy(self, request, *args, **kwargs):
        """Soft delete: mark is_active=False rather than deleting the row."""
        room = self.get_object()
        room.is_active = False
        room.save(update_fields=["is_active"])
        return Response(
            {"message": f"Room {room.room_number} deactivated."},
            status=status.HTTP_200_OK,
        )


# ======================
# BOOKINGS — USER
# ======================
class BookingCreateView(generics.CreateAPIView):
    """Authenticated user creates a booking."""
    permission_classes = [IsAuthenticated]
    serializer_class = BookingSerializer

    @transaction.atomic
    def perform_create(self, serializer):
        room = serializer.validated_data["room"]
        check_in = serializer.validated_data["check_in_date"]
        check_out = serializer.validated_data["check_out_date"]

        if not room.is_active:
            raise ValidationError("This room is not available for booking.")

        # Overlap check (select_for_update to prevent race conditions)
        overlapping = Booking.objects.select_for_update().filter(
            room=room,
            status__in=["pending", "confirmed"],
            check_in_date__lt=check_out,
            check_out_date__gt=check_in,
        )
        if overlapping.exists():
            raise ValidationError("Room is already booked for the selected dates.")

        days = (check_out - check_in).days
        total_price = room.price * days

        serializer.save(user=self.request.user, total_price=total_price, status="pending")


class MyBookingsView(generics.ListAPIView):
    """Authenticated user sees their own bookings."""
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Booking.objects.filter(user=self.request.user)
        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset


class CancelBookingView(APIView):
    """Authenticated user cancels their own booking (24h+ before check-in)."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id, user=request.user)

        if booking.status == "cancelled":
            return Response(
                {"error": "This booking is already cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not booking.can_cancel:
            return Response(
                {
                    "error": (
                        "Cancellation is only allowed more than 24 hours "
                        "before check-in."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        booking.status = "cancelled"
        booking.save(update_fields=["status"])
        return Response(
            {"message": "Booking cancelled successfully."},
            status=status.HTTP_200_OK,
        )


# ======================
# BOOKINGS — ADMIN
# ======================
class AdminBookingListView(generics.ListAPIView):
    """Admin: all bookings with optional filters."""
    serializer_class = BookingAdminSerializer
    permission_classes = [IsAdminRole]
    filter_backends = [filters.OrderingFilter]
    ordering = ["-created_at"]

    def get_queryset(self):
        queryset = Booking.objects.select_related("user", "room")
        params = self.request.query_params

        if params.get("status"):
            queryset = queryset.filter(status=params["status"])
        if params.get("user_id"):
            queryset = queryset.filter(user_id=params["user_id"])
        if params.get("room_id"):
            queryset = queryset.filter(room_id=params["room_id"])

        return queryset


class AdminBookingDetailView(generics.RetrieveUpdateAPIView):
    """Admin: view or update a booking (e.g. confirm it)."""
    serializer_class = BookingAdminSerializer
    permission_classes = [IsAdminRole]
    queryset = Booking.objects.select_related("user", "room")


# ======================
# PAYMENTS
# ======================
class PaymentCreateView(generics.CreateAPIView):
    """Authenticated user creates a payment for their booking."""
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        booking = serializer.validated_data["booking"]
        if booking.user != self.request.user:
            raise PermissionDenied("You can only pay for your own bookings.")
        if hasattr(booking, "payment"):
            raise ValidationError("A payment already exists for this booking.")
        serializer.save(user=self.request.user)


class MyPaymentsView(generics.ListAPIView):
    """Authenticated user views their payment history."""
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user)


class AdminPaymentListView(generics.ListAPIView):
    """Admin: all payments with optional status filter."""
    serializer_class = PaymentSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        queryset = Payment.objects.select_related("user", "booking")
        payment_status = self.request.query_params.get("payment_status")
        if payment_status:
            queryset = queryset.filter(payment_status=payment_status)
        return queryset


class AdminPaymentStatusView(generics.UpdateAPIView):
    """Admin: update payment status (e.g. mark as paid / refunded)."""
    serializer_class = PaymentStatusSerializer
    permission_classes = [IsAdminRole]
    queryset = Payment.objects.all()
    http_method_names = ["patch"]


# ======================
# REVIEWS
# ======================
class ReviewListView(generics.ListAPIView):
    """Public: reviews for a specific room."""
    serializer_class = ReviewSerializer

    def get_queryset(self):
        room_id = self.kwargs.get("room_id")
        return Review.objects.filter(room_id=room_id).select_related("user")


class ReviewCreateView(generics.CreateAPIView):
    """Authenticated user submits a review for a room."""
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Only allow review if user has a completed stay in this room
        room = serializer.validated_data["room"]
        has_stayed = Booking.objects.filter(
            user=self.request.user,
            room=room,
            status="confirmed",
            check_out_date__lte=now().date(),
        ).exists()
        if not has_stayed:
            raise ValidationError(
                "You can only review a room after a confirmed stay."
            )
        serializer.save(user=self.request.user)


class ReviewUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    """Owner can update or delete their review. Admin can delete any."""
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    queryset = Review.objects.all()
    http_method_names = ["get", "patch", "delete"]

    def get_object(self):
        obj = get_object_or_404(Review, pk=self.kwargs["pk"])
        self.check_object_permissions(self.request, obj)
        return obj
