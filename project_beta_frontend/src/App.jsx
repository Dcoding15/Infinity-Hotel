import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import Rooms from "./components/Rooms";
import MyBookings from "./components/MyBookings";
import MyPayments from "./components/MyPayments";
import Profile from "./components/Profile";
import CreatePayment from "./components/CreatePayment";
import AdminDashboard from "./components/admin/AdminDashboard";
import AdminRooms from "./components/admin/AdminRooms";
import AdminBookings from "./components/admin/AdminBookings";
import AdminCustomers from "./components/admin/AdminCustomers";
import AdminPayments from "./components/admin/AdminPayments";
import Navbar from "./components/Navbar";

function PrivateRoute({ children, adminOnly = false }) {
  const token = localStorage.getItem("access");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token) return <Navigate to="/login" />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/" />;
  return children;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("access"));
  const [user, setUser] = useState(null);

  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem("access"));
      setUser(JSON.parse(localStorage.getItem("user") || "null"));
    };
    window.addEventListener("storage", handleStorageChange);
    handleStorageChange();
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <>
      {isLoggedIn && <Navbar user={user} />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Rooms />} />
        <Route path="/bookings" element={<PrivateRoute><MyBookings /></PrivateRoute>} />
        <Route path="/payments" element={<PrivateRoute><MyPayments /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/create-payment/:bookingId?" element={<PrivateRoute><CreatePayment /></PrivateRoute>} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<PrivateRoute adminOnly><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/rooms" element={<PrivateRoute adminOnly><AdminRooms /></PrivateRoute>} />
        <Route path="/admin/bookings" element={<PrivateRoute adminOnly><AdminBookings /></PrivateRoute>} />
        <Route path="/admin/customers" element={<PrivateRoute adminOnly><AdminCustomers /></PrivateRoute>} />
        <Route path="/admin/payments" element={<PrivateRoute adminOnly><AdminPayments /></PrivateRoute>} />
      </Routes>
    </>
  );
}

export default App;