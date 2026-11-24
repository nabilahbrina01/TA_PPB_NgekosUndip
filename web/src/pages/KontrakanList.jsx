import { Bath, BedDouble, Footprints } from "lucide-react";
import { useKontrakanList } from "../hooks/useProperties";
import { formatDistance, formatRupiah } from "../utils/format";
import ListingPage from "./ListingPage";

const FILTERS = [
  { value: "semua", label: "Semua" },
  { value: "tersedia", label: "Hanya yang tersedia" },
];

const applyFilter = (item, filter) => filter === "semua" || item.is_available;

const toCard = (item) => ({
  imageUrl: item.image_url,
  title: item.name,
  subtitle: `${item.area?.name || "-"}${item.address ? " · " + item.address : ""}`,
  meta: [
    { icon: BedDouble, text: `${item.bedrooms} KT` },
    { icon: Bath, text: `${item.bathrooms} KM` },
    { icon: Footprints, text: formatDistance(item.distance_km) },
  ],
  price: formatRupiah(item.price_per_year),
  priceSuffix: "/tahun",
  badge: item.is_available ? "Tersedia" : "Sudah penuh",
  badgeColor: item.is_available ? "#16A34A" : "#6B7280",
});

export default function KontrakanList() {
  return (
    <ListingPage
      type="kontrakan"
      title="Daftar Kontrakan"
      useList={useKontrakanList}
      filters={FILTERS}
      applyFilter={applyFilter}
      toCard={toCard}
      addLabel="Pasang Iklan Kontrakan"
      priceOf={(k) => k.price_per_year}
      priceSuffix="/tahun"
      priceStep={5000000}
      priceMax={60000000}
    />
  );
}
