import axios from "axios";
import { getFirebaseAuth } from "./firebase";

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const apiBase = (rawApiUrl || "http://localhost:4000").replace(/\/$/, "");

const api = axios.create({
  baseURL: apiBase,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  if (typeof window === "undefined") return config;
  try {
    const user = getFirebaseAuth().currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    /* Firebase not configured or not initialized yet */
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        window.location.href = "/auth";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
