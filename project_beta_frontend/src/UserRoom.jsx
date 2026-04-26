import { useEffect, useState } from "react";
import axiosInstance from "./AxiosInstance";
import { useNavigate } from "react-router-dom";
import "./UserRoom.css";

const STATUS_OPTIONS = ["pending", "confirmed", "cancelled"];

function UserBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access");
      const res = await axiosInstance.get(
        `/user-rooms/view/?status=${statusFilter}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBookings(res.data.results ?? []);
    } catch (err) {
      console.error("Fetch error:", err);
      if (err.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (id) => {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      const token = localStorage.getItem("access");
      await axiosInstance.patch(
        `/user-rooms/cancel/${id}/`,
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchBookings();
    } catch (err) {
      console.error("Cancel error:", err);
      alert(err.response?.data?.error || "Cancellation failed. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/login");
  };

  return (
    <div className="bookings-page">
      {/* Header */}
      <header className="bookings-header">
        <div className="header-brand">∞ Hotel <span>Infinity</span></div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn-ghost" onClick={() => navigate("/")}>
            Browse Rooms
          </button>
          <button className="btn-ghost" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Hero band */}
      <div className="bookings-hero">
        <h1>Your <em>reservations</em></h1>
        <p>View and manage all your bookings in one place.</p>
      </div>

      {/* Body */}
      <main className="bookings-body">
        {/* Status filter tabs */}
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

        {/* Content */}
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
                  <span className="card-room">Room #{b.room}</span>
                  <span className={`status-badge ${b.status}`}>{b.status}</span>
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
                </div>

                {b.status !== "cancelled" && (
                  <>
                    <div className="card-divider" />
                    <button
                      className="cancel-btn"
                      onClick={() => cancelBooking(b.id)}
                    >
                      Cancel Booking
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default UserBookings;
