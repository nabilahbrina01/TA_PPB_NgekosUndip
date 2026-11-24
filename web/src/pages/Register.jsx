import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail, Phone, Search, Store, UserRound } from "lucide-react";
import { AuthLayout } from "../components/AuthLayout";
import {
  Field, PasswordField, PasswordRules, cleanPhone, isEmail, isPhone, passwordError,
} from "../components/FormFields";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const ROLES = [
  { value: "pencari", label: "Pencari kos", icon: Search, info: "Untuk mencari kos/kontrakan dan menyimpan favorit." },
  { value: "pemilik", label: "Pemilik kos", icon: Store, info: "Untuk memasang dan mengelola iklan milikmu." },
];

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "", role: "pencari" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Ubah isian, sekaligus hapus pesan error kolom tersebut
  const set = (key, transform = (v) => v) => (e) => {
    setForm({ ...form, [key]: transform(e.target.value) });
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = "Nama lengkap wajib diisi";
    if (!isEmail(form.email)) next.email = "Format email belum benar";
    if (!isPhone(form.phone)) next.phone = "Diawali 08, berisi 10–13 angka";
    const pwError = passwordError(form.password);
    if (pwError) next.password = pwError;
    if (!form.confirm) next.confirm = "Ulangi password kamu";
    else if (form.confirm !== form.password) next.confirm = "Konfirmasi password tidak sama";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    const email = form.email.trim();
    try {
      // POST /api/auth/register -> kode OTP dikirim ke email
      await register({
        name: form.name.trim(),
        email,
        phone: cleanPhone(form.phone),
        password: form.password,
        role: form.role,
      });
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
      subtitle="Lengkapi data di bawah untuk mendaftar"
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
        <p className="field-hint role-hint">{role.info}</p>

        <Field
          label="Nama lengkap"
          icon={UserRound}
          autoComplete="name"
          placeholder="Masukkan nama lengkap"
          value={form.name}
          onChange={set("name")}
          error={errors.name}
        />
        <Field
          label="Email"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="Masukkan email aktif"
          hint="Kode verifikasi dikirim ke email ini"
          value={form.email}
          onChange={set("email")}
          error={errors.email}
        />
        <Field
          label="Nomor HP (WhatsApp)"
          icon={Phone}
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="Contoh: 081234567890"
          hint="Diawali 08, berisi 10–13 angka"
          value={form.phone}
          onChange={set("phone", (v) => v.replace(/[^0-9+]/g, "").slice(0, 15))}
          error={errors.phone}
        />
        <PasswordField
          label="Password"
          icon={Lock}
          autoComplete="new-password"
          placeholder="Buat password"
          value={form.password}
          onChange={set("password")}
          error={Boolean(errors.password)}
        />
        <PasswordRules password={form.password} showErrors={Boolean(errors.password)} />
        <PasswordField
          label="Konfirmasi password"
          icon={Lock}
          autoComplete="new-password"
          placeholder="Ulangi password"
          value={form.confirm}
          onChange={set("confirm")}
          error={errors.confirm}
        />
        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Mengirim kode..." : "Daftar"}
        </button>
      </form>
    </AuthLayout>
  );
}
