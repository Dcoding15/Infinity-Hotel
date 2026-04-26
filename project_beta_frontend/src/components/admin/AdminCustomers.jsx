import { useEffect, useState } from "react";
import axiosInstance from "../../AxiosInstance";
import { useNavigate } from "react-router-dom";
import "./AdminCustomers.css";

function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchCustomers();
  }, [search, filterActive]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      let url = `admin/customers/?search=${search}`;
      if (filterActive !== "") url += `&is_active=${filterActive}`;
      const res = await axiosInstance.get(url);
      setCustomers(res.data.results ?? res.data);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (customer) => {
    try {
      await axiosInstance.patch(`admin/customers/${customer.id}/`, { is_active: !customer.is_active });
      fetchCustomers();
    } catch (err) {
      alert("Update failed.");
    }
  };

  if (loading) return <div className="admin-loading">Loading customers…</div>;

  return (
    <div className="admin-customers">
      <div className="admin-header">
        <h1>Manage <em>Customers</em></h1>
        <p>View and manage registered customers.</p>
      </div>

      <div className="customers-body">
        <div className="filters-bar">
          <input type="text" placeholder="Search by username, email, phone" value={search} onChange={e => setSearch(e.target.value)} className="search-input" />
          <select value={filterActive} onChange={e => setFilterActive(e.target.value)}>
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        <div className="customers-table-container">
          <table className="customers-table">
            <thead>
              <tr><th>ID</th><th>Username</th><th>Email</th><th>Phone</th><th>Bookings</th><th>Joined</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr><td colSpan="8" className="empty-row">No customers found.</td></tr>
              ) : (
                customers.map(c => (
                  <tr key={c.id}>
                    <td>#{c.id}</td>
                    <td>{c.username}</td>
                    <td>{c.email}</td>
                    <td>{c.phone || "—"}</td>
                    <td>{c.booking_count || 0}</td>
                    <td>{new Date(c.date_joined).toLocaleDateString()}</td>
                    <td><span className={`active-badge ${c.is_active ? "active" : "inactive"}`}>{c.is_active ? "Active" : "Inactive"}</span></td>
                    <td>
                      <button className="toggle-btn" onClick={() => toggleActive(c)}>
                        {c.is_active ? "Deactivate" : "Activate"}
                      </button>
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

export default AdminCustomers;