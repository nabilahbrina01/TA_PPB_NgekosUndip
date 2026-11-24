import { createContext, useCallback, useContext, useState } from "react";

const LocationContext = createContext(null);

/**
 * Lokasi pengguna dari GPS HP (Geolocation API).
 * Hanya diminta saat pengguna menekan tombol "Lokasi saya".
 */
export function LocationProvider({ children }) {
  // Lokasi terakhir disimpan selama tab browser terbuka (sessionStorage)
  const [location, setLocation] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("ngekos_location"));
    } catch {
      return null;
    }
  }); // { lat, lng }
  const [status, setStatus] = useState(location ? "ready" : "idle"); // idle | loading | ready | denied | error

  const requestLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setStatus("error");
      return Promise.reject(new Error("Perangkat tidak mendukung lokasi"));
    }
    setStatus("loading");
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocation(loc);
          sessionStorage.setItem("ngekos_location", JSON.stringify(loc));
          setStatus("ready");
          resolve(loc);
        },
        (err) => {
          setStatus(err.code === 1 ? "denied" : "error");
          reject(new Error(err.code === 1 ? "Izin lokasi ditolak. Aktifkan di pengaturan browser." : "Lokasi tidak dapat ditemukan"));
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
      );
    });
  }, []);

  return (
    <LocationContext.Provider value={{ location, status, requestLocation }}>{children}</LocationContext.Provider>
  );
}

export function useUserLocation() {
  return useContext(LocationContext);
}
