from django.db import transaction
from django.utils.timezone import now

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Room, Booking
from .serializers import RoomSerializer, BookingSerializer, RegisterSerializer, LoginSerializer


# ======================
# PERMISSIONS
# ======================
class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"


# ======================
# ROOM MANAGEMENT (ADMIN)
# ======================
class CreateRoomView(generics.CreateAPIView):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [IsAdminRole]


class UpdateRoomView(generics.UpdateAPIView):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [IsAdminRole]


class DeleteRoomView(generics.DestroyAPIView):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [IsAdminRole]


# ======================
# BOOKINGS (ADMIN)
# ======================
class AllBookingsView(generics.ListAPIView):
    queryset = Booking.objects.all().order_by("-created_at")
    serializer_class = BookingSerializer
    permission_classes = [IsAdminRole]


# ======================
# ROOM LIST (USER)
# ======================
class RoomListView(generics.ListAPIView):
    serializer_class = RoomSerializer

    def get_queryset(self):
        queryset = Room.objects.all()

        params = self.request.query_params

        if params.get("room_type"):
            queryset = queryset.filter(room_type=params.get("room_type"))

        if params.get("min_price"):
            queryset = queryset.filter(price__gte=params.get("min_price"))

        if params.get("max_price"):
            queryset = queryset.filter(price__lte=params.get("max_price"))

        if params.get("capacity"):
            queryset = queryset.filter(capacity__gte=params.get("capacity"))

        if params.get("is_available"):
            queryset = queryset.filter(is_available=params.get("is_available"))

        return queryset


# ======================
# CREATE BOOKING
# ======================
class BookingCreateView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer

    @transaction.atomic
    def perform_create(self, serializer):
        room = serializer.validated_data["room"]
        check_in = serializer.validated_data["check_in_date"]
        check_out = serializer.validated_data["check_out_date"]

        # overlap check
        overlapping = Booking.objects.filter(
            room=room,
            check_in_date__lt=check_out,
            check_out_date__gt=check_in,
            status__in=["pending", "confirmed"]
        )

        if overlapping.exists():
            raise ValidationError("Room already booked for selected dates")

        serializer.save(user=self.request.user, status="pending")


# ======================
# AUTH
# ======================
class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)

            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.validated_data
            refresh = RefreshToken.for_user(user)

            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ======================
# USER BOOKINGS
# ======================
class MyBookingsView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        status_param = self.request.query_params.get("status")

        queryset = Booking.objects.filter(user=user)

        if status_param:
            queryset = queryset.filter(status=status_param)
        else:
            queryset = queryset.exclude(status="cancelled")

        return queryset.order_by("-created_at")


# ======================
# CANCEL BOOKING
# ======================
class CancelBookingView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, booking_id):
        try:
            booking = Booking.objects.get(id=booking_id, user=request.user)
        except Booking.DoesNotExist:
            return Response({"error": "Booking not found"}, status=404)

        # ❗ Proper validation (your earlier version was WRONG)
        if booking.status == "cancelled":
            return Response({"error": "Already cancelled"}, status=400)

        if booking.check_in_date <= now().date():
            return Response({"error": "Cannot cancel after check-in"}, status=400)

        booking.status = "cancelled"
        booking.save()

        return Response({"message": "Booking cancelled successfully"})