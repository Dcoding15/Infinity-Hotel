import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://127.0.0.1:8000/hotel-infinity/",
});

// Attach Bearer Token Automatically
// axiosInstance.interceptors.request.use((config) => {
//   const token = localStorage.getItem("access");
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }

//   return config;
// });

export default axiosInstance;