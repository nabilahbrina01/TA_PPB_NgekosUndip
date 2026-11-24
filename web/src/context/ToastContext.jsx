import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";

const ToastContext = createContext(() => {});

const ICONS = { success: CircleCheck, error: CircleAlert, info: Info };

/**
 * Notifikasi singkat di bagian atas layar.
 * Pemakaian: toast("Pesan")            -> info
 *            toast("Berhasil", "success")
 *            toast(err.message, "error")
 */
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const hide = useCallback(() => {
    clearTimeout(timer.current);
    setToast(null);
  }, []);

  const show = useCallback((text, type = "info") => {
    clearTimeout(timer.current);
    // id baru agar animasi muncul ulang walau pesannya sama
    setToast({ id: Date.now(), text, type: ICONS[type] ? type : "info" });
    timer.current = setTimeout(() => setToast(null), type === "error" ? 4000 : 2800);
  }, []);

  const Icon = toast ? ICONS[toast.type] : null;

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <div key={toast.id} className={`toast toast-${toast.type}`} role={toast.type === "error" ? "alert" : "status"}>
          <Icon size={18} className="toast-icon" />
          <span className="toast-text">{toast.text}</span>
          <button type="button" className="toast-close" onClick={hide} aria-label="Tutup notifikasi">
            <X size={14} />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
