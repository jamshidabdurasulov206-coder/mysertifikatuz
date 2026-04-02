import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:4000/api",
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
