import axios from "axios";

const api = axios.create({
  baseURL: "http://192.168.1.6:8000/hotel-infinity",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;