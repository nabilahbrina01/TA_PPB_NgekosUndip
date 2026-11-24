// 950000 -> "Rp950.000"
export function formatRupiah(value) {
  return "Rp" + Number(value || 0).toLocaleString("id-ID");
}

// 1.5 -> "1,5 km"
export function formatDistance(km) {
  if (km === null || km === undefined) return "-";
  return `${Number(km).toLocaleString("id-ID", { maximumFractionDigits: 1 })} km`;
}

export function capitalize(text) {
  if (!text) return "";
  return text[0].toUpperCase() + text.slice(1);
}

// 08xx -> 628xx (format nomor untuk wa.me)
export function toWhatsAppNumber(phone) {
  let number = (phone || "").replace(/[^0-9]/g, "");
  if (number.startsWith("0")) number = "62" + number.slice(1);
  if (number.startsWith("8")) number = "62" + number;
  return number;
}

export function whatsappLink(phone, message) {
  return `https://wa.me/${toWhatsAppNumber(phone)}?text=${encodeURIComponent(message)}`;
}

export function mapsLink(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export const TYPE_COLORS = {
  putra: "#2563EB",
  putri: "#DB2777",
  campur: "#7C3AED",
};
