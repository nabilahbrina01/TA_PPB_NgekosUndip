import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarClock, Check, Copy, Map, MapPin, MessageCircle, Pencil, Phone, Trash2, UserRound } from "lucide-react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { FavoriteButton } from "../components/FavoriteButton";
import { Marker } from "react-leaflet";
import { BaseMap, FitBounds, icons } from "../components/MapParts";
import { PhotoGallery } from "../components/PhotoGallery";
import { SchedulePicker } from "../components/SchedulePicker";
import { ErrorView, Loading } from "../components/StateViews";
import { useAuth } from "../context/AuthContext";
import { useUserLocation } from "../context/LocationContext";
import { useToast } from "../context/ToastContext";
import { useAsync } from "../hooks/useAsync";
import { formatRupiah, mapsLink, whatsappLink } from "../utils/format";
import { CAMPUS, distanceFrom, hasCoords } from "../utils/geo";

/**
 * Halaman detail yang dipakai bersama oleh Kos dan Kontrakan.
 * Tombol ubah & hapus hanya muncul untuk pemilik iklan ini.
 */
export default function DetailPage({ type, label, fetchOne, remove, badge, infoBoxes, price, priceSuffix }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, isPemilik } = useAuth();
  const { location } = useUserLocation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const { data: item, loading, error, reload } = useAsync(() => fetchOne(id), [id]);

  if (loading) return <Loading />;
  if (error) return <ErrorView error={error} onRetry={reload} />;

  const fromMe = distanceFrom(location, item);
  const isOwner = isPemilik && item.owner_id && item.owner_id === user?.id;
  const message = `Halo, saya melihat ${label} "${item.name}" di aplikasi NgekosUndip. Apakah masih tersedia?`;

  async function handleDelete() {
    setConfirmOpen(false);
    try {
      await remove(item.id); // DELETE /api/<type>/:id
      toast("Iklan berhasil dihapus", "success");
      navigate(`/${type}`, { replace: true });
    } catch (err) {
      toast(err.message, "error");
    }
  }

  return (
    <div className="detail-page">
      <div className="detail-hero">
        <PhotoGallery images={item.image_urls?.length ? item.image_urls : [item.image_url]} alt={item.name} />
        <div className="detail-top">
          <button className="circle-btn" onClick={() => navigate(-1)} aria-label="Kembali">
            <ArrowLeft size={20} />
          </button>
          <div className="detail-actions">
            {isOwner && (
              <>
                <Link to={`/${type}/${item.id}/ubah`} className="circle-btn" aria-label="Ubah">
                  <Pencil size={18} />
                </Link>
                <button className="circle-btn danger" onClick={() => setConfirmOpen(true)} aria-label="Hapus">
                  <Trash2 size={18} />
                </button>
              </>
            )}
            <span className="circle-btn"><FavoriteButton type={type} id={item.id} /></span>
          </div>
        </div>
      </div>

      <div className="detail-body">
        <span className="badge soft">{badge(item)}</span>
        {isOwner && <span className="badge owner">Iklan saya</span>}
        <h1 className="detail-title">{item.name}</h1>
        <p className="muted with-icon">
          <MapPin size={16} color="#F5B301" /> {item.area?.name || "-"} · {item.address || "-"}
        </p>
        {fromMe != null && (
          <p className="from-me-line">{fromMe.toLocaleString("id-ID", { maximumFractionDigits: 1 })} km dari lokasimu sekarang</p>
        )}

        <div className="info-row">
          {infoBoxes(item).map(({ icon: Icon, value, text }) => (
            <div className="info-box" key={text}>
              <Icon size={20} color="#1B4F8C" />
              <strong>{value}</strong>
              <small>{text}</small>
            </div>
          ))}
        </div>

        <h2 className="section-title">Deskripsi</h2>
        <p className="body-text">{item.description || "-"}</p>

        <h2 className="section-title">Fasilitas</h2>
        <div className="chip-row wrap">
          {(item.facilities || []).length === 0 && <span className="muted">-</span>}
          {(item.facilities || []).map((f) => (
            <span key={f} className="chip static"><Check size={14} /> {f}</span>
          ))}
        </div>

        <h2 className="section-title">Lokasi</h2>
        {hasCoords(item) ? (
          <div className="map-frame small">
            <BaseMap center={[item.latitude, item.longitude]} zoom={15}>
              <Marker position={[item.latitude, item.longitude]} icon={icons.home} />
              {location && <Marker position={[location.lat, location.lng]} icon={icons.me} />}
              <FitBounds points={[[item.latitude, item.longitude], [CAMPUS.lat, CAMPUS.lng], ...(location ? [[location.lat, location.lng]] : [])]} />
            </BaseMap>
          </div>
        ) : (
          <p className="muted">Pemilik belum menandai titik lokasi di peta.</p>
        )}
        <a className="btn btn-light btn-block" target="_blank" rel="noreferrer"
          href={hasCoords(item) ? mapsLink(`${item.latitude},${item.longitude}`) : mapsLink(item.address || `${item.name} ${item.area?.name || ""} Semarang`)}>
          <Map size={18} /> Buka di Google Maps
        </a>

        <h2 className="section-title">Jadwal Kunjungan</h2>
        {isOwner ? (
          <div className="visit-card">
            <CalendarClock size={22} />
            <div>
              <strong>Atur jadwal kosongmu</strong>
              <p>Calon penyewa bisa memilih jadwal kosong yang kamu sediakan untuk melihat properti.</p>
            </div>
            <Link to="/jadwal?tab=kosong" className="btn btn-light btn-sm">Atur</Link>
          </div>
        ) : !item.owner_id ? (
          <p className="muted">Iklan ini belum mendukung jadwal kunjungan online. Hubungi pemilik lewat WhatsApp.</p>
        ) : isPemilik ? (
          <p className="muted">Pengajuan jadwal kunjungan hanya untuk akun pencari kos.</p>
        ) : (
          <div className="visit-card">
            <CalendarClock size={22} />
            <div>
              <strong>Mau lihat langsung?</strong>
              <p>Pilih jadwal kosong dari pemilik, lalu tunggu konfirmasinya.</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setScheduleOpen(true)}>Pilih jadwal</button>
          </div>
        )}

        <h2 className="section-title">Pemilik</h2>
        <div className="owner-card">
          <span className="avatar"><UserRound size={22} /></span>
          <div>
            <strong>{item.owner_name || "-"}</strong>
            <p className="muted with-icon"><Phone size={14} /> {item.owner_phone || "-"}</p>
          </div>
          {item.owner_phone && (
            <button className="icon-btn" aria-label="Salin nomor" onClick={() => {
              navigator.clipboard?.writeText(item.owner_phone);
              toast("Nomor pemilik disalin", "success");
            }}>
              <Copy size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="price-bar">
        <div>
          <small className="muted">Harga</small>
          <p className="price-big">{formatRupiah(price(item))} <small>{priceSuffix}</small></p>
        </div>
        {item.owner_phone ? (
          <a className="btn btn-primary" href={whatsappLink(item.owner_phone, message)} target="_blank" rel="noreferrer">
            <MessageCircle size={18} /> WhatsApp
          </a>
        ) : (
          <button className="btn btn-primary" disabled>
            <MessageCircle size={18} /> WhatsApp
          </button>
        )}
      </div>

      {item.owner_id && !isOwner && !isPemilik && (
        <SchedulePicker open={scheduleOpen} onClose={() => setScheduleOpen(false)} item={item} itemType={type} />
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Hapus data?"
        message={`"${item.name}" akan dihapus permanen dari database.`}
        confirmText="Hapus"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
