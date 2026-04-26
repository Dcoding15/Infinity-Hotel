import { useEffect, useState } from "react";
import axiosInstance from "../AxiosInstance";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

function Profile() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ username: "", email: "", phone: "", first_name: "", last_name: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("profile/");
      setUser(res.data);
      setForm({
        username: res.data.username,
        email: res.data.email,
        phone: res.data.phone || "",
        first_name: res.data.first_name || "",
        last_name: res.data.last_name || "",
      });
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await axiosInstance.patch("profile/", form);
      setMessage("Profile updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(err.response?.data?.detail || "Update failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-screen">Loading profile…</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-hero">
        <h1>Your <em>profile</em></h1>
        <p>Manage your account information.</p>
      </div>

      <main className="profile-body">
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label>Username</label>
            <input type="text" name="username" value={form.username} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>First Name</label>
            <input type="text" name="first_name" value={form.first_name} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Last Name</label>
            <input type="text" name="last_name" value={form.last_name} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input type="tel" name="phone" value={form.phone} onChange={handleChange} />
          </div>

          {message && <div className={`form-message ${message.includes("success") ? "success" : "error"}`}>{message}</div>}

          <button type="submit" disabled={saving} className="save-btn">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default Profile;