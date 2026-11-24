import { createContext, useCallback, useContext, useEffect, useState } from "react";
import favoriteService from "../services/favoriteService";
import { useAuth } from "./AuthContext";

const FavoriteContext = createContext(null);

/**
 * Favorit disimpan di database lewat API (/api/favorites),
 * jadi setiap akun punya daftar favoritnya sendiri.
 * Kunci di aplikasi: "kos:<id>" atau "kontrakan:<id>".
 */
export function FavoriteProvider({ children }) {
  const { token } = useAuth();
  const [keys, setKeys] = useState(new Set());

  // Ambil favorit setiap kali akun berganti (login / logout)
  useEffect(() => {
    if (!token) {
      setKeys(new Set());
      return;
    }
    favoriteService
      .getAll()
      .then((list) =>
        setKeys(new Set(list.map((f) => `${f.item_type}:${f.item_id}`))),
      )
      .catch(() => {});
  }, [token]);

  const isFavorite = useCallback(
    (type, id) => keys.has(`${type}:${id}`),
    [keys],
  );

  // POST /api/favorites atau DELETE /api/favorites/:type/:id
  const toggle = useCallback(
    async (type, id) => {
      const key = `${type}:${id}`;
      const wasFavorite = keys.has(key);
      const update = (add) =>
        setKeys((prev) => {
          const next = new Set(prev);
          add ? next.add(key) : next.delete(key);
          return next;
        });

      update(!wasFavorite); // ubah tampilan dulu agar terasa cepat
      try {
        if (wasFavorite) await favoriteService.remove(type, id);
        else await favoriteService.add(type, id);
      } catch {
        update(wasFavorite); // gagal: kembalikan seperti semula
      }
    },
    [keys],
  );

  return (
    <FavoriteContext.Provider value={{ isFavorite, toggle, keys }}>
      {children}
    </FavoriteContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoriteContext);
}
