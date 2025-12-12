import axios from "axios";
console.log(import.meta.env.VITE_API_BASE_URL);
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL + '/api',  // Backend API is now under /api path
  timeout: 10000, // Optional timeout (10 seconds)
  headers: {
    "Content-Type": "application/json",
    // Add other default headers here if needed
  },
  withCredentials: true,
  maxRedirects: 0 // Don't follow redirects globally
});

export default axiosInstance;