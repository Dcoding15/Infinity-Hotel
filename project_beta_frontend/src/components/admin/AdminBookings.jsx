import { useEffect, useState } from "react";
import axiosInstance from "../../AxiosInstance";
import { useNavigate } from "react-router-dom";
import "./AdminBookings.css";

function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", user_id: "", room_id: "" });
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings();
  }, [filters]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status);
      if (filters.user_id) params.set("user_id", filters.user_id);
      if (filters.room_id) params.set("room_id", filters.room_id);
      const res = await axiosInstance.get(`admin/bookings/?${params}`);
      setBookings(res.data.results ?? res.data);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await axiosInstance.patch(`admin/bookings/${bookingId}/`, { status: newStatus });
      fetchBookings();
      alert(`Booking #${bookingId} updated to ${newStatus}.`);
    } catch (err) {
      alert("Update failed.");
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  if (loading) return <div className="admin-loading">Loading bookings…</div>;

  return (
    <div className="admin-bookings">
      <div className="admin-header">
        <h1>Manage <em>Bookings</em></h1>
        <p>View, filter, and update booking statuses.</p>
      </div>

      <div className="bookings-body">
        <div className="filters-bar">
          <select value={filters.status} onChange={e => handleFilterChange("status", e.target.value)}>
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input type="text" placeholder="User ID" value={filters.user_id} onChange={e => handleFilterChange("user_id", e.target.value)} />
          <input type="text" placeholder="Room ID" value={filters.room_id} onChange={e => handleFilterChange("room_id", e.target.value)} />
          <button className="reset-btn" onClick={() => setFilters({ status: "", user_id: "", room_id: "" })}>Reset</button>
        </div>

        <div className="bookings-table-container">
          <table className="bookings-table">
            <thead>
              <tr><th>ID</th><th>Guest</th><th>Room</th><th>Check-in</th><th>Check-out</th><th>Total</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr><td colSpan="8" className="empty-row">No bookings found.</td></tr>
              ) : (
                bookings.map(b => (
                  <tr key={b.id}>
                    <td>#{b.id}</td>
                    <td>{b.user?.username || b.user}</td>
                    <td>{b.room_number || b.room}</td>
                    <td>{b.check_in_date}</td>
                    <td>{b.check_out_date}</td>
                    <td>₹{b.total_price}</td>
                    <td><span className={`status-badge ${b.status}`}>{b.status}</span></td>
                    <td className="actions">
                      {b.status !== "confirmed" && (
                        <button className="confirm-btn" onClick={() => handleStatusChange(b.id, "confirmed")}>Confirm</button>
                      )}
                      {b.status !== "cancelled" && b.status !== "confirmed" && (
                        <button className="cancel-btn" onClick={() => handleStatusChange(b.id, "cancelled")}>Cancel</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminBookings;