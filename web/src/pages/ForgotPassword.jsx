import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Mail } from "lucide-react";
import authService from "../services/authService";
import { AuthLayout } from "../components/AuthLayout";
import { Field, FormNote, PasswordField, PasswordRules, isEmail, passwordError } from "../components/FormFields";
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
      setErrors({ email: "Format email belum benar" });
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
    const pwError = passwordError(password);
    if (pwError) next.password = pwError;
    if (!confirm) next.confirm = "Ulangi password baru";
    else if (confirm !== password) next.confirm = "Konfirmasi password tidak sama";
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
      subtitle={codeSent ? "Buat password baru untuk akunmu" : "Atur ulang password akunmu"}
    >
      <p className="step-badge">Langkah {codeSent ? 2 : 1} dari 2</p>

      {!codeSent ? (
        <form onSubmit={sendCode} noValidate>
          <FormNote>
            Masukkan email yang terdaftar untuk menerima <b>kode verifikasi</b>.
          </FormNote>
          <Field
            label="Email"
            icon={Mail}
            type="email"
            autoComplete="email"
            placeholder="Masukkan email terdaftar"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Mengirim..." : "Kirim kode verifikasi"}
          </button>
        </form>
      ) : (
        <form onSubmit={resetPassword} noValidate>
          <FormNote>
            Kode dikirim ke <b>{email.trim()}</b>. Cek juga folder Spam.
          </FormNote>

          <span className="field-label">Kode verifikasi</span>
          <OtpInput value={code} onChange={(v) => { setCode(v); setErrors((p) => ({ ...p, code: undefined })); }} />
          {errors.code
            ? <p className="field-error center">{errors.code}</p>
            : <p className="field-hint center">Berlaku 1 menit, maksimal 3 kali salah</p>}

          <PasswordField
            label="Password baru"
            icon={Lock}
            autoComplete="new-password"
            placeholder="Buat password baru"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={Boolean(errors.password)}
          />
          <PasswordRules password={password} showErrors={Boolean(errors.password)} />
          <PasswordField
            label="Konfirmasi password baru"
            icon={Lock}
            autoComplete="new-password"
            placeholder="Ulangi password baru"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={errors.confirm}
          />
          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan password baru"}
          </button>
          <div className="center">
            <ResendButton onResend={resend} />
            <button type="button" className="btn btn-text" onClick={() => { setCodeSent(false); setCode(""); setErrors({}); }}>
              Ganti email
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
