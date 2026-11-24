// Titik acuan kampus: Universitas Diponegoro, Tembalang (gedung Widya Puraya)
export const CAMPUS = { lat: -7.0507, lng: 110.4387, name: "Undip Tembalang" };

// Jarak garis lurus dua titik (rumus Haversine), dalam km
export function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export const hasCoords = (item) => item?.latitude != null && item?.longitude != null;

// Jarak properti ke lokasi pengguna (null jika salah satu tidak ada)
export function distanceFrom(user, item) {
  if (!user || !hasCoords(item)) return null;
  return distanceKm(user.lat, user.lng, item.latitude, item.longitude);
}
