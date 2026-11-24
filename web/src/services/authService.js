import { apiClient } from "../config/api";

// Endpoint /api/auth
const authService = {
  register: (data) => apiClient.post("/auth/register", data),
  verifyOtp: (email, code) => apiClient.post("/auth/verify-otp", { email, code }),
  resendOtp: (email, purpose) => apiClient.post("/auth/resend-otp", { email, purpose }),
  login: (email, password) => apiClient.post("/auth/login", { email, password }),
  me: () => apiClient.get("/auth/me"),
  forgotPassword: (email) => apiClient.post("/auth/forgot-password", { email }),
  resetPassword: (email, code, password) =>
    apiClient.post("/auth/reset-password", { email, code, password }),
};

export default authService;
