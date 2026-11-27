// Format tanggal & jam untuk fitur jadwal kunjungan

/** "2026-11-28" -> "Sab, 28 Nov 2026" */
export function formatDate(date, { long = false } = {}) {
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString("id-ID", {
    weekday: long ? "long" : "short",
    day: "numeric",
    month: long ? "long" : "short",
    year: "numeric",
  });
}

/** "2026-11-28" -> { day: "Sab", num: "28", month: "Nov" } untuk chip tanggal */
export function dateParts(date) {
  const d = new Date(`${date}T00:00:00`);
  return {
    day: d.toLocaleDateString("id-ID", { weekday: "short" }),
    num: String(d.getDate()),
    month: d.toLocaleDateString("id-ID", { month: "short" }),
  };
}

/** "09:00:00" -> "09.00" */
export function formatTime(time) {
  return String(time || "").slice(0, 5).replace(":", ".");
}

export function formatRange(slot) {
  return `${formatTime(slot.start_time)}–${formatTime(slot.end_time)}`;
}

/** Tanggal hari ini (zona perangkat) dalam format YYYY-MM-DD, untuk input tanggal */
export function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

/** Kelompokkan daftar berdasarkan tanggal: [{ date, items: [...] }] */
export function groupByDate(list, getDate = (x) => x.slot_date) {
  const map = new Map();
  for (const item of list) {
    const key = getDate(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return [...map.entries()].map(([date, items]) => ({ date, items }));
}

// Label & warna status pengajuan
export const MEETING_STATUS = {
  menunggu: { label: "Menunggu", tone: "amber" },
  diterima: { label: "Diterima", tone: "green" },
  ditolak: { label: "Ditolak", tone: "red" },
  dibatalkan: { label: "Dibatalkan", tone: "grey" },
};
