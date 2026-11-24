import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { TOKEN_KEY, USER_KEY } from "../config/api";
import authService from "../services/authService";

const AuthContext = createContext(null);

function readUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

/**
 * Menyimpan sesi login (token JWT + data user) di localStorage,
 * jadi tetap login walau aplikasi ditutup.
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(readUser);

  const saveSession = useCallback((data) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  // Saat aplikasi dibuka: perbarui data user (misalnya role) dari server
  useEffect(() => {
    if (!token) return;
    authService
      .me()
      .then((fresh) => {
        localStorage.setItem(USER_KEY, JSON.stringify(fresh));
        setUser(fresh);
      })
      .catch((err) => {
        if (err.status === 401) logout(); // token kedaluwarsa
      });
  }, [token, logout]);

  const value = {
    token,
    user,
    isLoggedIn: Boolean(token && user),
    isPemilik: user?.role === "pemilik",

    // POST /api/auth/login
    async login(email, password) {
      saveSession(await authService.login(email, password));
    },
    // POST /api/auth/register -> kode OTP dikirim ke email
    register: (body) => authService.register(body),
    // POST /api/auth/verify-otp -> kode benar = langsung login
    async verifyOtp(email, code) {
      saveSession(await authService.verifyOtp(email, code));
    },
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
