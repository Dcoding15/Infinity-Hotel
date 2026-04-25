from django.urls import path
from .views import *

urlpatterns = [

    # ======================
    # AUTH
    # ======================
    path("register/", RegisterView.as_view()),
    path("login/", LoginView.as_view()),

    # ======================
    # ROOMS (USER)
    # ======================
    path("rooms/", RoomListView.as_view()),

    # ======================
    # ROOMS (ADMIN)
    # ======================
    path("rooms/create/", CreateRoomView.as_view()),
    path("rooms/<int:pk>/", UpdateRoomView.as_view()),
    path("rooms/<int:pk>/delete/", DeleteRoomView.as_view()),

    # ======================
    # BOOKINGS (USER)
    # ======================
    path("book/", BookingCreateView.as_view()),
    path("my-bookings/", MyBookingsView.as_view()),
    path("cancel-booking/<int:booking_id>/", CancelBookingView.as_view()),

    # ======================
    # BOOKINGS (ADMIN)
    # ======================
    path("admin/bookings/", AllBookingsView.as_view()),
]