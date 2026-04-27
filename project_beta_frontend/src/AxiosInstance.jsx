import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://192.168.1.4:8000/hotel-infinity/", // Update this to your Django server URL
});

// Attach access token to every request automatically
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;