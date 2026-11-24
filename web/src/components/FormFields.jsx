import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/** Kolom isian dengan label dan ikon. */
export function Field({ label, icon: Icon, error, textarea = false, ...props }) {
  const Tag = textarea ? "textarea" : "input";
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className={"field-box" + (error ? " has-error" : "")}>
        {Icon && <Icon size={18} className="field-icon" />}
        <Tag {...props} />
      </span>
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

/** Kolom password dengan tombol lihat / sembunyikan. */
export function PasswordField({ label, icon: Icon, error, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className={"field-box" + (error ? " has-error" : "")}>
        {Icon && <Icon size={18} className="field-icon" />}
        <input type={show ? "text" : "password"} {...props} />
        <button type="button" className="field-toggle" onClick={() => setShow((s) => !s)} aria-label="Lihat password">
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

/** Pilihan (dropdown) dengan label. */
export function SelectField({ label, icon: Icon, error, children, ...props }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className={"field-box" + (error ? " has-error" : "")}>
        {Icon && <Icon size={18} className="field-icon" />}
        <select {...props}>{children}</select>
      </span>
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
