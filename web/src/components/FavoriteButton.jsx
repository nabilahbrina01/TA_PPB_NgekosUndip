import { Heart } from "lucide-react";
import { useFavorites } from "../context/FavoriteContext";

export function FavoriteButton({ type, id }) {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(type, id);
  return (
    <button
      className={"fav-btn" + (active ? " active" : "")}
      aria-label={active ? "Hapus dari favorit" : "Simpan ke favorit"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(type, id);
      }}
    >
      <Heart size={20} fill={active ? "currentColor" : "none"} />
    </button>
  );
}
