import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

/** Kerangka halaman Login / Daftar / OTP / Lupa password. */
export function AuthLayout({ title, subtitle, back = false, children, footer }) {
  const navigate = useNavigate();
  return (
    <div className="auth-page">
      <div className="auth-header">
        {back && (
          <button className="icon-btn light auth-back" onClick={() => navigate(-1)} aria-label="Kembali">
            <ArrowLeft size={22} />
          </button>
        )}
        <img src="/pwa-192.png" alt="" className="auth-logo" />
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="auth-card">{children}</div>
      {footer && <div className="auth-footer">{footer}</div>}
    </div>
  );
}
