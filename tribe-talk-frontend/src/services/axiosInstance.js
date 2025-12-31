import axios from "axios";
console.log(import.meta.env.VITE_API_BASE_URL);
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,  // Ingress handles /api routing
  timeout: 10000, // Optional timeout (10 seconds)
  headers: {
    "Content-Type": "application/json",
    // Add other default headers here if needed
  },
  withCredentials: true,
  maxRedirects: 0 // Don't follow redirects globally
});

// Token refresh state management
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor for automatic token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => axiosInstance(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh endpoint
        await axiosInstance.post('/api/auth/refresh');

        // Retry all queued requests
        processQueue(null);

        // Retry original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear queue and redirect to login
        processQueue(refreshError);

        // Redirect to login page
        window.location.href = '/';

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;