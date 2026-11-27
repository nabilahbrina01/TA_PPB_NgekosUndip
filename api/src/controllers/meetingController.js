import { ScheduleModel } from "../models/scheduleModel.js";
import { MeetingModel } from "../models/meetingModel.js";
import { UserModel } from "../models/userModel.js";
import { KosModel } from "../models/kosModel.js";
import { KontrakanModel } from "../models/kontrakanModel.js";
import { isPast, overlaps } from "../utils/schedule.js";

// Pesan bentrok yang ditampilkan ke pencari kos
export const MSG_SLOT_BOOKED =
  "Maaf, jadwal tersebut sudah dipesan oleh pencari kos lain. Silakan pilih jadwal yang berbeda.";

const AUTO_REJECT_NOTE = "Jadwal ini sudah dipesan oleh pencari kos lain";

async function findItem(type, id) {
  try {
    if (type === "kos") return await KosModel.getById(id);
    if (type === "kontrakan") return await KontrakanModel.getById(id);
  } catch {
    // id tidak ditemukan / format salah
  }
  return null;
}

/**
 * Lengkapi daftar pengajuan dengan data jadwal dan nama/nomor pihak lain.
 * Nomor HP hanya dibagikan jika pertemuan sudah DITERIMA.
 * `counterpart`: "owner" (untuk pencari) atau "seeker" (untuk pemilik).
 */
async function enrich(meetings, counterpart) {
  const slots = await ScheduleModel.getByIds([...new Set(meetings.map((m) => m.slot_id))]);
  const userIds = [...new Set(meetings.map((m) => (counterpart === "owner" ? m.owner_id : m.seeker_id)))];
  const users = await UserModel.findManyByIds(userIds);
  // Jumlah pengajuan aktif lain di jadwal yang sama (informasi bentrok)
  const active = await MeetingModel.getActiveBySlots(slots.map((s) => s.id));

  return meetings
    .map((m) => {
      const slot = slots.find((s) => s.id === m.slot_id);
      const person = users.find((u) => u.id === (counterpart === "owner" ? m.owner_id : m.seeker_id));
      const others = active.filter((a) => a.slot_id === m.slot_id && a.id !== m.id);
      return {
        ...m,
        slot: slot
          ? { slot_date: slot.slot_date, start_time: slot.start_time, end_time: slot.end_time, note: slot.note }
          : null,
        [counterpart]: person
          ? { name: person.name, phone: m.status === "diterima" ? person.phone : null }
          : null,
        competing_count: others.filter((o) => o.status === "menunggu").length,
        slot_booked: others.some((o) => o.status === "diterima"),
      };
    })
    .filter((m) => m.slot);
}

export const MeetingController = {
  // POST /api/meetings  (khusus pencari)
  // body: { slot_id, item_type: "kos" | "kontrakan", item_id, message }
  async create(req, res) {
    try {
      const { slot_id, item_type, item_id } = req.body;
      const message = String(req.body.message || "").trim().slice(0, 300) || null;

      const slot = slot_id ? await ScheduleModel.getById(slot_id) : null;
      if (!slot) return res.status(404).json({ error: "Jadwal tidak ditemukan" });
      if (isPast(slot)) {
        return res.status(400).json({ error: "Jadwal ini sudah lewat, silakan pilih jadwal lain" });
      }

      const item = await findItem(item_type, item_id);
      if (!item) return res.status(404).json({ error: "Kos/kontrakan tidak ditemukan" });
      if (item.owner_id !== slot.owner_id) {
        return res.status(400).json({ error: "Jadwal ini bukan milik pemilik iklan tersebut" });
      }

      // --- Deteksi bentrok ---------------------------------------------------
      const active = await MeetingModel.getActiveBySlots([slot.id]);

      // 1) Jadwal sudah dikonfirmasi untuk pencari lain -> 409 Conflict
      if (active.some((m) => m.status === "diterima" && m.seeker_id !== req.user.id)) {
        return res.status(409).json({ error: MSG_SLOT_BOOKED, code: "SLOT_BOOKED" });
      }
      // 2) Pencari ini sudah mengajukan jadwal yang sama
      if (active.some((m) => m.seeker_id === req.user.id)) {
        return res.status(409).json({
          error: "Kamu sudah mengajukan jadwal ini. Lihat statusnya di menu Jadwal Kunjungan.",
          code: "ALREADY_REQUESTED",
        });
      }
      // 3) Pencari ini sudah punya pertemuan lain yang DITERIMA di jam yang sama
      const myAccepted = await MeetingModel.getAcceptedBySeeker(req.user.id);
      const mySlots = await ScheduleModel.getByIds(myAccepted.map((m) => m.slot_id));
      if (mySlots.some((s) => overlaps(s, slot))) {
        return res.status(409).json({
          error: "Kamu sudah punya pertemuan lain yang dikonfirmasi pada waktu tersebut. Silakan pilih jadwal lain.",
          code: "SEEKER_BUSY",
        });
      }

      const meeting = await MeetingModel.create({
        slot_id: slot.id,
        seeker_id: req.user.id,
        owner_id: slot.owner_id,
        item_type,
        item_id,
        item_name: item.name,
        message,
        status: "menunggu",
      });

      // Informasi: berapa pencari lain yang juga sedang mengajukan jadwal ini
      const othersPending = active.filter((m) => m.status === "menunggu").length;
      res.status(201).json({ ...meeting, others_pending: othersPending });
    } catch (err) {
      if (err.code === "23505") {
        // Pengaman di database (unique index) jika ada dua permintaan bersamaan
        return res.status(409).json({ error: MSG_SLOT_BOOKED, code: "SLOT_BOOKED" });
      }
      res.status(400).json({ error: err.message });
    }
  },

  // GET /api/meetings/mine  -> pengajuan yang saya buat (pencari)
  async getMine(req, res) {
    try {
      const meetings = await MeetingModel.getBySeeker(req.user.id);
      res.json(await enrich(meetings, "owner"));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // GET /api/meetings/incoming  -> pengajuan yang masuk ke saya (pemilik)
  async getIncoming(req, res) {
    try {
      const meetings = await MeetingModel.getByOwner(req.user.id);
      res.json(await enrich(meetings, "seeker"));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // PATCH /api/meetings/:id/status  (khusus pemilik)
  // body: { status: "diterima" | "ditolak", owner_note }
  async setStatus(req, res) {
    try {
      const { status } = req.body;
      const ownerNote = String(req.body.owner_note || "").trim().slice(0, 300) || null;
      if (!["diterima", "ditolak"].includes(status)) {
        return res.status(400).json({ error: "Status harus 'diterima' atau 'ditolak'" });
      }

      const meeting = await MeetingModel.getById(req.params.id);
      if (!meeting) return res.status(404).json({ error: "Pengajuan tidak ditemukan" });
      if (meeting.owner_id !== req.user.id) {
        return res.status(403).json({ error: "Kamu hanya bisa menanggapi pengajuan untuk jadwalmu sendiri" });
      }

      if (status === "ditolak") {
        // Bisa menolak pengajuan yang menunggu, atau membatalkan yang sudah diterima
        const updated = await MeetingModel.updateStatus(meeting.id, ["menunggu", "diterima"], {
          status: "ditolak",
          owner_note: ownerNote,
        });
        if (!updated) return res.status(409).json({ error: "Pengajuan ini sudah tidak aktif", code: "NOT_ACTIVE" });
        return res.json(updated);
      }

      // --- Terima (ACC) -------------------------------------------------------
      if (meeting.status !== "menunggu") {
        return res.status(409).json({ error: "Pengajuan ini sudah tidak menunggu persetujuan", code: "NOT_PENDING" });
      }
      const slot = await ScheduleModel.getById(meeting.slot_id);
      if (!slot || isPast(slot)) {
        return res.status(400).json({ error: "Jadwal ini sudah lewat" });
      }

      // Jadwal yang sama sudah diterima untuk pencari lain -> 409
      const active = await MeetingModel.getActiveBySlots([slot.id]);
      if (active.some((m) => m.status === "diterima")) {
        return res.status(409).json({
          error: "Jadwal ini sudah kamu terima untuk pencari kos lain",
          code: "SLOT_BOOKED",
        });
      }
      // Pencari ini sudah punya pertemuan lain yang diterima di jam yang sama -> 409
      const seekerAccepted = await MeetingModel.getAcceptedBySeeker(meeting.seeker_id);
      const seekerSlots = await ScheduleModel.getByIds(seekerAccepted.map((m) => m.slot_id));
      if (seekerSlots.some((s) => overlaps(s, slot))) {
        return res.status(409).json({
          error: "Pencari ini sudah punya pertemuan lain yang dikonfirmasi pada waktu yang sama",
          code: "SEEKER_BUSY",
        });
      }

      const updated = await MeetingModel.updateStatus(meeting.id, ["menunggu"], {
        status: "diterima",
        owner_note: ownerNote,
      });
      if (!updated) return res.status(409).json({ error: "Pengajuan ini sudah tidak menunggu persetujuan", code: "NOT_PENDING" });

      // Pengajuan lain di jadwal yang sama otomatis ditolak
      const rejected = await MeetingModel.rejectOtherPending(slot.id, meeting.id, AUTO_REJECT_NOTE);
      res.json({ ...updated, auto_rejected: rejected.length });
    } catch (err) {
      if (err.code === "23505") {
        return res.status(409).json({ error: "Jadwal ini sudah kamu terima untuk pencari kos lain", code: "SLOT_BOOKED" });
      }
      res.status(400).json({ error: err.message });
    }
  },

  // PATCH /api/meetings/:id/cancel  (pencari membatalkan pengajuannya sendiri)
  async cancel(req, res) {
    try {
      const meeting = await MeetingModel.getById(req.params.id);
      if (!meeting) return res.status(404).json({ error: "Pengajuan tidak ditemukan" });
      if (meeting.seeker_id !== req.user.id) {
        return res.status(403).json({ error: "Kamu hanya bisa membatalkan pengajuanmu sendiri" });
      }
      const updated = await MeetingModel.updateStatus(meeting.id, ["menunggu", "diterima"], {
        status: "dibatalkan",
      });
      if (!updated) return res.status(409).json({ error: "Pengajuan ini sudah tidak aktif", code: "NOT_ACTIVE" });
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
};
