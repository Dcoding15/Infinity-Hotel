from django.urls import path
from .views import *

urlpatterns = [

    # ======================
    # AUTH
    # ======================
    path("register/", RegisterView.as_view()),
    path("login/", LoginView.as_view()),

    # ======================
    # ROOMS (ALL)
    # ======================
    path("rooms/", RoomListView.as_view()),

    # ======================
    # ROOMS (ADMIN)
    # ======================
    path("admin-rooms/create/", CreateRoomView.as_view()),
    path("admin-rooms/<int:pk>/", UpdateRoomView.as_view()),
    path("admin-rooms/<int:pk>/delete/", DeleteRoomView.as_view()),
    path("admin/bookings/", AllBookingsView.as_view()),

    # ======================
    # BOOKINGS (USER)
    # ======================
    path("book-a-room/", BookingCreateView.as_view()),
    path("my-bookings/", MyBookingsView.as_view()),
    path("cancel-booking/<int:booking_id>/", CancelBookingView.as_view()),
]