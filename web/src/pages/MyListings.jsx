import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
import { AddListingSheet } from "../components/AddListingSheet";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ImageBox } from "../components/ImageBox";
import { PageHeader } from "../components/PageHeader";
import { EmptyView, ErrorView, Loading } from "../components/StateViews";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useAsync } from "../hooks/useAsync";
import kontrakanService from "../services/kontrakanService";
import kosService from "../services/kosService";
import { formatRupiah } from "../utils/format";

/** Halaman khusus pemilik: semua iklan miliknya + tombol ubah/hapus. */
export default function MyListings() {
  const { user } = useAuth();
  const toast = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const { data, loading, error, reload } = useAsync(
    () => Promise.all([kosService.getAll(), kontrakanService.getAll()]),
    [],
  );

  const mine = data
    ? [
        ...data[0].filter((k) => k.owner_id === user?.id).map((k) => ({ ...k, kind: "kos", price: k.price_per_month, suffix: "/bulan" })),
        ...data[1].filter((k) => k.owner_id === user?.id).map((k) => ({ ...k, kind: "kontrakan", price: k.price_per_year, suffix: "/tahun" })),
      ]
    : [];

  async function handleDelete() {
    const item = toDelete;
    setToDelete(null);
    try {
      await (item.kind === "kos" ? kosService : kontrakanService).remove(item.id);
      toast(`"${item.name}" dihapus`);
      reload();
    } catch (err) {
      toast(err.message);
    }
  }

  return (
    <div>
      <PageHeader title="Iklan Saya" back />
      {loading && <Loading />}
      {error && <ErrorView error={error} onRetry={reload} />}
      {data && (
        <div className="page-pad">
          <div className="stats-row">
            <div><strong>{mine.length}</strong><small>Total iklan</small></div>
            <div><strong>{mine.filter((m) => m.kind === "kos").length}</strong><small>Kos</small></div>
            <div><strong>{mine.filter((m) => m.kind === "kontrakan").length}</strong><small>Kontrakan</small></div>
          </div>

          {mine.length === 0 && (
            <EmptyView icon={Megaphone} title="Belum ada iklan" text="Pasang iklan pertamamu supaya mahasiswa bisa menemukan propertimu." />
          )}

          <div className="manage-list">
            {mine.map((item) => (
              <div className="manage-card" key={`${item.kind}-${item.id}`}>
                <ImageBox src={item.image_url} alt={item.name} />
                <div className="manage-body">
                  <span className="kind-tag">{item.kind === "kos" ? "Kos" : "Kontrakan"}</span>
                  <strong>{item.name}</strong>
                  <span className="price">{formatRupiah(item.price)}<small>{item.suffix}</small></span>
                  <div className="manage-actions">
                    <Link to={`/${item.kind}/${item.id}`} aria-label="Lihat"><Eye size={16} /> Lihat</Link>
                    <Link to={`/${item.kind}/${item.id}/ubah`} aria-label="Ubah"><Pencil size={16} /> Ubah</Link>
                    <button className="danger" onClick={() => setToDelete(item)} aria-label="Hapus"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button className="fab" onClick={() => setSheetOpen(true)} style={{ bottom: 24 }}>
        <Plus size={20} /> Pasang iklan
      </button>
      <AddListingSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
      <ConfirmDialog open={Boolean(toDelete)} title="Hapus iklan?" message={`"${toDelete?.name}" akan dihapus permanen.`}
        confirmText="Hapus" danger onConfirm={handleDelete} onCancel={() => setToDelete(null)} />
    </div>
  );
}
