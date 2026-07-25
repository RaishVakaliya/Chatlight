import axios from "axios";

// Backend API URL
const getBaseURL = () => {
  if (import.meta.env.MODE === "development") {
    return "http://localhost:5001/api";
  }
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  return backendUrl ? `${backendUrl}/api` : "/api";
};

export const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("jwt");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);
