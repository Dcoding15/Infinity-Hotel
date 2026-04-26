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
    path("", RoomListView.as_view()),

    # ======================
    # ROOMS (ADMIN)
    # ======================
    path("admin-rooms/create/", CreateRoomView.as_view()),
    path("admin-rooms/<int:pk>/", UpdateRoomView.as_view()),
    path("admin-rooms/<int:pk>/delete/", DeleteRoomView.as_view()),
    path("admin-rooms/view/", AllBookingsView.as_view()),

    # ======================
    # BOOKINGS (USER)
    # ======================
    path("user-rooms/book/", BookingCreateView.as_view()),
    path("user-rooms/view/", MyBookingsView.as_view()),
    path("user-rooms/cancel/<int:booking_id>/", CancelBookingView.as_view()),
]