import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

/** Banner di atas layar saat tidak ada internet. */
export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div className="offline-banner" role="status">
      <WifiOff size={16} /> Kamu sedang offline · menampilkan data terakhir yang tersimpan
    </div>
  );
}
