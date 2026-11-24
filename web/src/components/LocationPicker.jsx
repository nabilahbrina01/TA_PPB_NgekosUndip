import { useState } from "react";
import { Crosshair, LoaderCircle, MapPin } from "lucide-react";
import { Marker } from "react-leaflet";
import { useUserLocation } from "../context/LocationContext";
import { CAMPUS, distanceKm } from "../utils/geo";
import { BaseMap, ClickHandler, FlyTo, icons } from "./MapParts";

/**
 * Pemilik menandai lokasi properti di peta (ketuk / geser penanda),
 * atau memakai lokasi HP saat ini. Jarak ke kampus dihitung otomatis.
 */
export function LocationPicker({ value, onChange, onError, fallbackCenter }) {
  const { requestLocation } = useUserLocation();
  const [locating, setLocating] = useState(false);
  const point = value ? [value.lat, value.lng] : null;
  const center = point || fallbackCenter || [CAMPUS.lat, CAMPUS.lng];
  const km = value ? distanceKm(value.lat, value.lng, CAMPUS.lat, CAMPUS.lng) : null;

  async function useMyLocation() {
    setLocating(true);
    try {
      const loc = await requestLocation();
      onChange({ lat: loc.lat, lng: loc.lng });
    } catch (err) {
      onError?.(err.message);
    } finally {
      setLocating(false);
    }
  }

  return (
    <div className="location-picker">
      <div className="map-frame">
        <BaseMap center={center} zoom={value ? 16 : 15}>
          <ClickHandler onClick={(ll) => onChange({ lat: ll.lat, lng: ll.lng })} />
          {point && (
            <Marker
              position={point}
              icon={icons.home}
              draggable
              eventHandlers={{ dragend: (e) => {
                const ll = e.target.getLatLng();
                onChange({ lat: ll.lat, lng: ll.lng });
              } }}
            />
          )}
          <FlyTo position={point || fallbackCenter} />
        </BaseMap>
        {!point && <div className="map-hint"><MapPin size={16} /> Ketuk peta untuk menandai lokasi</div>}
      </div>
      <div className="location-info">
        <button type="button" className="btn btn-light btn-sm" onClick={useMyLocation} disabled={locating}>
          {locating ? <LoaderCircle size={16} className="spin" /> : <Crosshair size={16} />} Pakai lokasi saya
        </button>
        <span className={km != null ? "distance-result" : "muted small"}>
          {km != null ? `${km.toLocaleString("id-ID", { maximumFractionDigits: 1 })} km ke ${CAMPUS.name}` : "Jarak dihitung otomatis"}
        </span>
      </div>
    </div>
  );
}
