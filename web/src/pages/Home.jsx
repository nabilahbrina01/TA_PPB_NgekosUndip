import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BedDouble, Building2, ChevronRight, MapPin, Megaphone, Plus, Search } from "lucide-react";
import { AddListingSheet } from "../components/AddListingSheet";
import { ImageBox } from "../components/ImageBox";
import { ErrorView, Loading } from "../components/StateViews";
import { useAuth } from "../context/AuthContext";
import { useAsync } from "../hooks/useAsync";
import areaService from "../services/areaService";
import kontrakanService from "../services/kontrakanService";
import kosService from "../services/kosService";
import { formatDistance, formatRupiah } from "../utils/format";

function MiniCard({ to, image, title, meta, price, suffix }) {
  return (
    <Link to={to} className="mini-card">
      <ImageBox src={image} alt={title} />
      <div className="mini-body">
        <strong>{title}</strong>
        <span className="muted small">{meta}</span>
        <span className="price">{price}<small>{suffix}</small></span>
      </div>
    </Link>
  );
}

export default function Home() {
  const { user, isPemilik } = useAuth();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  // GET /api/areas, /api/kos?sort=termurah, /api/kontrakan?sort=terdekat
  const { data, loading, error, reload } = useAsync(
    () => Promise.all([areaService.getAll(), kosService.getAll("termurah"), kontrakanService.getAll("terdekat")]),
    [],
  );
  const firstName = (user?.name || "").split(" ")[0];
  const [areas, kos, kontrakan] = data || [[], [], []];

  return (
    <div>
      <section className="hero">
        <div className="hero-top">
          <div>
            <p className="hero-hello">Halo, {firstName} 👋</p>
            <h1>Temukan tempat tinggal nyaman dekat Undip</h1>
          </div>
          <Link to="/profil" className="hero-avatar" aria-label="Profil">
            {(user?.name || "?")[0].toUpperCase()}
          </Link>
        </div>
        <form className="search-box" onSubmit={(e) => {
          e.preventDefault();
          navigate(`/kos?q=${encodeURIComponent(keyword.trim())}`);
        }}>
          <Search size={18} />
          <input placeholder="Cari nama kos atau area..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        </form>
      </section>

      <div className="page-pad">
        <div className="shortcut-row">
          <Link to="/kos" className="shortcut">
            <span className="shortcut-icon"><BedDouble size={24} /></span>
            <span><strong>Kos</strong><small>{data ? `${kos.length} pilihan` : "Bulanan"}</small></span>
          </Link>
          <Link to="/kontrakan" className="shortcut">
            <span className="shortcut-icon alt"><Building2 size={24} /></span>
            <span><strong>Kontrakan</strong><small>{data ? `${kontrakan.length} pilihan` : "Tahunan"}</small></span>
          </Link>
        </div>

        {isPemilik && (
          <div className="owner-cta">
            <span className="owner-cta-icon"><Megaphone size={22} /></span>
            <div>
              <strong>Punya kos atau kontrakan?</strong>
              <small>Pasang iklan dengan foto, gratis.</small>
            </div>
            <div className="owner-cta-actions">
              <button className="btn btn-gold btn-sm" onClick={() => setSheetOpen(true)}><Plus size={16} /> Pasang</button>
              <Link to="/iklan-saya" className="link small">Iklan saya</Link>
            </div>
          </div>
        )}

        {loading && <Loading />}
        {error && <ErrorView error={error} onRetry={reload} />}
        {data && (
          <>
            <h2 className="section-title">Jelajahi area</h2>
            <div className="chip-row">
              {areas.map((area) => (
                <Link key={area.id} to={`/kos?area=${area.id}`} className="chip">
                  <MapPin size={14} /> {area.name}
                </Link>
              ))}
            </div>

            <div className="section-head">
              <h2 className="section-title">Kos termurah</h2>
              <Link to="/kos" className="link small">Lihat semua <ChevronRight size={14} /></Link>
            </div>
            <div className="mini-row">
              {kos.slice(0, 6).map((k) => (
                <MiniCard key={k.id} to={`/kos/${k.id}`} image={k.image_url} title={k.name}
                  meta={`${k.area?.name || "-"} · ${formatDistance(k.distance_km)}`}
                  price={formatRupiah(k.price_per_month)} suffix="/bulan" />
              ))}
            </div>

            <div className="section-head">
              <h2 className="section-title">Kontrakan terdekat</h2>
              <Link to="/kontrakan" className="link small">Lihat semua <ChevronRight size={14} /></Link>
            </div>
            <div className="mini-row">
              {kontrakan.slice(0, 6).map((k) => (
                <MiniCard key={k.id} to={`/kontrakan/${k.id}`} image={k.image_url} title={k.name}
                  meta={`${k.area?.name || "-"} · ${k.bedrooms} kamar`}
                  price={formatRupiah(k.price_per_year)} suffix="/tahun" />
              ))}
            </div>
          </>
        )}
      </div>
      <AddListingSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}
