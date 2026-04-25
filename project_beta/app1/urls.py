from django.urls import path
from .views import *
urlpatterns = [
    path('rooms/', RoomListView.as_view()),
    path('book/', BookingCreateView.as_view()),
    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
    path('rooms/available/', AvailableRoomListView.as_view()),
    path('my-bookings/', MyBookingsView.as_view()),
    path('cancel-booking/<int:booking_id>/', CancelBookingView.as_view()),
    path('admin/rooms/create/', CreateRoomView.as_view()),
    path('admin/rooms/update/<int:pk>/', UpdateRoomView.as_view()),
    path('admin/rooms/delete/<int:pk>/', DeleteRoomView.as_view()),
    path('admin/bookings/', AllBookingsView.as_view()),
]