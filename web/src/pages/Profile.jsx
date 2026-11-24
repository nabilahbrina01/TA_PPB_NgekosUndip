import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, ChevronRight, Download, GraduationCap, IdCard, Info, LogOut, Megaphone, Plus, UserRound } from "lucide-react";
import { AddListingSheet } from "../components/AddListingSheet";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useAuth } from "../context/AuthContext";

// Data pembuat aplikasi
const PEMBUAT = {
  nama: "Nabilah Brina Assyifa",
  nim: "21120123120025",
  prodi: "Teknik Komputer, Universitas Diponegoro",
};

export default function Profile() {
  const { user, isPemilik, logout } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Tombol "Pasang aplikasi" (PWA) jika browser mendukung
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const initial = (user?.name || "?").trim()[0]?.toUpperCase();

  return (
    <div>
      <section className="profile-header">
        <span className="profile-avatar">{initial}</span>
        <h1>{user?.name}</h1>
        <p>{user?.email}</p>
        <span className="role-badge">{isPemilik ? "Pemilik kos" : "Pencari kos"}</span>
      </section>

      <div className="page-pad">
        {installPrompt && (
          <button className="btn btn-gold btn-block" onClick={async () => {
            installPrompt.prompt();
            await installPrompt.userChoice;
            setInstallPrompt(null);
          }}>
            <Download size={18} /> Pasang NgekosUndip di HP
          </button>
        )}

        {isPemilik && (
          <>
            <h2 className="section-title">Kelola Iklan</h2>
            <div className="info-card menu">
              <Link to="/iklan-saya" className="menu-item">
                <Megaphone size={20} /> <span>Iklan saya</span> <ChevronRight size={18} />
              </Link>
              <button className="menu-item" onClick={() => setSheetOpen(true)}>
                <Plus size={20} /> <span>Pasang iklan baru</span> <ChevronRight size={18} />
              </button>
            </div>
          </>
        )}

        <h2 className="section-title">Pembuat Aplikasi</h2>
        <div className="info-card">
          <div className="info-tile"><UserRound size={20} /><div><small>Nama</small><strong>{PEMBUAT.nama}</strong></div></div>
          <div className="info-tile"><IdCard size={20} /><div><small>NIM</small><strong>{PEMBUAT.nim}</strong></div></div>
          <div className="info-tile"><GraduationCap size={20} /><div><small>Program Studi</small><strong>{PEMBUAT.prodi}</strong></div></div>
        </div>

        <h2 className="section-title">Tentang Aplikasi</h2>
        <div className="info-card">
          <div className="info-tile"><Info size={20} /><div><p className="body-text">
            NgekosUndip membantu mahasiswa Universitas Diponegoro mencari kos dan kontrakan di sekitar kampus:
            harga, fasilitas, jarak ke kampus, menghubungi pemilik lewat WhatsApp, membuka lokasi di Google Maps,
            dan menyimpan pilihan ke daftar favorit. Pemilik kos dapat memasang dan mengelola iklannya sendiri.
          </p></div></div>
          <div className="info-tile"><BadgeCheck size={20} /><div><small>Versi</small><strong>1.0.0 (PWA)</strong></div></div>
        </div>

        <button className="btn btn-outline-danger btn-block" onClick={() => setConfirmOpen(true)}>
          <LogOut size={18} /> Keluar
        </button>
      </div>

      <AddListingSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
      <ConfirmDialog open={confirmOpen} title="Keluar dari akun?" message="Kamu perlu masuk lagi untuk melihat data."
        confirmText="Keluar" danger onConfirm={logout} onCancel={() => setConfirmOpen(false)} />
    </div>
  );
}
