import { useState } from "react";
import { Link } from "react-router-dom";
import { Marker } from "react-leaflet";
import { CAMPUS, hasCoords } from "../utils/geo";
import { ImageBox } from "./ImageBox";
import { BaseMap, FitBounds, icons } from "./MapParts";

const shortPrice = (n) => (n >= 1e6 ? `${(n / 1e6).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt` : `${Math.round(n / 1000)} rb`);

/** Peta semua kos/kontrakan hasil filter, dengan label harga. */
export function ListingMap({ items, type, priceOf, priceSuffix, userLocation }) {
  const [active, setActive] = useState(null);
  const withCoords = items.filter(hasCoords);
  const points = withCoords.map((i) => [i.latitude, i.longitude]);
  if (userLocation) points.push([userLocation.lat, userLocation.lng]);
  const selected = withCoords.find((i) => i.id === active);

  return (
    <div className="listing-map">
      <BaseMap center={[CAMPUS.lat, CAMPUS.lng]} zoom={14} className="map-full">
        {withCoords.map((item) => (
          <Marker key={item.id} position={[item.latitude, item.longitude]}
            icon={icons.price(shortPrice(priceOf(item)), item.id === active)}
            eventHandlers={{ click: () => setActive(item.id) }} />
        ))}
        {userLocation && <Marker position={[userLocation.lat, userLocation.lng]} icon={icons.me} />}
        <FitBounds points={points.length ? points : [[CAMPUS.lat, CAMPUS.lng]]} />
      </BaseMap>
      {withCoords.length < items.length && (
        <p className="map-note">{items.length - withCoords.length} iklan belum punya titik lokasi</p>
      )}
      {selected && (
        <Link to={`/${type}/${selected.id}`} className="map-card">
          <ImageBox src={selected.image_url} alt={selected.name} />
          <div>
            <strong>{selected.name}</strong>
            <span className="muted small">{selected.area?.name}</span>
            <span className="price">{`Rp${priceOf(selected).toLocaleString("id-ID")}`}<small>{priceSuffix}</small></span>
          </div>
        </Link>
      )}
    </div>
  );
}
