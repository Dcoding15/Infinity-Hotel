import { useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  })();

  const isLoggedIn = Boolean(localStorage.getItem("access"));
  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="navbar">
      <div className="navbar-brand" onClick={() => navigate("/")}>
        ∞ Hotel <span>Infinity</span>
      </div>

      <nav className="navbar-links">
        <button
          className={`nav-link ${isActive("/") ? "active" : ""}`}
          onClick={() => navigate("/")}
        >
          Rooms
        </button>

        {isLoggedIn && !isAdmin && (
          <>
            <button
              className={`nav-link ${isActive("/bookings") ? "active" : ""}`}
              onClick={() => navigate("/bookings")}
            >
              My Bookings
            </button>
            <button
              className={`nav-link ${isActive("/payments") ? "active" : ""}`}
              onClick={() => navigate("/payments")}
            >
              Payments
            </button>
            <button
              className={`nav-link ${isActive("/profile") ? "active" : ""}`}
              onClick={() => navigate("/profile")}
            >
              Profile
            </button>
          </>
        )}

        {isAdmin && (
          <>
            <button
              className={`nav-link ${isActive("/admin") ? "active" : ""}`}
              onClick={() => navigate("/admin")}
            >
              Dashboard
            </button>
            <button
              className={`nav-link ${isActive("/admin/rooms") ? "active" : ""}`}
              onClick={() => navigate("/admin/rooms")}
            >
              Rooms
            </button>
            <button
              className={`nav-link ${isActive("/admin/bookings") ? "active" : ""}`}
              onClick={() => navigate("/admin/bookings")}
            >
              Bookings
            </button>
            <button
              className={`nav-link ${isActive("/admin/customers") ? "active" : ""}`}
              onClick={() => navigate("/admin/customers")}
            >
              Customers
            </button>
            <button
              className={`nav-link ${isActive("/admin/payments") ? "active" : ""}`}
              onClick={() => navigate("/admin/payments")}
            >
              Payments
            </button>
          </>
        )}
      </nav>

      <div className="navbar-actions">
        {isLoggedIn ? (
          <>
            <span className="navbar-user">
              {user?.username ?? "Account"}
              {isAdmin && <span className="admin-badge">Admin</span>}
            </span>
            <button className="btn-amber" onClick={handleLogout}>
              Sign Out
            </button>
          </>
        ) : (
          <>
            <button className="btn-outline" onClick={() => navigate("/login")}>
              Sign In
            </button>
            <button className="btn-amber" onClick={() => navigate("/register")}>
              Register
            </button>
          </>
        )}
      </div>
    </header>
  );
}

export default Navbar;