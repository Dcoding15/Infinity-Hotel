from django.urls import path

from .views import (
    # Auth
    RegisterView,
    LoginView,
    # User profile
    UserProfileView,
    # Customer management (admin)
    CustomerListView,
    CustomerDetailView,
    # Rooms — public
    RoomListView,
    RoomDetailView,
    # Rooms — admin
    AdminRoomListCreateView,
    AdminRoomDetailView,
    # Bookings — user
    BookingCreateView,
    MyBookingsView,
    CancelBookingView,
    # Bookings — admin
    AdminBookingListView,
    AdminBookingDetailView,
    # Payments
    PaymentCreateView,
    MyPaymentsView,
    AdminPaymentListView,
    AdminPaymentStatusView,
    # Reviews
    ReviewListView,
    ReviewCreateView,
    ReviewUpdateDeleteView,
)

urlpatterns = [

    # ──────────────────────────────
    # AUTH
    # ──────────────────────────────
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),

    # ──────────────────────────────
    # USER PROFILE
    # ──────────────────────────────
    path("profile/", UserProfileView.as_view(), name="user-profile"),

    # ──────────────────────────────
    # ROOMS — PUBLIC
    # ──────────────────────────────
    path("rooms/", RoomListView.as_view(), name="room-list"),
    path("rooms/<int:pk>/", RoomDetailView.as_view(), name="room-detail"),
    path("rooms/<int:room_id>/reviews/", ReviewListView.as_view(), name="room-reviews"),

    # ──────────────────────────────
    # ROOMS — ADMIN
    # ──────────────────────────────
    path("admin/rooms/", AdminRoomListCreateView.as_view(), name="admin-room-list-create"),
    path("admin/rooms/<int:pk>/", AdminRoomDetailView.as_view(), name="admin-room-detail"),

    # ──────────────────────────────
    # CUSTOMER MANAGEMENT — ADMIN
    # ──────────────────────────────
    path("admin/customers/", CustomerListView.as_view(), name="admin-customer-list"),
    path("admin/customers/<int:pk>/", CustomerDetailView.as_view(), name="admin-customer-detail"),

    # ──────────────────────────────
    # BOOKINGS — USER
    # ──────────────────────────────
    path("bookings/", BookingCreateView.as_view(), name="booking-create"),
    path("bookings/my/", MyBookingsView.as_view(), name="my-bookings"),
    path("bookings/<int:booking_id>/cancel/", CancelBookingView.as_view(), name="booking-cancel"),

    # ──────────────────────────────
    # BOOKINGS — ADMIN
    # ──────────────────────────────
    path("admin/bookings/", AdminBookingListView.as_view(), name="admin-booking-list"),
    path("admin/bookings/<int:pk>/", AdminBookingDetailView.as_view(), name="admin-booking-detail"),

    # ──────────────────────────────
    # PAYMENTS — USER
    # ──────────────────────────────
    path("payments/", PaymentCreateView.as_view(), name="payment-create"),
    path("payments/my/", MyPaymentsView.as_view(), name="my-payments"),

    # ──────────────────────────────
    # PAYMENTS — ADMIN
    # ──────────────────────────────
    path("admin/payments/", AdminPaymentListView.as_view(), name="admin-payment-list"),
    path("admin/payments/<int:pk>/", AdminPaymentStatusView.as_view(), name="admin-payment-status"),

    # ──────────────────────────────
    # REVIEWS
    # ──────────────────────────────
    path("reviews/", ReviewCreateView.as_view(), name="review-create"),
    path("reviews/<int:pk>/", ReviewUpdateDeleteView.as_view(), name="review-detail"),
]
