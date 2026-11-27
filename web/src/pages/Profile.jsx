import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, CalendarClock, ChevronRight, Download, GraduationCap, IdCard, Info, LogOut, Megaphone, Plus, UserRound } from "lucide-react";
import { AddListingSheet } from "../components/AddListingSheet";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useAuth } from "../context/AuthContext";
import { getInstallPrompt, isIOS, isStandalone, promptInstall, subscribeInstallPrompt } from "../utils/installPrompt";

// Data pembuat aplikasi
const PEMBUAT = {
  nama: "Nabilah Brina Assyifa",
  nim: "21120123120025",
  prodi: "Teknik Komputer, Universitas Diponegoro",
};

export default function Profile() {
  const { user, isPemilik, logout } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(getInstallPrompt());
  const [showGuide, setShowGuide] = useState(false);
  const installed = isStandalone();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Tombol "Pasang aplikasi" (PWA): event ditangkap sejak awal di main.jsx
  useEffect(() => subscribeInstallPrompt(setInstallPrompt), []);

  const handleInstall = async () => {
    if (installPrompt) await promptInstall();
    else setShowGuide((v) => !v);
  };

  const initial = (user?.name || "?").trim()[0]?.toUpperCase();

  return (
    <div>
      <section className="profile-header">
        <span className="profile-avatar">{initial}</span>
        <h1>{user?.name}</h1>
        <p>{user?.email}</p>
        {user?.phone && <p>{user.phone}</p>}
        <span className="role-badge">{isPemilik ? "Pemilik kos" : "Pencari kos"}</span>
      </section>

      <div className="page-pad">
        {!installed && (
          <>
            <button className="btn btn-gold btn-block" onClick={handleInstall}>
              <Download size={18} /> Pasang NgekosUndip di HP
            </button>
            {showGuide && (
              <div className="info-card install-guide">
                {isIOS() ? (
                  <p>Di Safari, tekan tombol <b>Bagikan</b> (kotak dengan panah ke atas), lalu pilih <b>Tambah ke Layar Utama</b>.</p>
                ) : (
                  <p>Buka web ini di <b>Google Chrome</b>, tekan menu <b>⋮</b> di kanan atas, lalu pilih <b>Instal aplikasi</b> atau <b>Tambahkan ke layar utama</b>.</p>
                )}
              </div>
            )}
          </>
        )}

        {!isPemilik && (
          <>
            <h2 className="section-title">Aktivitas</h2>
            <div className="info-card menu">
              <Link to="/jadwal" className="menu-item">
                <CalendarClock size={20} /> <span>Jadwal Kunjungan</span> <ChevronRight size={18} />
              </Link>
            </div>
          </>
        )}

        {isPemilik && (
          <>
            <h2 className="section-title">Kelola Iklan</h2>
            <div className="info-card menu">
              <Link to="/jadwal" className="menu-item">
                <CalendarClock size={20} /> <span>Jadwal Kunjungan</span> <ChevronRight size={18} />
              </Link>
              <Link to="/iklan-saya" className="menu-item">
                <Megaphone size={20} /> <span>Iklan Saya</span> <ChevronRight size={18} />
              </Link>
              <button className="menu-item" onClick={() => setSheetOpen(true)}>
                <Plus size={20} /> <span>Pasang Iklan</span> <ChevronRight size={18} />
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
