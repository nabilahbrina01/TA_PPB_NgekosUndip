import { Heart } from "lucide-react";
import kontrakanService from "../services/kontrakanService";
import kosService from "../services/kosService";
import { PageHeader } from "../components/PageHeader";
import { PropertyCard } from "../components/PropertyCard";
import { EmptyView, ErrorView, Loading } from "../components/StateViews";
import { useFavorites } from "../context/FavoriteContext";
import { useAsync } from "../hooks/useAsync";
import { TYPE_COLORS, capitalize, formatDistance, formatRupiah } from "../utils/format";

/** Kos & kontrakan yang disimpan akun ini (data favorit dari /api/favorites). */
export default function Favorites() {
  const { isFavorite } = useFavorites();
  const { data, loading, error, reload } = useAsync(
    () => Promise.all([kosService.getAll(), kontrakanService.getAll()]),
    [],
  );

  const kos = data ? data[0].filter((k) => isFavorite("kos", k.id)) : [];
  const kontrakan = data ? data[1].filter((k) => isFavorite("kontrakan", k.id)) : [];

  return (
    <div>
      <PageHeader title="Favorit Saya" />
      {loading && <Loading />}
      {error && <ErrorView error={error} onRetry={reload} />}
      {data && kos.length + kontrakan.length === 0 && (
        <EmptyView icon={Heart} title="Belum ada favorit" text="Tekan ikon hati di kos atau kontrakan untuk menyimpannya di sini." />
      )}
      {kos.length > 0 && <h2 className="section-title page-pad-x">Kos ({kos.length})</h2>}
      <div className="card-list">
        {kos.map((k) => (
          <PropertyCard key={k.id} type="kos" id={k.id} to={`/kos/${k.id}`} imageUrl={k.image_url} title={k.name}
            subtitle={`${k.area?.name || "-"} · ${formatDistance(k.distance_km)}`} price={formatRupiah(k.price_per_month)}
            priceSuffix="/bulan" badge={`Kos ${capitalize(k.type)}`} badgeColor={TYPE_COLORS[k.type]} />
        ))}
      </div>
      {kontrakan.length > 0 && <h2 className="section-title page-pad-x">Kontrakan ({kontrakan.length})</h2>}
      <div className="card-list">
        {kontrakan.map((k) => (
          <PropertyCard key={k.id} type="kontrakan" id={k.id} to={`/kontrakan/${k.id}`} imageUrl={k.image_url} title={k.name}
            subtitle={`${k.area?.name || "-"} · ${k.bedrooms} kamar`} price={formatRupiah(k.price_per_year)}
            priceSuffix="/tahun" badge={k.is_available ? "Tersedia" : "Sudah penuh"} badgeColor={k.is_available ? "#16A34A" : "#6B7280"} />
        ))}
      </div>
    </div>
  );
}
