import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "./AxiosInstance";
import "./Login.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.post("/login/", { username, password });
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      navigate("/user-profile");
    } catch (err) {
      setError(
        err?.response?.data?.detail || "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Left decorative panel */}
      <div className="auth-panel">
        <p className="panel-eyebrow">Hotel Infinity</p>
        <div className="panel-divider" />
        <h2 className="panel-tagline">
          Where luxury<br />meets <em>comfort</em>.
        </h2>
        <p className="panel-sub">
          Sign in to manage your reservations and explore our curated collection of rooms.
        </p>
      </div>

      {/* Right form panel */}
      <div className="auth-form-panel">
        <div className="auth-logo">∞ Hotel Infinity</div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account to continue</p>

        <form onSubmit={handleLogin} className="auth-form">
          <div className="input-group">
            <label className="input-label" htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              autoComplete="username"
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              autoComplete="current-password"
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="switch-text">
          Don't have an account?{" "}
          <span className="switch-link" onClick={() => navigate("/register")}>
            Create one
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;
