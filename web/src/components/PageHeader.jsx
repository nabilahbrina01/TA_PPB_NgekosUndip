import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

/** Judul halaman (AppBar) berwarna navy, opsional tombol kembali. */
export function PageHeader({ title, back = false, actions }) {
  const navigate = useNavigate();
  return (
    <header className="page-header">
      {back && (
        <button className="icon-btn light" onClick={() => navigate(-1)} aria-label="Kembali">
          <ArrowLeft size={22} />
        </button>
      )}
      <h1>{title}</h1>
      <div className="header-actions">{actions}</div>
    </header>
  );
}
