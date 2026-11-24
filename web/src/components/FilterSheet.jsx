import { useState } from "react";
import { Check, X } from "lucide-react";
import { formatRupiah } from "../utils/format";

/**
 * Lembar filter: harga maksimal + fasilitas yang wajib ada.
 * filters = { maxPrice: number|null, facilities: string[] }
 */
export function FilterSheet({ open, onClose, value, onApply, maxLimit, step, facilities, priceSuffix }) {
  const [draft, setDraft] = useState(value);
  if (!open) return null;
  const price = draft.maxPrice ?? maxLimit;
  const toggle = (f) =>
    setDraft((d) => ({ ...d, facilities: d.facilities.includes(f) ? d.facilities.filter((x) => x !== f) : [...d.facilities, f] }));

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="sheet-handle" />
        <div className="sheet-head">
          <h3>Filter</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Tutup"><X size={20} /></button>
        </div>

        <p className="field-label">Harga maksimal</p>
        <p className="filter-price">
          {draft.maxPrice ? formatRupiah(price) : "Semua harga"} <small>{priceSuffix}</small>
        </p>
        <input type="range" className="range" min={step} max={maxLimit} step={step} value={price}
          onChange={(e) => {
            const v = Number(e.target.value);
            setDraft((d) => ({ ...d, maxPrice: v >= maxLimit ? null : v }));
          }} />
        <div className="range-labels"><span>{formatRupiah(step)}</span><span>{formatRupiah(maxLimit)}+</span></div>

        <p className="field-label" style={{ marginTop: 18 }}>Fasilitas wajib ada</p>
        <div className="facility-grid">
          {facilities.map((f) => {
            const on = draft.facilities.includes(f);
            return (
              <button type="button" key={f} className={"facility-chip" + (on ? " active" : "")} onClick={() => toggle(f)}>
                {on && <Check size={15} />} {f}
              </button>
            );
          })}
        </div>

        <div className="sheet-actions">
          <button className="btn btn-light" onClick={() => setDraft({ maxPrice: null, facilities: [] })}>Reset</button>
          <button className="btn btn-primary" onClick={() => { onApply(draft); onClose(); }}>Terapkan</button>
        </div>
      </div>
    </div>
  );
}
