import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});


// Request interceptor to attach Authorization token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("billing_auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle standard API responses & 401s
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem("billing_auth_token");
        localStorage.removeItem("billing_user_data");
        // Dispatch custom event for session expiry
        window.dispatchEvent(new Event("auth:session-expired"));
      }
      return Promise.reject(error.response.data || error.message);
    }
    return Promise.reject({
      success: false,
      message: "Network error or server unreachable. Please check backend connection.",
      data: null,
      error: error.message,
    });
  }
);

export default api;
