import { useEffect, useState } from "react";
import axiosInstance from "../../AxiosInstance";
import { useNavigate } from "react-router-dom";
import "./AdminPayments.css";

function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      let url = "admin/payments/";
      if (statusFilter) url += `?payment_status=${statusFilter}`;
      const res = await axiosInstance.get(url);
      setPayments(res.data.results ?? res.data);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (paymentId, newStatus) => {
    try {
      await axiosInstance.patch(`admin/payments/${paymentId}/`, { payment_status: newStatus });
      fetchPayments();
      alert(`Payment #${paymentId} updated to ${newStatus}.`);
    } catch (err) {
      alert("Update failed.");
    }
  };

  if (loading) return <div className="admin-loading">Loading payments…</div>;

  return (
    <div className="admin-payments">
      <div className="admin-header">
        <h1>Manage <em>Payments</em></h1>
        <p>View and update payment statuses.</p>
      </div>

      <div className="payments-body">
        <div className="filters-bar">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          <button className="reset-btn" onClick={() => setStatusFilter("")}>Reset</button>
        </div>

        <div className="payments-table-container">
          <table className="payments-table">
            <thead>
              <tr><th>ID</th><th>Guest</th><th>Booking ID</th><th>Amount</th><th>Method</th><th>Transaction ID</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan="8" className="empty-row">No payments found.</td></tr>
              ) : (
                payments.map(p => (
                  <tr key={p.id}>
                    <td>#{p.id}</td>
                    <td>{p.user?.username || p.user}</td>
                    <td>#{p.booking}</td>
                    <td>₹{p.amount}</td>
                    <td>{p.payment_method?.toUpperCase()}</td>
                    <td>{p.transaction_id || "—"}</td>
                    <td><span className={`payment-badge ${p.payment_status}`}>{p.payment_status}</span></td>
                    <td className="actions">
                      {p.payment_status !== "paid" && (
                        <button className="mark-paid" onClick={() => updatePaymentStatus(p.id, "paid")}>Mark Paid</button>
                      )}
                      {p.payment_status === "paid" && (
                        <button className="mark-refunded" onClick={() => updatePaymentStatus(p.id, "refunded")}>Refund</button>
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

export default AdminPayments;