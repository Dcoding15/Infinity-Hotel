# 🏨 Hotel Infinity – Complete Hotel Booking System

A full‑stack hotel booking web application built with **Django REST Framework** (backend) and **React + Vite** (frontend).  
It handles user authentication, room management, online payments (Razorpay), customer reviews, and an admin dashboard.

---

## ✨ Features

### 👤 Customers (Guests)
- Register / Login with JWT authentication
- Browse rooms with filters: type, price, capacity, and **date‑based availability** (only rooms free for selected check‑in/out appear)
- Book a room → pending booking
- View all personal bookings (pending, confirmed, cancelled)
- Cancel booking – only allowed if check‑in is more than 24 hours away
- **Make a payment** via Razorpay (card, UPI, netbanking) – real / test mode
- View payment history
- Leave a rating & review for a room after a confirmed stay
- Edit own profile (name, phone, email)

### 🔐 Admin Panel
- **Dashboard** – statistics: total rooms, bookings, customers, pending payments
- **Manage Rooms** – create, edit, activate/deactivate rooms
- **Manage Bookings** – view all bookings, filter by status/user/room, **confirm or cancel any booking** (no 24‑hour restriction)
- **Manage Customers** – list customers, activate/deactivate accounts
- **Manage Payments** – mark payments as `paid`, `failed`, or `refunded`
- **Auto‑cancel**: when a payment is marked `refunded`, the associated booking is automatically cancelled

### 💰 Payment Flow (Two Modes)
1. **Manual verification** – user records payment method (card/upi/cash), admin marks as paid later.
2. **Razorpay online** – user pays instantly via Razorpay checkout; webhook updates payment status automatically.

### 🎨 UI/UX
- Clean, modern design with a warm colour palette (`cream`, `charcoal`, `amber`)
- Responsive layout (mobile, tablet, desktop)
- Interactive filters on the rooms page
- Status badges (pending/confirmed/cancelled) and payment badges

---

## 🛠️ Tech Stack

| Layer       | Technology |
|-------------|------------|
| Backend     | Django, Django REST Framework, SimpleJWT |
| Database    | SQLite (default) / PostgreSQL |
| Payments    | Razorpay API (optional) |
| Frontend    | React 18, React Router, Axios, CSS Modules |
| Build Tool  | Vite |
| Styling     | Custom CSS (Hotel Infinity theme) |

---

## 🔁 Workflow Overview

### Customer Flow
1. **Register** → username, email, password, phone.
2. **Login** → receives access/refresh tokens.
3. **Rooms page** – select check‑in/out dates, apply filters, see only available rooms.
4. **Book a room** – booking status becomes `pending`.
5. **Admin confirms** the booking → status changes to `confirmed`.
6. **Pay Now** button appears in `My Bookings`. Click → Razorpay checkout (or manual payment form).
7. **Payment completed** – webhook updates payment to `paid`, booking remains `confirmed`.
8. **After stay** – user can leave a review (1‑5 stars) for the room.
9. **Cancel booking** – only possible >24h before check‑in.

### Admin Flow
1. **Login** with admin credentials (superuser or `role=admin`).
2. **Dashboard** – view key metrics.
3. **Manage Rooms** – add, edit, deactivate/reactivate.
4. **Manage Bookings** – confirm, cancel, or filter any booking (no date restrictions).
5. **Manage Customers** – list, activate/deactivate accounts.
6. **Manage Payments** – view all payments, change status.  
   - Refunding a payment automatically cancels the linked booking.

---

## 📡 Key API Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/register/` | User registration | Public |
| POST | `/login/` | Login (returns JWT) | Public |
| GET | `/profile/` | Get/update own profile | Customer |
| GET | `/rooms/` | List rooms (with date filters) | Public |
| POST | `/bookings/` | Create a booking | Customer |
| GET | `/bookings/my/` | List user’s bookings | Customer |
| PATCH | `/bookings/<id>/cancel/` | Cancel own booking (if >24h) | Customer |
| GET | `/admin/bookings/` | List all bookings | Admin |
| PATCH | `/admin/bookings/<id>/` | Update booking (confirm/cancel) | Admin |
| GET | `/admin/customers/` | List all customers | Admin |
| GET | `/admin/payments/` | List all payments | Admin |
| PATCH | `/admin/payments/<id>/` | Update payment status | Admin |
| POST | `/create-razorpay-order/` | Create Razorpay order | Customer |
| POST | `/razorpay-webhook/` | Webhook for payment confirmation | Public (Razorpay) |

(Full list in `urls.py`.)

---

## 🚀 Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn
- Razorpay account (optional for online payments)

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/hotel-infinity.git
cd hotel-infinity/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Apply migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser (admin)
python manage.py createsuperuser

# Run server
python manage.py runserver
```

### Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

### Environment Variables (Backend `.env`)

```env
SECRET_KEY=your-django-secret-key
DEBUG=True

# Razorpay (optional – omit to fallback to manual payment mode)
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=xxxxxx
```

### Frontend Configuration

Edit `src/AxiosInstance.jsx` to point to your backend URL:

```js
baseURL: "http://localhost:8000/hotel-infinity/",
```

---

## 💳 Testing Payments (Razorpay)

If you have Razorpay test keys:

- **Test Card**: `4111 1111 1111 1111` (any future expiry, CVV 123)
- **UPI ID**: `success@razorpay`
- **Netbanking**: any bank – works in test mode
- OTP: `1234`

Without Razorpay keys, the system uses **manual payment recording** (admin marks paid).

---

## 📁 Project Structure

```
hotel-infinity/
├── backend/
│   ├── app1/
│   │   ├── migrations/
│   │   ├── admin.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── hotel_infinity/
│   │   ├── settings.py
│   │   └── urls.py
│   └── manage.py
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── admin/
    │   │   │   ├── AdminDashboard.jsx
    │   │   │   ├── AdminRooms.jsx
    │   │   │   ├── AdminBookings.jsx
    │   │   │   ├── AdminCustomers.jsx
    │   │   │   └── AdminPayments.jsx
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Rooms.jsx
    │   │   ├── MyBookings.jsx
    │   │   ├── MyPayments.jsx
    │   │   ├── Profile.jsx
    │   │   ├── CreatePayment.jsx
    │   │   └── Navbar.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   ├── AxiosInstance.jsx
    │   └── index.css
    ├── package.json
    └── vite.config.js
```

---

## 🔮 Future Improvements

- Email notifications (booking confirmation, payment receipt)
- Upload room images
- Multi‑language support
- Export bookings/payments to CSV/PDF

---

## 👥 Contributors

Developed as a full‑stack project integrating Django REST API with a React frontend.

© 2025 Hotel Infinity | Infinity Team
