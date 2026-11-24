import { Check, Minus, Plus, X } from "lucide-react";
import { useState } from "react";

/** Indikator langkah di bagian atas form. */
export function StepProgress({ steps, current }) {
  return (
    <div className="step-progress">
      <div className="step-dots">
        {steps.map((s, i) => (
          <div key={s} className={"step-dot" + (i < current ? " done" : i === current ? " active" : "")}>
            <span>{i < current ? <Check size={14} /> : i + 1}</span>
          </div>
        ))}
      </div>
      <p className="step-label">
        Langkah {current + 1} dari {steps.length} · <strong>{steps[current]}</strong>
      </p>
    </div>
  );
}

/** Pilihan berbentuk kartu (misalnya tipe kos). */
export function OptionCards({ options, value, onChange }) {
  return (
    <div className="option-cards">
      {options.map(({ value: v, label, icon: Icon, hint }) => (
        <button type="button" key={v} className={"option-card" + (value === v ? " active" : "")} onClick={() => onChange(v)}>
          {Icon && <Icon size={22} />}
          <strong>{label}</strong>
          {hint && <small>{hint}</small>}
        </button>
      ))}
    </div>
  );
}

/** Tombol - angka + untuk jumlah kamar. */
export function Counter({ label, icon: Icon, value, onChange, min = 0, max = 50 }) {
  const n = Number(value) || 0;
  return (
    <div className="counter-row">
      <span className="counter-label">
        {Icon && <Icon size={20} />} {label}
      </span>
      <div className="counter">
        <button type="button" onClick={() => onChange(Math.max(min, n - 1))} disabled={n <= min} aria-label="Kurangi">
          <Minus size={18} />
        </button>
        <strong>{n}</strong>
        <button type="button" onClick={() => onChange(Math.min(max, n + 1))} disabled={n >= max} aria-label="Tambah">
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}

/** Pilih fasilitas: centang dari daftar + tambah sendiri. */
export function FacilityPicker({ presets, value, onChange }) {
  const [custom, setCustom] = useState("");
  const toggle = (f) => onChange(value.includes(f) ? value.filter((x) => x !== f) : [...value, f]);
  const extras = value.filter((f) => !presets.includes(f));

  function addCustom() {
    const name = custom.trim();
    if (name && !value.includes(name)) onChange([...value, name]);
    setCustom("");
  }

  return (
    <div>
      <div className="facility-grid">
        {[...presets, ...extras].map((f) => {
          const on = value.includes(f);
          return (
            <button type="button" key={f} className={"facility-chip" + (on ? " active" : "")} onClick={() => toggle(f)}>
              {on ? <Check size={15} /> : <Plus size={15} />} {f}
              {!presets.includes(f) && <X size={14} className="chip-x" />}
            </button>
          );
        })}
      </div>
      <div className="add-facility">
        <input
          placeholder="Fasilitas lain, misal: Dispenser"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
        />
        <button type="button" onClick={addCustom} disabled={!custom.trim()}>
          Tambah
        </button>
      </div>
    </div>
  );
}

/** Input harga dengan format ribuan: 950000 -> 950.000 */
export function PriceInput({ value, onChange, placeholder, suffix, error }) {
  const display = value ? Number(value).toLocaleString("id-ID") : "";
  return (
    <div className="field">
      <div className={"price-input" + (error ? " has-error" : "")}>
        <span>Rp</span>
        <input
          inputMode="numeric"
          placeholder={placeholder}
          value={display}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 11))}
        />
        <small>{suffix}</small>
      </div>
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
