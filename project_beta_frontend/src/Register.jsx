import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "./AxiosInstance";
import "./Register.css";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axiosInstance.post("/register/", { username, email, password });
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      navigate("/login");
    } catch (err) {
      console.error(err);
      const data = err?.response?.data;
      const message =
        (data && typeof data === "object"
          ? Object.values(data).flat().join(" ")
          : null) || "Registration failed. Please try again.";
      setError(message);
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
          Begin your<br /><em>journey</em> with us.
        </h2>
        <p className="panel-sub">
          Create an account and unlock seamless booking, exclusive rates, and a world-class stay.
        </p>
      </div>

      {/* Right form panel */}
      <div className="auth-form-panel">
        <div className="auth-logo">∞ Hotel Infinity</div>

        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Join us — it only takes a moment</p>

        <form onSubmit={handleRegister} className="auth-form">
          <div className="input-group">
            <label className="input-label" htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              autoComplete="username"
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              autoComplete="email"
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              autoComplete="new-password"
              required
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="switch-text">
          Already have an account?{" "}
          <span className="switch-link" onClick={() => navigate("/login")}>
            Sign in
          </span>
        </p>
      </div>
    </div>
  );
}

export default Register;
