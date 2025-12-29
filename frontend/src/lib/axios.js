import axios from "axios";

// Backend API URL
const getBaseURL = () => {
  if (import.meta.env.MODE === "development") {
    return "http://localhost:5001/api";
  }
  // In production, use VITE_BACKEND_URL if provided, otherwise use relative path
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  return backendUrl ? `${backendUrl}/api` : "/api";
};

export const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
});
