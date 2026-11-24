import { useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { MailCheck } from "lucide-react";
import authService from "../services/authService";
import { AuthLayout } from "../components/AuthLayout";
import { OtpInput, ResendButton } from "../components/OtpWidgets";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

/** Verifikasi email dengan kode OTP setelah daftar. */
export default function VerifyOtp() {
  const [params] = useSearchParams();
  const email = params.get("email") || "";
  const { verifyOtp } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  if (!email) return <Navigate to="/login" replace />;

  async function verify(value = code) {
    if (loading) return;
    if (value.length !== 6) {
      toast("Masukkan 6 digit kode");
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(email, value); // POST /api/auth/verify-otp
      toast("Email terverifikasi. Selamat datang!");
      navigate("/", { replace: true });
    } catch (err) {
      toast(err.message);
      setLoading(false);
    }
  }

  async function resend() {
    try {
      await authService.resendOtp(email, "register");
      toast("Kode OTP baru telah dikirim");
    } catch (err) {
      toast(err.message);
      throw err;
    }
  }

  return (
    <AuthLayout back title="Verifikasi email" subtitle="Satu langkah lagi untuk mengaktifkan akunmu"
      footer="Tidak menemukan email? Cek folder Spam atau Promosi.">
      <form onSubmit={(e) => { e.preventDefault(); verify(); }} className="center">
        <MailCheck size={48} color="#F5B301" />
        <p className="muted">
          Masukkan 6 digit kode yang dikirim ke
          <br />
          <strong className="navy">{email}</strong>
        </p>
        <OtpInput value={code} onChange={setCode} onComplete={verify} />
        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Memeriksa..." : "Verifikasi"}
        </button>
        <ResendButton onResend={resend} />
      </form>
    </AuthLayout>
  );
}
