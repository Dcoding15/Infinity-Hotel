import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../AxiosInstance";
import "./CreatePayment.css";

function CreatePayment() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [selectedBookingId, setSelectedBookingId] = useState(bookingId || "");
  const [userBookings, setUserBookings] = useState([]);
  const [form, setForm] = useState({
    booking: "",
    amount: "",
    payment_method: "card",
    transaction_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchUnpaidBookings();
  }, []);

  const fetchUnpaidBookings = async () => {
    setFetching(true);
    try {
      const res = await axiosInstance.get("bookings/my/?status=confirmed");
      let bookings = res.data.results ?? res.data;
      // Filter bookings without payment
      const unpaidBookings = bookings.filter(b => !b.has_payment);
      setUserBookings(unpaidBookings);
      if (bookingId && unpaidBookings.find(b => b.id == bookingId)) {
        setSelectedBookingId(bookingId);
        handleBookingSelect(bookingId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  const handleBookingSelect = async (id) => {
    if (!id) {
      setBooking(null);
      setForm(f => ({ ...f, booking: "", amount: "" }));
      return;
    }
    try {
      const res = await axiosInstance.get(`bookings/my/`);
      const allBookings = res.data.results ?? res.data;
      const found = allBookings.find(b => b.id == id);
      if (found) {
        setBooking(found);
        setForm(f => ({ ...f, booking: id, amount: found.total_price }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (name === "booking") {
      setSelectedBookingId(value);
      handleBookingSelect(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await axiosInstance.post("payments/", {
        booking: parseInt(form.booking),
        amount: parseFloat(form.amount),
        payment_method: form.payment_method,
        transaction_id: form.transaction_id,
      });
      setSuccess("Payment created successfully!");
      setTimeout(() => navigate("/payments"), 2000);
    } catch (err) {
      const data = err?.response?.data;
      setError(
        typeof data === "object"
          ? Object.values(data).flat().join(" ")
          : "Payment failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="loading-screen">Loading bookings…</div>;
  }

  return (
    <div className="payment-page">
      <div className="payment-hero">
        <h1>Make a <em>payment</em></h1>
        <p>Complete your booking by making a secure payment.</p>
      </div>

      <main className="payment-body">
        <form onSubmit={handleSubmit} className="payment-form">
          <div className="form-group">
            <label>Select Booking</label>
            <select name="booking" value={selectedBookingId} onChange={handleChange} required>
              <option value="">-- Choose a booking --</option>
              {userBookings.map((b) => (
                <option key={b.id} value={b.id}>
                  Room #{b.room_number} | ₹{b.total_price} | {b.check_in_date} to {b.check_out_date}
                </option>
              ))}
            </select>
            {userBookings.length === 0 && (
              <p className="hint">No unpaid confirmed bookings. <span onClick={() => navigate("/")}>Book a room</span> first.</p>
            )}
          </div>

          <div className="form-group">
            <label>Amount (₹)</label>
            <input type="number" name="amount" value={form.amount} readOnly disabled />
          </div>

          <div className="form-group">
            <label>Payment Method</label>
            <select name="payment_method" value={form.payment_method} onChange={handleChange} required>
              <option value="card">Credit/Debit Card</option>
              <option value="upi">UPI</option>
              <option value="cash">Cash (Hotel Desk)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Transaction ID (optional)</label>
            <input
              type="text"
              name="transaction_id"
              value={form.transaction_id}
              onChange={handleChange}
              placeholder="e.g., TXN123456"
            />
          </div>

          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}

          <button type="submit" disabled={loading || !selectedBookingId} className="pay-btn">
            {loading ? "Processing…" : "Pay Now"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default CreatePayment;