import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CalendarClock, CalendarDays, CalendarPlus, Clock, Home, MessageCircle, StickyNote, Trash2, TriangleAlert, UserRound,
} from "lucide-react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Field } from "../components/FormFields";
import { PageHeader } from "../components/PageHeader";
import { EmptyView, ErrorView, Loading } from "../components/StateViews";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useAsync } from "../hooks/useAsync";
import meetingService from "../services/meetingService";
import scheduleService from "../services/scheduleService";
import { whatsappLink } from "../utils/format";
import { MEETING_STATUS, formatDate, formatRange, groupByDate, todayISO } from "../utils/schedule";

// ---------------------------------------------------------------------------
// Bagian kecil yang dipakai bersama
// ---------------------------------------------------------------------------
function StatusPill({ status }) {
  const s = MEETING_STATUS[status] || MEETING_STATUS.menunggu;
  return <span className={`status-pill ${s.tone}`}>{s.label}</span>;
}

function WhenLine({ slot }) {
  return (
    <p className="meet-when">
      <CalendarDays size={15} /> {formatDate(slot.slot_date)}
      <Clock size={15} /> {formatRange(slot)}
    </p>
  );
}

/** Jadwal sudah lewat? (dibandingkan dengan tanggal & jam di perangkat) */
function isPastSlot(slot) {
  const today = todayISO();
  if (slot.slot_date !== today) return slot.slot_date < today;
  const now = new Date().toTimeString().slice(0, 8);
  return slot.start_time <= now;
}

const bySlotTime = (a, b) =>
  (a.slot.slot_date + a.slot.start_time).localeCompare(b.slot.slot_date + b.slot.start_time);

// ---------------------------------------------------------------------------
// Pencari kos: daftar pengajuan saya
// ---------------------------------------------------------------------------
function SeekerView() {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => meetingService.getMine(), []);
  const [toCancel, setToCancel] = useState(null);

  if (loading) return <Loading />;
  if (error) return <ErrorView error={error} onRetry={reload} />;

  const active = data.filter((m) => ["menunggu", "diterima"].includes(m.status) && !isPastSlot(m.slot)).sort(bySlotTime);
  const history = data.filter((m) => !active.includes(m));

  async function cancel() {
    const m = toCancel;
    setToCancel(null);
    try {
      await meetingService.cancel(m.id); // PATCH /api/meetings/:id/cancel
      toast("Pengajuan dibatalkan", "success");
      reload();
    } catch (err) {
      toast(err.message, "error");
    }
  }

  if (data.length === 0) {
    return (
      <div className="page-pad">
        <EmptyView icon={CalendarClock} title="Belum ada pengajuan"
          text="Buka halaman detail kos atau kontrakan, lalu tekan Pilih jadwal." />
        <Link to="/kos" className="btn btn-primary btn-block">Cari kos</Link>
      </div>
    );
  }

  return (
    <div className="page-pad">
      <h2 className="section-title first">Jadwal mendatang</h2>
      {active.length === 0 && <p className="muted">Tidak ada jadwal aktif.</p>}
      <div className="meet-list">
        {active.map((m) => (
          <div className="meet-card" key={m.id}>
            <div className="meet-top">
              <Link to={`/${m.item_type}/${m.item_id}`} className="meet-title"><Home size={16} /> {m.item_name}</Link>
              <StatusPill status={m.status} />
            </div>
            <WhenLine slot={m.slot} />
            {m.status === "menunggu" && (
              m.competing_count > 0 ? (
                <div className="sched-warn">
                  <TriangleAlert size={16} />
                  <span>Ada {m.competing_count} pengajuan lain di jam ini. Pemilik hanya bisa menerima satu.</span>
                </div>
              ) : (
                <p className="field-hint">Menunggu konfirmasi pemilik.</p>
              )
            )}
            {m.owner_note && <p className="meet-note"><StickyNote size={14} /> {m.owner_note}</p>}
            <div className="meet-actions">
              {m.status === "diterima" && m.owner?.phone && (
                <a className="btn btn-primary btn-sm" target="_blank" rel="noreferrer"
                  href={whatsappLink(m.owner.phone, `Halo, saya akan berkunjung ke "${m.item_name}" pada ${formatDate(m.slot.slot_date)} pukul ${formatRange(m.slot)}.`)}>
                  <MessageCircle size={16} /> Chat pemilik
                </a>
              )}
              <button className="btn btn-text btn-sm danger-text" onClick={() => setToCancel(m)}>Batalkan</button>
            </div>
          </div>
        ))}
      </div>

      {history.length > 0 && (
        <>
          <h2 className="section-title">Riwayat</h2>
          <div className="meet-list">
            {history.map((m) => (
              <div className="meet-card compact" key={m.id}>
                <div className="meet-top">
                  <span className="meet-title muted-title">{m.item_name}</span>
                  <StatusPill status={m.status} />
                </div>
                <WhenLine slot={m.slot} />
                {m.owner_note && <p className="meet-note"><StickyNote size={14} /> {m.owner_note}</p>}
              </div>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog open={!!toCancel} title="Batalkan pengajuan?"
        message="Jadwal ini akan dilepas dan bisa dipilih pencari lain." confirmText="Batalkan" danger
        onConfirm={cancel} onCancel={() => setToCancel(null)} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pemilik kos: pengajuan masuk
// ---------------------------------------------------------------------------
function OwnerRequests({ data, reload }) {
  const toast = useToast();
  const [busyId, setBusyId] = useState(null);
  const [toReject, setToReject] = useState(null);

  const upcoming = data.filter((m) => !isPastSlot(m.slot));
  const pending = upcoming.filter((m) => m.status === "menunggu").sort(bySlotTime);
  const accepted = upcoming.filter((m) => m.status === "diterima").sort(bySlotTime);
  const history = data.filter((m) => !pending.includes(m) && !accepted.includes(m)).reverse().slice(0, 15);

  // Kelompokkan pengajuan yang menunggu per jadwal (untuk menampilkan bentrok)
  const pendingGroups = groupByDate(pending, (m) => m.slot_id);

  async function accept(m) {
    setBusyId(m.id);
    try {
      const res = await meetingService.setStatus(m.id, "diterima"); // PATCH /api/meetings/:id/status
      toast(res.auto_rejected > 0 ? `Diterima, ${res.auto_rejected} pengajuan lain otomatis ditolak` : "Pengajuan diterima", "success");
    } catch (err) {
      toast(err.message, "error"); // 409 jika jadwal sudah diterima untuk pencari lain
    } finally {
      setBusyId(null);
      reload();
    }
  }

  async function reject() {
    const { meeting, cancel } = toReject;
    setToReject(null);
    try {
      await meetingService.setStatus(meeting.id, "ditolak", cancel ? "Dibatalkan oleh pemilik" : null);
      toast(cancel ? "Pertemuan dibatalkan" : "Pengajuan ditolak", "success");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      reload();
    }
  }

  return (
    <>
      <h2 className="section-title first">Perlu ditanggapi</h2>
      {pending.length === 0 && <p className="muted">Tidak ada pengajuan baru.</p>}
      <div className="meet-list">
        {pendingGroups.map(({ items }) => (
          <div className="meet-card" key={items[0].slot_id}>
            <WhenLine slot={items[0].slot} />
            {(items.length > 1 || items[0].slot_booked) && (
              <div className="sched-warn">
                <TriangleAlert size={16} />
                <span>
                  {items[0].slot_booked
                    ? "Jadwal ini sudah kamu terima untuk pencari lain."
                    : `Bentrok jadwal: ${items.length} pencari mengajukan jam yang sama. Jika satu diterima, yang lain otomatis ditolak.`}
                </span>
              </div>
            )}
            {items.map((m) => (
              <div className="req-row" key={m.id}>
                <div className="req-info">
                  <strong><UserRound size={15} /> {m.seeker?.name || "Pencari kos"}</strong>
                  <small>{m.item_name}</small>
                  {m.message && <p className="meet-note">“{m.message}”</p>}
                </div>
                <div className="req-actions">
                  <button className="btn btn-light btn-sm" disabled={busyId === m.id}
                    onClick={() => setToReject({ meeting: m, cancel: false })}>Tolak</button>
                  <button className="btn btn-primary btn-sm" disabled={busyId === m.id || m.slot_booked}
                    onClick={() => accept(m)}>Terima</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <h2 className="section-title">Terkonfirmasi</h2>
      {accepted.length === 0 && <p className="muted">Belum ada pertemuan yang diterima.</p>}
      <div className="meet-list">
        {accepted.map((m) => (
          <div className="meet-card" key={m.id}>
            <div className="meet-top">
              <span className="meet-title"><UserRound size={16} /> {m.seeker?.name}</span>
              <StatusPill status="diterima" />
            </div>
            <WhenLine slot={m.slot} />
            <p className="field-hint">{m.item_name}</p>
            <div className="meet-actions">
              {m.seeker?.phone && (
                <a className="btn btn-primary btn-sm" target="_blank" rel="noreferrer"
                  href={whatsappLink(m.seeker.phone, `Halo ${m.seeker.name}, jadwal kunjungan ke "${m.item_name}" pada ${formatDate(m.slot.slot_date)} pukul ${formatRange(m.slot)} sudah saya terima.`)}>
                  <MessageCircle size={16} /> Chat pencari
                </a>
              )}
              <button className="btn btn-text btn-sm danger-text" onClick={() => setToReject({ meeting: m, cancel: true })}>
                Batalkan
              </button>
            </div>
          </div>
        ))}
      </div>

      {history.length > 0 && (
        <>
          <h2 className="section-title">Riwayat</h2>
          <div className="meet-list">
            {history.map((m) => (
              <div className="meet-card compact" key={m.id}>
                <div className="meet-top">
                  <span className="meet-title muted-title">{m.seeker?.name} · {m.item_name}</span>
                  <StatusPill status={m.status} />
                </div>
                <WhenLine slot={m.slot} />
              </div>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog open={!!toReject}
        title={toReject?.cancel ? "Batalkan pertemuan?" : "Tolak pengajuan?"}
        message={toReject?.cancel ? "Pencari akan melihat pertemuan ini dibatalkan." : "Pencari akan melihat pengajuannya ditolak."}
        confirmText={toReject?.cancel ? "Batalkan" : "Tolak"} danger
        onConfirm={reject} onCancel={() => setToReject(null)} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Pemilik kos: atur jadwal kosong
// ---------------------------------------------------------------------------
const SLOT_STATE = {
  tersedia: { label: "Tersedia", tone: "green" },
  ada_pengajuan: { label: "Ada pengajuan", tone: "amber" },
  dipesan: { label: "Dipesan", tone: "navy" },
};

function OwnerSlots({ onChanged }) {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => scheduleService.getMine(), []);
  const [form, setForm] = useState({ slot_date: todayISO(), start_time: "", end_time: "", note: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const set = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value });
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  async function add(e) {
    e.preventDefault();
    const next = {};
    if (!form.slot_date) next.slot_date = "Pilih tanggal";
    if (!form.start_time) next.start_time = "Isi jam mulai";
    if (!form.end_time) next.end_time = "Isi jam selesai";
    else if (form.start_time && form.end_time <= form.start_time) next.end_time = "Harus setelah jam mulai";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await scheduleService.create(form); // POST /api/schedules
      toast("Jadwal kosong ditambahkan", "success");
      setForm({ ...form, start_time: "", end_time: "", note: "" });
      reload();
    } catch (err) {
      toast(err.message, "error"); // 409 jika bertabrakan dengan jadwal lain
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    const slot = toDelete;
    setToDelete(null);
    try {
      await scheduleService.remove(slot.id); // DELETE /api/schedules/:id
      toast("Jadwal dihapus", "success");
      reload();
      onChanged();
    } catch (err) {
      toast(err.message, "error");
    }
  }

  return (
    <>
      <form className="info-card slot-form" onSubmit={add} noValidate>
        <h3><CalendarPlus size={18} /> Tambah jadwal kosong</h3>
        <Field label="Tanggal" type="date" min={todayISO()} value={form.slot_date} onChange={set("slot_date")} error={errors.slot_date} />
        <div className="two-col">
          <Field label="Jam mulai" type="time" value={form.start_time} onChange={set("start_time")} error={errors.start_time} />
          <Field label="Jam selesai" type="time" value={form.end_time} onChange={set("end_time")} error={errors.end_time} />
        </div>
        <Field label="Catatan (opsional)" placeholder="Contoh: Temui di depan gerbang" maxLength={120}
          value={form.note} onChange={set("note")} />
        <button className="btn btn-primary btn-block" disabled={saving}>{saving ? "Menyimpan..." : "Tambah jadwal"}</button>
      </form>

      <h2 className="section-title">Jadwal kosong mendatang</h2>
      {loading && <Loading />}
      {error && <ErrorView error={error} onRetry={reload} />}
      {data && data.length === 0 && <p className="muted">Belum ada jadwal. Tambahkan supaya pencari bisa mengajukan kunjungan.</p>}
      {data && groupByDate(data).map(({ date, items }) => (
        <div key={date} className="slot-day">
          <p className="slot-day-title">{formatDate(date, { long: true })}</p>
          {items.map((s) => {
            const st = SLOT_STATE[s.state];
            return (
              <div className="slot-row" key={s.id}>
                <div>
                  <strong><Clock size={15} /> {formatRange(s)}</strong>
                  <small>
                    {s.state === "dipesan" ? `Dipesan oleh ${s.booked_by}` : s.pending_count > 0 ? `${s.pending_count} pengajuan menunggu` : "Belum ada pengajuan"}
                    {s.note ? ` · ${s.note}` : ""}
                  </small>
                </div>
                <span className={`status-pill ${st.tone}`}>{st.label}</span>
                <button className="icon-btn danger" aria-label="Hapus jadwal" onClick={() => setToDelete(s)}>
                  <Trash2 size={17} />
                </button>
              </div>
            );
          })}
        </div>
      ))}

      <ConfirmDialog open={!!toDelete} title="Hapus jadwal?"
        message={toDelete?.pending_count ? "Pengajuan yang masih menunggu di jadwal ini ikut terhapus." : "Jadwal ini tidak bisa dipilih lagi oleh pencari."}
        confirmText="Hapus" danger onConfirm={remove} onCancel={() => setToDelete(null)} />
    </>
  );
}

function OwnerView() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "kosong" ? "kosong" : "pengajuan";
  const incoming = useAsync(() => meetingService.getIncoming(), []);
  const pendingCount = (incoming.data || []).filter((m) => m.status === "menunggu" && !isPastSlot(m.slot)).length;

  return (
    <div className="page-pad">
      <div className="segmented">
        <button className={tab === "pengajuan" ? "active" : ""} onClick={() => setParams({}, { replace: true })}>
          Pengajuan{pendingCount > 0 && <span className="count-dot">{pendingCount}</span>}
        </button>
        <button className={tab === "kosong" ? "active" : ""} onClick={() => setParams({ tab: "kosong" }, { replace: true })}>
          Jadwal Kosong
        </button>
      </div>

      {tab === "pengajuan" ? (
        <>
          {incoming.loading && <Loading />}
          {incoming.error && <ErrorView error={incoming.error} onRetry={incoming.reload} />}
          {incoming.data && <OwnerRequests data={incoming.data} reload={incoming.reload} />}
        </>
      ) : (
        <OwnerSlots onChanged={incoming.reload} />
      )}
    </div>
  );
}

/** Halaman Jadwal Kunjungan: tampilannya berbeda untuk pencari dan pemilik kos. */
export default function Schedule() {
  const { isPemilik } = useAuth();
  return (
    <div>
      <PageHeader title="Jadwal Kunjungan" back />
      {isPemilik ? <OwnerView /> : <SeekerView />}
    </div>
  );
}
