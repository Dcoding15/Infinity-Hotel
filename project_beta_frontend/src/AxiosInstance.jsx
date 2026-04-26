import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://192.168.1.4:8000/hotel-infinity/",
});

// Attach access token to every request automatically
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If a 401 comes back, try refreshing the token once
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem("refresh");

      if (refresh) {
        try {
          const res = await axios.post(
            "http://192.168.1.4:8000/hotel-infinity/token/refresh/",
            { refresh }
          );
          localStorage.setItem("access", res.data.access);
          original.headers.Authorization = `Bearer ${res.data.access}`;
          return axiosInstance(original);
        } catch {
          // Refresh failed — clear tokens and let the caller handle 401
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;