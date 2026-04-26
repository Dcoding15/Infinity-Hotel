import { useEffect, useState } from "react";
import axiosInstance from "../../AxiosInstance";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRooms: 0,
    totalBookings: 0,
    totalCustomers: 0,
    pendingPayments: 0,
    recentBookings: [],
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [roomsRes, bookingsRes, customersRes, paymentsRes] = await Promise.all([
        axiosInstance.get("admin/rooms/"),
        axiosInstance.get("admin/bookings/"),
        axiosInstance.get("admin/customers/"),
        axiosInstance.get("admin/payments/"),
      ]);

      const totalRooms = roomsRes.data.count || roomsRes.data.length;
      const totalBookings = bookingsRes.data.count || bookingsRes.data.length;
      const totalCustomers = customersRes.data.count || customersRes.data.length;
      const pendingPayments = (paymentsRes.data.results || paymentsRes.data).filter(p => p.payment_status === "pending").length;

      const recent = (bookingsRes.data.results || bookingsRes.data).slice(0, 5);

      setStats({
        totalRooms,
        totalBookings,
        totalCustomers,
        pendingPayments,
        recentBookings: recent,
      });
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      if (err.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="admin-loading">Loading dashboard…</div>;

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin <em>Dashboard</em></h1>
        <p>Welcome back, administrator. Here's an overview of your hotel.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🛏️</div>
          <div className="stat-info">
            <h3>{stats.totalRooms}</h3>
            <p>Total Rooms</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <h3>{stats.totalBookings}</h3>
            <p>Total Bookings</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{stats.totalCustomers}</h3>
            <p>Customers</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>{stats.pendingPayments}</h3>
            <p>Pending Payments</p>
          </div>
        </div>
      </div>

      <div className="recent-section">
        <h2>Recent Bookings</h2>
        {stats.recentBookings.length === 0 ? (
          <p>No recent bookings.</p>
        ) : (
          <div className="recent-table-container">
            <table className="recent-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Guest</th>
                  <th>Room</th>
                  <th>Check-in</th>
                  <th>Status</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentBookings.map((b) => (
                  <tr key={b.id}>
                    <td>#{b.id}</td>
                    <td>{b.user?.username || b.user}</td>
                    <td>{b.room_number || b.room}</td>
                    <td>{b.check_in_date}</td>
                    <td>
                      <span className={`status-badge ${b.status}`}>{b.status}</span>
                    </td>
                    <td>₹{b.total_price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;