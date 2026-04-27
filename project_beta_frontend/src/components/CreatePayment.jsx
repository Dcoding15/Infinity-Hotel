import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../AxiosInstance";
import "./CreatePayment.css";

function CreatePayment() {
  const { bookingId } = useParams();
  const [selectedBookingId, setSelectedBookingId] = useState(bookingId || "");
  const [userBookings, setUserBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [transactionId, setTransactionId] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchUnpaidBookings();
  }, []);

  const fetchUnpaidBookings = async () => {
    setFetching(true);
    try {
      const res = await axiosInstance.get("bookings/my/?status=confirmed");
      let bookings = res.data.results ?? res.data;
      const unpaid = bookings.filter(b => !b.has_payment);
      setUserBookings(unpaid);
      if (bookingId && unpaid.find(b => b.id == bookingId)) {
        setSelectedBookingId(bookingId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBookingId) {
      setError("Please select a booking.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await axiosInstance.post("payments/", {
        booking: parseInt(selectedBookingId),
        amount: userBookings.find(b => b.id == selectedBookingId)?.total_price,
        payment_method: paymentMethod,
        transaction_id: transactionId,
      });
      setSuccess("Payment recorded! Admin will confirm it soon.");
      setTimeout(() => navigate("/payments"), 2000);
    } catch (err) {
      const data = err?.response?.data;
      setError(typeof data === "object" ? Object.values(data).flat().join(" ") : "Payment failed.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="loading-screen">Loading bookings…</div>;

  return (
    <div className="payment-page">
      <div className="payment-hero">
        <h1>Make a <em>payment</em></h1>
        <p>Record your payment – admin will verify and mark as paid.</p>
      </div>
      <main className="payment-body">
        <form onSubmit={handleSubmit} className="payment-form">
          <div className="form-group">
            <label>Select Booking</label>
            <select value={selectedBookingId} onChange={e => setSelectedBookingId(e.target.value)} required>
              <option value="">-- Choose a booking --</option>
              {userBookings.map(b => (
                <option key={b.id} value={b.id}>
                  Room #{b.room_number} | ₹{b.total_price} | {b.check_in_date} → {b.check_out_date}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Payment Method</label>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} required>
              <option value="card">Credit/Debit Card</option>
              <option value="upi">UPI</option>
              <option value="cash">Cash (at hotel)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Transaction ID (optional)</label>
            <input type="text" value={transactionId} onChange={e => setTransactionId(e.target.value)} placeholder="e.g., TXN12345" />
          </div>

          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}

          <button type="submit" disabled={loading || !selectedBookingId} className="pay-btn">
            {loading ? "Processing…" : "Record Payment"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default CreatePayment;