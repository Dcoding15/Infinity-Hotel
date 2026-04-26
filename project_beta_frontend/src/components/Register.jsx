import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../AxiosInstance";
import "./Register.css";

function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axiosInstance.post("register/", form);
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/");
    } catch (err) {
      const data = err?.response?.data;
      const message =
        data && typeof data === "object"
          ? Object.values(data).flat().join(" ")
          : "Registration failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
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

      <div className="auth-form-panel">
        <div className="auth-logo">∞ Hotel Infinity</div>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Join us — it only takes a moment</p>

        <form onSubmit={handleRegister} className="auth-form">
          {[
            { name: "username", label: "Username", type: "text", placeholder: "Choose a username", autoComplete: "username" },
            { name: "email", label: "Email", type: "email", placeholder: "your@email.com", autoComplete: "email" },
            { name: "phone", label: "Phone (optional)", type: "tel", placeholder: "+91 XXXXX XXXXX", autoComplete: "tel" },
            { name: "password", label: "Password", type: "password", placeholder: "Min. 8 characters", autoComplete: "new-password" },
          ].map(({ name, label, type, placeholder, autoComplete }) => (
            <div className="input-group" key={name}>
              <label className="input-label" htmlFor={name}>{label}</label>
              <input
                id={name}
                name={name}
                type={type}
                placeholder={placeholder}
                value={form[name]}
                onChange={handleChange}
                className="input-field"
                autoComplete={autoComplete}
                required={name !== "phone"}
              />
            </div>
          ))}

          {error && <p className="form-error">{error}</p>}

          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="switch-text">
          Already have an account?{" "}
          <span className="switch-link" onClick={() => navigate("/login")}>Sign in</span>
        </p>
      </div>
    </div>
  );
}

export default Register;