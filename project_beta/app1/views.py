from django.shortcuts import render
from django.db import transaction
from django.utils.timezone import now

# Create your views here.
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Room, Booking
from .serializers import RoomSerializer, BookingSerializer, RegisterSerializer, LoginSerializer

# Admin user
class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == "admin"

# Create a new room
class CreateRoomView(generics.CreateAPIView):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [IsAdminRole]

# Update an old room
class UpdateRoomView(generics.UpdateAPIView):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [IsAdminRole]

# Delete an old room
class DeleteRoomView(generics.DestroyAPIView):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [IsAdminRole]

# GET al rooms (admin only)
class AllBookingsView(generics.ListAPIView):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [IsAdminRole]

# GET all rooms (user only)
class RoomListView(generics.ListAPIView):
    serializer_class = RoomSerializer

    def get_queryset(self):
        queryset = Room.objects.all()

        room_type = self.request.query_params.get('room_type')
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        capacity = self.request.query_params.get('capacity')

        if room_type:
            queryset = queryset.filter(room_type=room_type)

        if min_price:
            queryset = queryset.filter(price__gte=min_price)

        if max_price:
            queryset = queryset.filter(price__lte=max_price)

        if capacity:
            queryset = queryset.filter(capacity__gte=capacity)

        return queryset

# CREATE booking
class BookingCreateView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer

    @transaction.atomic
    def perform_create(self, serializer):
        room = serializer.validated_data['room']
        check_in = serializer.validated_data['check_in_date']
        check_out = serializer.validated_data['check_out_date']

        overlapping = Booking.objects.filter(
            room=room,
            check_in_date__lt=check_out,
            check_out_date__gt=check_in
        )

        if overlapping.exists():
            raise ValidationError("Room already booked for these dates")

        serializer.save(user=self.request.user, status="pending")

# REGISTER
class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            refresh = RefreshToken.for_user(user)

            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# LOGIN
class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.validated_data

            refresh = RefreshToken.for_user(user)

            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Quering for room availablity
class AvailableRoomListView(generics.ListAPIView):
    serializer_class = RoomSerializer

    def get_queryset(self):
        check_in = self.request.query_params.get('check_in')
        check_out = self.request.query_params.get('check_out')

        rooms = Room.objects.all()

        if check_in and check_out:
            booked_rooms = Booking.objects.filter(
                check_in_date__lt=check_out,
                check_out_date__gt=check_in,
                status__in=['pending', 'confirmed']
            ).values_list('room_id', flat=True)

            rooms = rooms.exclude(id__in=booked_rooms)

        return rooms

# Create a User Booking
class MyBookingsView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        status_param = self.request.query_params.get('status')

        queryset = Booking.objects.filter(user=user)

        # If status is provided → filter by it
        if status_param:
            queryset = queryset.filter(status=status_param)
        else:
            # Default → hide cancelled bookings
            queryset = queryset.exclude(status='cancelled')

        # Latest bookings first
        return queryset.order_by('-created_at')

# Cancel a User Booking
class CancelBookingView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, booking_id):
        try:
            booking = Booking.objects.get(id=booking_id, user=request.user)
        except Booking.DoesNotExist:
            return Response({"error": "Booking not found"}, status=404)
        except booking.check_in_date <= now().date():
            return Response({"error": "Cannot cancel after check-in"}, status=400)
        except booking.status == 'cancelled':
            return Response({"error": "Already cancelled"}, status=400)

        booking.status = 'cancelled'
        booking.save()

        return Response({"message": "Booking cancelled successfully"})