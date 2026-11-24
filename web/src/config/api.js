import axios from "axios";

// ---------------------------------------------------------------------------
// Base URL REST API buatan sendiri (Express di Vercel), dibaca dari .env
// Aplikasi TIDAK mengakses Supabase langsung, semua lewat API ini.
// ---------------------------------------------------------------------------
const BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "https://ta-ppb-ngekos-undip-api.vercel.app/api";

// Kunci localStorage untuk sesi login
export const TOKEN_KEY = "ngekos_token";
export const USER_KEY = "ngekos_user";

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 20000, // 20 detik
});

// ---------------------------------------------------------------------------
// Request interceptor — tempelkan token login (JWT) jika ada
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ---------------------------------------------------------------------------
// Response interceptor — ambil data saja, dan seragamkan bentuk error
// ---------------------------------------------------------------------------
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message = "Terjadi kesalahan yang tidak terduga";
    let status = null;

    if (error.response) {
      status = error.response.status;
      message = error.response.data?.error || `Server error (${status})`;
    } else if (error.request) {
      message = "Tidak dapat terhubung ke server. Periksa koneksi internet.";
    } else {
      message = error.message || message;
    }

    return Promise.reject({ message, status, raw: error.response?.data });
  },
);

export { apiClient, BASE_URL };
