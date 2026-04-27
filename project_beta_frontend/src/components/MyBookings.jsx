import { useEffect, useState } from "react";
import axiosInstance from "../AxiosInstance";
import { useNavigate } from "react-router-dom";
import "./MyBookings.css";

const STATUS_OPTIONS = ["pending", "confirmed", "cancelled"];

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role === "admin";

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`bookings/my/?status=${statusFilter}`);
      setBookings(res.data.results ?? res.data);
    } catch (err) {
      console.error("Fetch error:", err);
      if (err.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (id) => {
    if (!window.confirm("Cancel this booking? Cancellations are only allowed 24+ hours before check-in.")) return;
    try {
      await axiosInstance.patch(`bookings/${id}/cancel/`);
      fetchBookings();
    } catch (err) {
      console.error("Cancel error:", err);
      alert(err.response?.data?.error || "Cancellation failed. Please try again.");
    }
  };

  const getStatusClass = (status) => {
    if (status === "pending") return "pending";
    if (status === "confirmed") return "confirmed";
    return "cancelled";
  };

  return (
    <div className="bookings-page">
      <div className="bookings-hero">
        <h1>Your <em>reservations</em></h1>
        <p>View and manage all your bookings in one place.</p>
      </div>

      <main className="bookings-body">
        <div className="filter-row">
          <span className="filter-label">Filter</span>
          <div className="filter-tabs">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                className={`filter-tab ${statusFilter === s ? `active ${s}` : ""}`}
                onClick={() => setStatusFilter(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading-screen">Loading your bookings…</div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <p>No {statusFilter} bookings found.</p>
            <span className="empty-link" onClick={() => navigate("/")}>
              Browse available rooms →
            </span>
          </div>
        ) : (
          <div className="booking-grid">
            {bookings.map((b) => (
              <div key={b.id} className="booking-card">
                <div className="card-head">
                  <span className="card-room">Room #{b.room_number || b.room}</span>
                  <span className={`status-badge ${getStatusClass(b.status)}`}>{b.status}</span>
                </div>

                <div className="card-details">
                  <div className="detail-item">
                    <span className="detail-label">Total</span>
                    <span className="detail-value total">₹{b.total_price}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Check-in</span>
                    <span className="detail-value">{b.check_in_date}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Check-out</span>
                    <span className="detail-value">{b.check_out_date}</span>
                  </div>
                  {b.nights && (
                    <div className="detail-item">
                      <span className="detail-label">Nights</span>
                      <span className="detail-value">{b.nights}</span>
                    </div>
                  )}
                </div>

                {/* Cancel Button (if cancellable) */}
                {isAdmin && b.status !== "cancelled" && (
                  <button className="cancel-btn" onClick={() => cancelBooking(b.id)}>Cancel Booking</button>
                )}
                {b.status === "confirmed" && !b.has_payment && (
                  <button
                    className="pay-now-btn"
                    onClick={() => navigate(`/create-payment/${b.id}`)}
                  >
                    Pay Now
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default MyBookings;