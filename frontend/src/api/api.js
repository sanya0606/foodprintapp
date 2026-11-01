import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "https://foodprintapp.onrender.com/api",
});

// Attach the stored JWT to every request, if present
api.interceptors.request.use((config) => {
  const stored = localStorage.getItem("foodprint_user");
  if (stored) {
    const { token } = JSON.parse(stored);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
