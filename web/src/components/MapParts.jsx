import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { CAMPUS } from "../utils/geo";

// Peta dari OpenStreetMap (gratis, tanpa API key)
const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

// Penanda (marker) berbentuk HTML, jadi tidak butuh file gambar
export const icons = {
  campus: L.divIcon({ className: "", html: '<div class="pin pin-campus">UNDIP</div>', iconSize: [56, 28], iconAnchor: [28, 14] }),
  me: L.divIcon({ className: "", html: '<div class="pin pin-me"></div>', iconSize: [22, 22], iconAnchor: [11, 11] }),
  home: L.divIcon({ className: "", html: '<div class="pin pin-home"></div>', iconSize: [34, 34], iconAnchor: [17, 34] }),
  price: (label, active) =>
    L.divIcon({ className: "", html: `<div class="pin-price${active ? " active" : ""}">${label}</div>`, iconSize: [80, 30], iconAnchor: [40, 30] }),
};

export function BaseMap({ center, zoom = 15, className = "", children }) {
  return (
    <MapContainer center={center} zoom={zoom} className={`map ${className}`} scrollWheelZoom={false} attributionControl>
      <TileLayer url={TILE_URL} attribution={ATTRIBUTION} />
      <Marker position={[CAMPUS.lat, CAMPUS.lng]} icon={icons.campus}>
        <Popup>{CAMPUS.name}</Popup>
      </Marker>
      {children}
    </MapContainer>
  );
}

/** Pindahkan tampilan peta saat titik berubah. */
export function FlyTo({ position, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, zoom ?? map.getZoom(), { duration: 0.6 });
  }, [map, position?.[0], position?.[1]]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/** Atur tampilan peta agar semua titik terlihat. */
export function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) map.fitBounds(points, { padding: [40, 40], maxZoom: 16 });
  }, [map, JSON.stringify(points)]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/** Tangkap ketukan di peta. */
export function ClickHandler({ onClick }) {
  useMapEvents({ click: (e) => onClick(e.latlng) });
  return null;
}
