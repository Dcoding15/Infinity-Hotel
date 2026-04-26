import { useEffect, useState } from "react";
import axiosInstance from "../AxiosInstance";
import { useNavigate } from "react-router-dom";
import "./MyPayments.css";

function MyPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("payments/my/");
      setPayments(res.data.results ?? res.data);
    } catch (err) {
      console.error("Fetch error:", err);
      if (err.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    if (status === "paid") return "paid";
    if (status === "pending") return "pending";
    if (status === "failed") return "failed";
    return "refunded";
  };

  return (
    <div className="payments-page">
      <div className="payments-hero">
        <h1>Your <em>payments</em></h1>
        <p>Track all your transactions and payment history.</p>
      </div>

      <main className="payments-body">
        {loading ? (
          <div className="loading-screen">Loading payment history…</div>
        ) : payments.length === 0 ? (
          <div className="empty-state">
            <p>No payments found.</p>
            <span className="empty-link" onClick={() => navigate("/")}>
              Book a room to get started →
            </span>
          </div>
        ) : (
          <div className="payments-table-container">
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Booking ID</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Transaction ID</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>#{p.id}</td>
                    <td>#{p.booking}</td>
                    <td>₹{p.amount}</td>
                    <td>{p.payment_method?.toUpperCase()}</td>
                    <td>
                      <span className={`payment-badge ${getStatusClass(p.payment_status)}`}>
                        {p.payment_status}
                      </span>
                    </td>
                    <td>{p.transaction_id || "—"}</td>
                    <td>{new Date(p.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default MyPayments;