// Titik acuan kampus: Universitas Diponegoro, Tembalang (gedung Widya Puraya)
export const CAMPUS = { lat: -7.0507, lng: 110.4387 };

// Jarak garis lurus dua titik di bumi (rumus Haversine), dalam km
export function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Jika latitude & longitude dikirim, hitung otomatis distance_km
 * (jarak ke kampus, 1 angka di belakang koma).
 */
export function withCampusDistance(payload) {
  const lat = Number(payload.latitude);
  const lng = Number(payload.longitude);
  if (payload.latitude == null || payload.longitude == null || Number.isNaN(lat) || Number.isNaN(lng)) {
    return payload;
  }
  const km = distanceKm(lat, lng, CAMPUS.lat, CAMPUS.lng);
  return { ...payload, latitude: lat, longitude: lng, distance_km: Math.round(km * 10) / 10 };
}
