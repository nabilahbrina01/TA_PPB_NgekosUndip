import { DoorOpen, Footprints } from "lucide-react";
import { useKosList } from "../hooks/useProperties";
import { TYPE_COLORS, capitalize, formatDistance, formatRupiah } from "../utils/format";
import ListingPage from "./ListingPage";

const FILTERS = [
  { value: "semua", label: "Semua" },
  { value: "putra", label: "Putra" },
  { value: "putri", label: "Putri" },
  { value: "campur", label: "Campur" },
];

const applyFilter = (kos, type) => type === "semua" || kos.type === type;

const toCard = (kos) => ({
  imageUrl: kos.image_url,
  title: kos.name,
  subtitle: `${kos.area?.name || "-"}${kos.address ? " · " + kos.address : ""}`,
  meta: [
    { icon: Footprints, text: `${formatDistance(kos.distance_km)} ke kampus` },
    { icon: DoorOpen, text: `${kos.available_rooms ?? 0} kamar kosong` },
  ],
  price: formatRupiah(kos.price_per_month),
  priceSuffix: "/bulan",
  badge: `Kos ${capitalize(kos.type)}`,
  badgeColor: TYPE_COLORS[kos.type],
});

export default function KosList() {
  return (
    <ListingPage
      type="kos"
      title="Daftar Kos"
      useList={useKosList}
      filters={FILTERS}
      applyFilter={applyFilter}
      toCard={toCard}
      addLabel="Tambah Kos"
      priceOf={(k) => k.price_per_month}
      priceSuffix="/bulan"
      priceStep={250000}
      priceMax={3000000}
    />
  );
}
