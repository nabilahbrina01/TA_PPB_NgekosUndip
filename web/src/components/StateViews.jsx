import { CircleAlert, LoaderCircle, RefreshCw } from "lucide-react";

export function Loading({ text = "Memuat..." }) {
  return (
    <div className="state-view">
      <LoaderCircle className="spin" size={32} />
      <p>{text}</p>
    </div>
  );
}

export function ErrorView({ error, onRetry }) {
  return (
    <div className="state-view">
      <CircleAlert size={40} color="#DC2626" />
      <p>{error?.message || "Terjadi kesalahan"}</p>
      {onRetry && (
        <button className="btn btn-outline" onClick={onRetry}>
          <RefreshCw size={16} /> Coba lagi
        </button>
      )}
    </div>
  );
}

export function EmptyView({ icon: Icon, title, text }) {
  return (
    <div className="state-view">
      {Icon && <Icon size={44} color="#9AA3B2" />}
      <h3>{title}</h3>
      {text && <p>{text}</p>}
    </div>
  );
}
