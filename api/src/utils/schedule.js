// Fungsi bantu tanggal & jam untuk fitur jadwal kunjungan.
// Semua waktu memakai zona Waktu Indonesia Barat (WIB, UTC+7).

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Tanggal & jam sekarang di WIB, contoh { date: "2026-11-28", time: "09:30:00" } */
export function nowWIB() {
  const iso = new Date(Date.now() + WIB_OFFSET_MS).toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 19) };
}

/** "9:00", "09:00", atau "09:00:00" -> "09:00:00". Format salah -> null */
export function normTime(value) {
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(String(value || "").trim());
  if (!m) return null;
  const [h, min, sec = "00"] = [Number(m[1]), m[2], m[3]];
  if (h > 23 || Number(min) > 59 || Number(sec) > 59) return null;
  return `${String(h).padStart(2, "0")}:${min}:${sec}`;
}

/** Cek format tanggal YYYY-MM-DD dan tanggalnya benar-benar ada */
export function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** Dua rentang jam pada tanggal yang sama saling tumpang tindih? */
export function overlaps(a, b) {
  return (
    a.slot_date === b.slot_date &&
    a.start_time < b.end_time &&
    a.end_time > b.start_time
  );
}

/** Jadwal sudah lewat (tanggal kemarin, atau hari ini tapi jamnya sudah lewat)? */
export function isPast(slot, now = nowWIB()) {
  return slot.slot_date < now.date || (slot.slot_date === now.date && slot.start_time <= now.time);
}

/** "09:00:00" -> "09.00" (untuk pesan ke pengguna) */
export function shortTime(time) {
  return String(time).slice(0, 5).replace(":", ".");
}
