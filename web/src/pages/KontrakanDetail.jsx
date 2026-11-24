import { Bath, BedDouble, Footprints } from "lucide-react";
import kontrakanService from "../services/kontrakanService";
import { formatDistance } from "../utils/format";
import DetailPage from "./DetailPage";

export default function KontrakanDetail() {
  return (
    <DetailPage
      type="kontrakan"
      label="kontrakan"
      fetchOne={kontrakanService.getById}
      remove={kontrakanService.remove}
      badge={(item) => (item.is_available ? "Tersedia" : "Sudah penuh")}
      infoBoxes={(item) => [
        { icon: BedDouble, value: item.bedrooms ?? "-", text: "kamar tidur" },
        { icon: Bath, value: item.bathrooms ?? "-", text: "kamar mandi" },
        { icon: Footprints, value: formatDistance(item.distance_km), text: "ke kampus" },
      ]}
      price={(item) => item.price_per_year}
      priceSuffix="/tahun"
    />
  );
}
