import axios from "axios";
console.log(import.meta.env.VITE_API_BASE_URL);
const axiosInstance = axios.create({
  baseURL:import.meta.env.VITE_API_BASE_URL,
  timeout: 10000, // Optional timeout (10 seconds)
  headers: {
    "Content-Type": "application/json",
    // Add other default headers here if needed
  },
  withCredentials:true
});

export default axiosInstance;