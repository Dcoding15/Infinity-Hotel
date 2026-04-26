import { useEffect, useState } from "react";
import axiosInstance from "./AxiosInstance";
import "./UserRoom.css";
import { useNavigate } from "react-router-dom";
import "./Rooms.css";

function UserBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
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
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setBookings(res.data.results || []);
    } catch (err) {
      console.error("Fetch error:", err);
      if (err.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (id) => {
    try {
      const token = localStorage.getItem("access");

      await axiosInstance.patch(
        `/user-rooms/cancel/${id}/`,
        null,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchBookings();
    } catch (err) {
      console.error("Cancel error:", err);
      alert(err.response?.data?.error || "Cancel failed");
    }
  };

const token1 = localStorage.getItem("access");

  return (
    <div className="bookings-container">
      <h2 className="title">Your Bookings</h2>
      <button type="button" onClick={() => navigate("/")} className="browse-btn" >
          Browse Rooms
      </button>
      {/* Filter */}
      <div className="filter-box">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Loading */}
      {loading ? (
        <p className="loading-text">Loading bookings...</p>
      ) : bookings.length === 0 ? (
        <p className="empty-text">No bookings found</p>
      ) : (
        <div className="booking-grid">
          {bookings.map((b) => (
            <div key={b.id} className="booking-card">
              <div className="card-header">
                <h3>Room #{b.room}</h3>
                <span className={`status ${b.status}`}>
                  {b.status}
                </span>
              </div>

              <div className="card-body">
                <p><strong>Total:</strong> ₹{b.total_price}</p>
                <p><strong>Check-in:</strong> {b.check_in_date}</p>
                <p><strong>Check-out:</strong> {b.check_out_date}</p>
              </div>

              {b.status !== "cancelled" && (
                <button
                  className="cancel-btn"
                  onClick={() => cancelBooking(b.id)}
                >
                  Cancel Booking
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UserBookings;