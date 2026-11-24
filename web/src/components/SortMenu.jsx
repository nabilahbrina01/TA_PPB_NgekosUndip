import { ArrowUpDown } from "lucide-react";

export const SORT_OPTIONS = {
  termurah: "Termurah",
  termahal: "Termahal",
  terdekat: "Dekat kampus",
  "dari-saya": "Dekat saya",
};

/** Pilihan urutan. termurah/termahal/terdekat diproses API (?sort=), "dari-saya" di aplikasi. */
export function SortMenu({ value, onChange }) {
  return (
    <label className="sort-menu">
      <ArrowUpDown size={16} color="#F5B301" />
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label="Urutkan">
        {Object.entries(SORT_OPTIONS).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>
    </label>
  );
}
