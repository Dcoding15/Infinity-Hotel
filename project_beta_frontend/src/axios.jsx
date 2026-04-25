import axios from "axios";

const api = axios.create({
<<<<<<< HEAD
  baseURL: "http://localhost:8000/hotel-infinity",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
=======
  baseURL: "http://192.168.1.6:8000/hotel-infinity",
>>>>>>> 89e688e9a1a61adbdbf6bfe407d246d0d89b1596
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log("Request to:", config.baseURL + config.url, "with data:", config.data);
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log("Full error object:", error);
    console.log("Error response status:", error.response?.status);
    console.log("Error response data:", error.response?.data);
    console.log("Error message:", error.message);
    
    if (error.response?.status === 401) {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;