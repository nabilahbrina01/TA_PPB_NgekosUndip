import { BedDouble, Building2, ChevronRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

/** Lembar pilihan: mau pasang iklan Kos atau Kontrakan. */
export function AddListingSheet({ open, onClose }) {
  const navigate = useNavigate();
  if (!open) return null;
  const go = (path) => {
    onClose();
    navigate(path);
  };
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="sheet-handle" />
        <div className="sheet-head">
          <h3>Pasang Iklan</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Tutup"><X size={20} /></button>
        </div>
        <p className="sheet-sub">Pilih jenis properti yang ingin kamu iklankan</p>
        <button className="sheet-option" onClick={() => go("/kos/baru")}>
          <span className="sheet-icon"><BedDouble size={24} /></span>
          <span><strong>Kos</strong><small>Sewa kamar bulanan</small></span>
          <ChevronRight size={20} />
        </button>
        <button className="sheet-option" onClick={() => go("/kontrakan/baru")}>
          <span className="sheet-icon"><Building2 size={24} /></span>
          <span><strong>Kontrakan</strong><small>Sewa rumah tahunan</small></span>
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
