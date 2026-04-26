import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://192.168.1.4:8000/hotel-infinity/",
});

export default axiosInstance;