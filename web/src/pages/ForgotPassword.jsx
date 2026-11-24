import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Mail } from "lucide-react";
import authService from "../services/authService";
import { AuthLayout } from "../components/AuthLayout";
import { Field, PasswordField, isEmail } from "../components/FormFields";
import { OtpInput, ResendButton } from "../components/OtpWidgets";
import { useToast } from "../context/ToastContext";

/** Lupa password: (1) isi email -> kode OTP dikirim, (2) kode + password baru. */
export default function ForgotPassword() {
  const [params] = useSearchParams();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState(params.get("email") || "");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Langkah 1: POST /api/auth/forgot-password
  async function sendCode(e) {
    e.preventDefault();
    if (!isEmail(email)) {
      setErrors({ email: "Masukkan email yang valid" });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      setCodeSent(true);
      toast(`Kode OTP telah dikirim ke ${email.trim()}`);
    } catch (err) {
      toast(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Langkah 2: POST /api/auth/reset-password
  async function resetPassword(e) {
    e.preventDefault();
    const next = {};
    if (code.length !== 6) next.code = "Masukkan 6 digit kode";
    if (password.length < 6) next.password = "Password minimal 6 karakter";
    if (confirm !== password) next.confirm = "Password tidak sama";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await authService.resetPassword(email.trim(), code, password);
      toast("Password berhasil diubah, silakan masuk");
      navigate("/login", { replace: true });
    } catch (err) {
      toast(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    try {
      await authService.resendOtp(email.trim(), "reset");
      toast("Kode OTP baru telah dikirim");
    } catch (err) {
      toast(err.message);
      throw err;
    }
  }

  return (
    <AuthLayout
      back
      title="Lupa password"
      subtitle={codeSent ? "Masukkan kode OTP dan password barumu" : "Kami akan mengirim kode OTP ke emailmu"}
    >
      {!codeSent ? (
        <form onSubmit={sendCode} noValidate>
          <Field label="Email akun" icon={Mail} type="email" value={email}
            onChange={(e) => setEmail(e.target.value)} error={errors.email} />
          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Mengirim..." : "Kirim kode OTP"}
          </button>
        </form>
      ) : (
        <form onSubmit={resetPassword} noValidate>
          <p className="muted center">
            Kode dikirim ke <strong className="navy">{email.trim()}</strong>
          </p>
          <OtpInput value={code} onChange={setCode} />
          {errors.code && <p className="field-error center">{errors.code}</p>}
          <PasswordField label="Password baru (minimal 6 karakter)" icon={Lock} autoComplete="new-password"
            value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
          <PasswordField label="Ulangi password baru" icon={Lock} autoComplete="new-password"
            value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} />
          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan password baru"}
          </button>
          <div className="center">
            <ResendButton onResend={resend} />
            <button type="button" className="btn btn-text" onClick={() => { setCodeSent(false); setCode(""); }}>
              Ganti email
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
