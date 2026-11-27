import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarX2, Clock, Info, TriangleAlert, X } from "lucide-react";
import { Loading, ErrorView } from "./StateViews";
import { useToast } from "../context/ToastContext";
import { useAsync } from "../hooks/useAsync";
import meetingService from "../services/meetingService";
import scheduleService from "../services/scheduleService";
import { dateParts, formatDate, formatRange, groupByDate } from "../utils/schedule";

// Pesan untuk respons 409 Conflict dari API
const CONFLICT_MESSAGES = {
  SLOT_BOOKED: "Maaf, jadwal tersebut sudah dipesan oleh pencari kos lain. Silakan pilih jadwal yang berbeda.",
  ALREADY_REQUESTED: "Kamu sudah mengajukan jadwal ini. Lihat statusnya di menu Jadwal Kunjungan.",
  SEEKER_BUSY: "Kamu sudah punya pertemuan lain yang dikonfirmasi pada waktu tersebut. Silakan pilih jadwal lain.",
};

/** Keterangan singkat di bawah jam pada setiap pilihan jadwal */
function slotCaption(slot) {
  if (slot.my_status === "menunggu") return "Sudah kamu ajukan";
  if (slot.my_status === "diterima") return "Jadwalmu";
  if (slot.state === "dipesan") return "Sudah dipesan";
  if (slot.pending_count > 0) return `${slot.pending_count} pengajuan lain`;
  return "Tersedia";
}

/**
 * Lembar (bottom sheet) untuk pencari kos memilih jadwal kunjungan
 * dari jadwal kosong yang disediakan pemilik.
 */
export function SchedulePicker({ open, onClose, item, itemType }) {
  const toast = useToast();
  const { data: slots, loading, error, reload } = useAsync(
    () => (open ? scheduleService.getByOwner(item.owner_id) : Promise.resolve([])),
    [open, item.owner_id],
  );
  const [date, setDate] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sentInfo, setSentInfo] = useState(null);

  const groups = useMemo(() => groupByDate(slots || []), [slots]);
  const activeDate = date && groups.some((g) => g.date === date) ? date : groups[0]?.date;
  const daySlots = groups.find((g) => g.date === activeDate)?.items || [];
  const selected = (slots || []).find((s) => s.id === selectedId);

  // Reset pilihan setiap kali lembar dibuka
  useEffect(() => {
    if (open) {
      setSelectedId(null);
      setMessage("");
      setSentInfo(null);
    }
  }, [open]);

  if (!open) return null;

  const selectable = (s) => s.state !== "dipesan" && !s.my_status;

  async function submit() {
    if (!selected) return;
    setSending(true);
    try {
      // POST /api/meetings
      const res = await meetingService.request({
        slot_id: selected.id,
        item_type: itemType,
        item_id: item.id,
        message,
      });
      toast("Pengajuan jadwal terkirim", "success");
      setSentInfo({ slot: selected, othersPending: res.others_pending || 0 });
      reload();
    } catch (err) {
      if (err.status === 409) {
        // Jadwal bentrok: tampilkan pesan yang mudah dipahami, lalu muat ulang jadwal
        toast(CONFLICT_MESSAGES[err.raw?.code] || err.message, "error");
        setSelectedId(null);
        reload();
      } else {
        toast(err.message, "error");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet schedule-sheet" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="sheet-handle" />
        <div className="sheet-head">
          <h3>Ajukan Jadwal Kunjungan</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Tutup"><X size={20} /></button>
        </div>
        <p className="sheet-sub">Pilih jadwal kosong dari pemilik {item.name}</p>

        {loading && <Loading text="Memuat jadwal..." />}
        {error && <ErrorView error={error} onRetry={reload} />}

        {sentInfo && (
          <div className="sched-done">
            <p>
              Pengajuan untuk <b>{formatDate(sentInfo.slot.slot_date)}, {formatRange(sentInfo.slot)}</b> sudah dikirim.
              Tunggu konfirmasi dari pemilik.
            </p>
            {sentInfo.othersPending > 0 && (
              <div className="sched-warn">
                <TriangleAlert size={16} />
                <span>
                  Ada {sentInfo.othersPending} pencari lain yang mengajukan jam yang sama. Pemilik hanya bisa menerima
                  satu, jadi siapkan jadwal cadangan.
                </span>
              </div>
            )}
            <div className="sched-actions">
              <Link to="/jadwal" className="btn btn-primary">Lihat Jadwal Saya</Link>
              <button className="btn btn-light" onClick={() => setSentInfo(null)}>Pilih jadwal lain</button>
            </div>
          </div>
        )}

        {!sentInfo && slots && slots.length === 0 && (
          <div className="sched-empty">
            <CalendarX2 size={36} />
            <strong>Belum ada jadwal kosong</strong>
            <p>Pemilik belum menyediakan jadwal kunjungan. Hubungi pemilik lewat WhatsApp.</p>
          </div>
        )}

        {!sentInfo && slots && slots.length > 0 && (
          <>
            <span className="field-label">Tanggal</span>
            <div className="date-strip">
              {groups.map((g) => {
                const p = dateParts(g.date);
                return (
                  <button key={g.date} type="button"
                    className={"date-chip" + (g.date === activeDate ? " active" : "")}
                    onClick={() => { setDate(g.date); setSelectedId(null); }}>
                    <small>{p.day}</small>
                    <strong>{p.num}</strong>
                    <small>{p.month}</small>
                  </button>
                );
              })}
            </div>

            <span className="field-label">Jam</span>
            <div className="slot-grid">
              {daySlots.map((s) => (
                <button key={s.id} type="button" disabled={!selectable(s)}
                  className={[
                    "slot-chip",
                    s.state === "dipesan" && !s.my_status ? "booked" : "",
                    s.my_status ? "mine" : "",
                    s.pending_count > 0 && selectable(s) ? "busy" : "",
                    s.id === selectedId ? "active" : "",
                  ].join(" ")}
                  onClick={() => setSelectedId(s.id)}>
                  <strong><Clock size={14} /> {formatRange(s)}</strong>
                  <small>{slotCaption(s)}</small>
                </button>
              ))}
            </div>

            <div className="slot-legend">
              <span><i className="dot free" /> Tersedia</span>
              <span><i className="dot busy" /> Ada pengajuan</span>
              <span><i className="dot booked" /> Sudah dipesan</span>
            </div>

            {selected && (
              <>
                {selected.pending_count > 0 ? (
                  <div className="sched-warn">
                    <TriangleAlert size={16} />
                    <span>
                      Jadwal ini sudah diajukan oleh {selected.pending_count} pencari lain dan sedang menunggu persetujuan.
                      Kamu tetap bisa mengajukan, tetapi pemilik hanya bisa menerima satu. Pertimbangkan jadwal lain.
                    </span>
                  </div>
                ) : (
                  <div className="form-note">
                    <Info size={16} />
                    <div>Jadwal masih kosong. Pemilik akan mengonfirmasi pengajuanmu.</div>
                  </div>
                )}
                {selected.note && <p className="field-hint">Catatan pemilik: {selected.note}</p>}

                <label className="field">
                  <span className="field-label">Pesan untuk pemilik (opsional)</span>
                  <textarea className="textarea" rows={2} maxLength={300}
                    placeholder="Contoh: Saya ingin melihat kamar"
                    value={message} onChange={(e) => setMessage(e.target.value)} />
                </label>
              </>
            )}

            <button className="btn btn-primary btn-block" disabled={!selected || sending} onClick={submit}>
              {sending ? "Mengirim..." : selected ? `Ajukan ${formatDate(selected.slot_date)}, ${formatRange(selected)}` : "Pilih jam terlebih dahulu"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
