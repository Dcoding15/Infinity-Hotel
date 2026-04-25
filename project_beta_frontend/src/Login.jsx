import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "./AxiosInstance";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const res = await axiosInstance.post("login/", {
        username: username,
        password: password,
      });

      // store tokens
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      navigate("/rooms");
    } catch (err) {
      const message =
        err?.response?.data?.detail ||
        "Login failed. Please check your credentials." + err;
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "320px", margin: "100px auto", textAlign: "center" }}>
      <h2>Login</h2>

      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{ marginLeft: "10px", width: "100%", padding: "8px" }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p style={{ marginTop: "10px" }}>
          Don't have an account?{" "}
          <span
            onClick={() => navigate("/register")}
            style={{ color: "blue", cursor: "pointer" }}
          >
            Register
          </span>
        </p>
      </form>
    </div>
  );
}

export default Login;