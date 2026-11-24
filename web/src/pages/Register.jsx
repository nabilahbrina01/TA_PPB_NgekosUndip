import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail, Search, Store, UserRound } from "lucide-react";
import { AuthLayout } from "../components/AuthLayout";
import { Field, PasswordField, isEmail } from "../components/FormFields";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const ROLES = [
  { value: "pencari", label: "Pencari kos", icon: Search, info: "Mencari kos/kontrakan dan menyimpan favorit." },
  { value: "pemilik", label: "Pemilik kos", icon: Store, info: "Memasang, mengubah, dan menghapus iklan milik sendiri." },
];

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", role: "pencari" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = "Nama wajib diisi";
    if (!isEmail(form.email)) next.email = "Masukkan email yang valid";
    if (form.password.length < 6) next.password = "Password minimal 6 karakter";
    if (form.confirm !== form.password) next.confirm = "Password tidak sama";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    const email = form.email.trim();
    try {
      // POST /api/auth/register -> kode OTP dikirim ke email
      await register({ name: form.name.trim(), email, password: form.password, role: form.role });
      toast("Kode OTP telah dikirim ke email kamu");
      navigate(`/verifikasi?email=${encodeURIComponent(email)}`, { replace: true });
    } catch (err) {
      toast(err.message);
    } finally {
      setLoading(false);
    }
  }

  const role = ROLES.find((r) => r.value === form.role);

  return (
    <AuthLayout
      back
      title="Buat akun baru"
      subtitle="Daftar untuk mulai mencari atau memasang iklan kos"
      footer={
        <>
          Sudah punya akun? <Link to="/login">Masuk</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <span className="field-label">Daftar sebagai</span>
        <div className="segmented">
          {ROLES.map(({ value, label, icon: Icon }) => (
            <button
              type="button"
              key={value}
              className={form.role === value ? "active" : ""}
              onClick={() => setForm({ ...form, role: value })}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>
        <p className="muted small">{role.info}</p>

        <Field label="Nama lengkap" icon={UserRound} value={form.name} onChange={set("name")} error={errors.name} />
        <Field label="Email" icon={Mail} type="email" autoComplete="email" value={form.email} onChange={set("email")} error={errors.email} />
        <PasswordField label="Password (minimal 6 karakter)" icon={Lock} autoComplete="new-password" value={form.password} onChange={set("password")} error={errors.password} />
        <PasswordField label="Ulangi password" icon={Lock} autoComplete="new-password" value={form.confirm} onChange={set("confirm")} error={errors.confirm} />
        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Mengirim kode..." : "Daftar"}
        </button>
      </form>
    </AuthLayout>
  );
}
