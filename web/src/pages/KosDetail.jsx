import { DoorOpen, Footprints, Users } from "lucide-react";
import kosService from "../services/kosService";
import { capitalize, formatDistance } from "../utils/format";
import DetailPage from "./DetailPage";

export default function KosDetail() {
  return (
    <DetailPage
      type="kos"
      label="kos"
      fetchOne={kosService.getById}
      remove={kosService.remove}
      badge={(kos) => `Kos ${capitalize(kos.type)}`}
      infoBoxes={(kos) => [
        { icon: Footprints, value: formatDistance(kos.distance_km), text: "ke kampus" },
        { icon: DoorOpen, value: kos.available_rooms ?? 0, text: "kamar kosong" },
        { icon: Users, value: capitalize(kos.type), text: "tipe" },
      ]}
      price={(kos) => kos.price_per_month}
      priceSuffix="/bulan"
    />
  );
}
