import axios from "axios";

const baseURL = process.env.REACT_APP_API_URL
  || (typeof window !== "undefined" && window.location?.origin
    ? `${window.location.origin}/api`
    : "/api");

const instance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Har bir so'rovda tokenni avtomatik qo'shish
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;
  }
  return config;
});

export default instance;
