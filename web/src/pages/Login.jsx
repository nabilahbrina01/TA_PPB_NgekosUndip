import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail } from "lucide-react";
import { AuthLayout } from "../components/AuthLayout";
import { Field, PasswordField, isEmail } from "../components/FormFields";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const next = {};
    if (!isEmail(email)) next.email = "Masukkan email yang valid";
    if (!password) next.password = "Password wajib diisi";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      toast(err.message);
      // Akun belum verifikasi: API sudah mengirim kode, buka halaman OTP
      if (err.raw?.needsVerification) {
        navigate(`/verifikasi?email=${encodeURIComponent(email.trim())}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Selamat datang!"
      subtitle="Masuk untuk mencari kos di sekitar Undip"
      footer={
        <>
          Belum punya akun? <Link to="/daftar">Daftar</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <Field
          label="Email"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="Masukkan email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <PasswordField
          label="Password"
          icon={Lock}
          autoComplete="current-password"
          placeholder="Masukkan password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <div className="right">
          <Link to={`/lupa-password?email=${encodeURIComponent(email.trim())}`} className="link">
            Lupa password?
          </Link>
        </div>
        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Memproses..." : "Masuk"}
        </button>
      </form>
    </AuthLayout>
  );
}
