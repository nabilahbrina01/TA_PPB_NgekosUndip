import { useState } from "react";
import { Check, Eye, EyeOff, Info } from "lucide-react";

/** Teks bantuan di bawah kolom (diganti pesan error jika ada). */
function Hint({ error, hint }) {
  if (error === true) return null; // kolom ditandai merah tanpa teks (pesan ada di tempat lain)
  if (error) return <span className="field-error">{error}</span>;
  if (hint) return <span className="field-hint">{hint}</span>;
  return null;
}

/** Kolom isian dengan label, ikon, placeholder, dan teks bantuan. */
export function Field({ label, icon: Icon, error, hint, textarea = false, ...props }) {
  const Tag = textarea ? "textarea" : "input";
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className={"field-box" + (error ? " has-error" : "")}>
        {Icon && <Icon size={18} className="field-icon" />}
        <Tag {...props} />
      </span>
      <Hint error={error} hint={hint} />
    </label>
  );
}

/** Kolom password dengan tombol lihat / sembunyikan. */
export function PasswordField({ label, icon: Icon, error, hint, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className={"field-box" + (error ? " has-error" : "")}>
        {Icon && <Icon size={18} className="field-icon" />}
        <input type={show ? "text" : "password"} {...props} />
        <button type="button" className="field-toggle" onClick={() => setShow((s) => !s)}
          aria-label={show ? "Sembunyikan password" : "Lihat password"}>
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
      <Hint error={error} hint={hint} />
    </label>
  );
}

/** Pilihan (dropdown) dengan label. */
export function SelectField({ label, icon: Icon, error, hint, children, ...props }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className={"field-box" + (error ? " has-error" : "")}>
        {Icon && <Icon size={18} className="field-icon" />}
        <select {...props}>{children}</select>
      </span>
      <Hint error={error} hint={hint} />
    </label>
  );
}

/** Kotak petunjuk singkat di atas form. */
export function FormNote({ children }) {
  return (
    <div className="form-note">
      <Info size={18} />
      <div>{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ketentuan password (sama dengan pengecekan di API)
// ---------------------------------------------------------------------------
export const PASSWORD_RULES = [
  { label: "Minimal 8 karakter", test: (p) => p.length >= 8 },
  { label: "Mengandung huruf", test: (p) => /[A-Za-z]/.test(p) },
  { label: "Mengandung angka", test: (p) => /\d/.test(p) },
];

export function passwordError(password) {
  const failed = PASSWORD_RULES.find((r) => !r.test(password));
  return failed ? `Password belum ${failed.label.toLowerCase()}` : null;
}

/** Daftar ketentuan password yang tercentang otomatis saat diketik. */
export function PasswordRules({ password, showErrors = false }) {
  return (
    <ul className="password-rules">
      {PASSWORD_RULES.map((r) => (
        <li key={r.label} className={r.test(password) ? "ok" : showErrors ? "bad" : ""}>
          <Check size={14} /> {r.label}
        </li>
      ))}
    </ul>
  );
}

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Nomor HP Indonesia: hanya angka, awalan +62/62 diubah menjadi 0. */
export function cleanPhone(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("62")) digits = "0" + digits.slice(2);
  return digits;
}

export function isPhone(value) {
  return /^08\d{8,11}$/.test(cleanPhone(value));
}
