import axios from "axios";

// في dev: يستخدم الـ proxy (/api)
// في production: يستخدم VITE_API_BASE_URL الكاملة
const baseURL = import.meta.env.VITE_API_BASE_URL || "/api";

const client = axios.create({ baseURL });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default client;
