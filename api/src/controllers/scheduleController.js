import { ScheduleModel } from "../models/scheduleModel.js";
import { MeetingModel } from "../models/meetingModel.js";
import { UserModel } from "../models/userModel.js";
import { isPast, isValidDate, normTime, nowWIB, overlaps, shortTime } from "../utils/schedule.js";

// Status sebuah jadwal kosong dilihat dari pengajuan yang masuk:
//   tersedia      -> belum ada pengajuan
//   ada_pengajuan -> sudah ada pengajuan yang menunggu persetujuan pemilik
//   dipesan       -> sudah ada pengajuan yang diterima (tidak bisa diajukan lagi)
function slotState(activeMeetings) {
  if (activeMeetings.some((m) => m.status === "diterima")) return "dipesan";
  if (activeMeetings.length > 0) return "ada_pengajuan";
  return "tersedia";
}

function sortSlots(slots) {
  return slots.sort((a, b) =>
    a.slot_date === b.slot_date
      ? a.start_time.localeCompare(b.start_time)
      : a.slot_date.localeCompare(b.slot_date),
  );
}

export const ScheduleController = {
  // GET /api/schedules/owner/:ownerId
  // Jadwal kosong milik seorang pemilik (dilihat pencari kos di halaman detail).
  // Identitas pencari lain TIDAK dikirim, hanya jumlah pengajuannya.
  async getByOwner(req, res) {
    try {
      const now = nowWIB();
      const slots = sortSlots(
        (await ScheduleModel.getByOwner(req.params.ownerId, now.date)).filter((s) => !isPast(s, now)),
      );
      const active = await MeetingModel.getActiveBySlots(slots.map((s) => s.id));

      const result = slots.map((slot) => {
        const mine = active.filter((m) => m.slot_id === slot.id);
        const myMeeting = mine.find((m) => m.seeker_id === req.user.id);
        return {
          id: slot.id,
          owner_id: slot.owner_id,
          slot_date: slot.slot_date,
          start_time: slot.start_time,
          end_time: slot.end_time,
          note: slot.note,
          state: slotState(mine),
          pending_count: mine.filter((m) => m.status === "menunggu" && m.seeker_id !== req.user.id).length,
          my_status: myMeeting ? myMeeting.status : null,
        };
      });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // GET /api/schedules/mine  (khusus pemilik)
  // Jadwal kosong milik sendiri + daftar pengajuan di tiap jadwal
  async getMine(req, res) {
    try {
      const now = nowWIB();
      const slots = sortSlots(
        (await ScheduleModel.getByOwner(req.user.id, now.date)).filter((s) => !isPast(s, now)),
      );
      const meetings = await MeetingModel.getBySlots(slots.map((s) => s.id));
      const seekers = await UserModel.findManyByIds([...new Set(meetings.map((m) => m.seeker_id))]);

      const result = slots.map((slot) => {
        const list = meetings.filter((m) => m.slot_id === slot.id);
        const active = list.filter((m) => m.status === "menunggu" || m.status === "diterima");
        const accepted = active.find((m) => m.status === "diterima");
        const seeker = accepted && seekers.find((u) => u.id === accepted.seeker_id);
        return {
          ...slot,
          state: slotState(active),
          pending_count: active.filter((m) => m.status === "menunggu").length,
          booked_by: seeker ? seeker.name : null,
        };
      });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // POST /api/schedules  (khusus pemilik)
  // body: { slot_date: "2026-11-28", start_time: "09:00", end_time: "10:00", note }
  async create(req, res) {
    try {
      const { slot_date, note } = req.body;
      const start_time = normTime(req.body.start_time);
      const end_time = normTime(req.body.end_time);

      if (!isValidDate(slot_date)) {
        return res.status(400).json({ error: "Tanggal wajib diisi dengan format YYYY-MM-DD" });
      }
      if (!start_time || !end_time) {
        return res.status(400).json({ error: "Jam mulai dan jam selesai wajib diisi (format HH:MM)" });
      }
      if (end_time <= start_time) {
        return res.status(400).json({ error: "Jam selesai harus setelah jam mulai" });
      }

      const slot = { owner_id: req.user.id, slot_date, start_time, end_time };
      if (isPast(slot)) {
        return res.status(400).json({ error: "Tidak bisa membuat jadwal pada waktu yang sudah lewat" });
      }

      // Jadwal kosong milik pemilik yang sama tidak boleh saling tumpang tindih
      const sameDay = await ScheduleModel.getByOwnerAndDate(req.user.id, slot_date);
      const clash = sameDay.find((s) => overlaps(s, slot));
      if (clash) {
        return res.status(409).json({
          error: `Jadwal bertabrakan dengan jadwal kosongmu yang lain (${shortTime(clash.start_time)}–${shortTime(clash.end_time)})`,
          code: "SLOT_OVERLAP",
        });
      }

      const data = await ScheduleModel.create({ ...slot, note: (note || "").trim() || null });
      res.status(201).json(data);
    } catch (err) {
      if (err.code === "23505") {
        return res.status(409).json({ error: "Jadwal dengan jam mulai yang sama sudah ada", code: "SLOT_OVERLAP" });
      }
      res.status(400).json({ error: err.message });
    }
  },

  // DELETE /api/schedules/:id  (khusus pemilik, hanya jadwal milik sendiri)
  async remove(req, res) {
    try {
      const slot = await ScheduleModel.getById(req.params.id);
      if (!slot) return res.status(404).json({ error: "Jadwal tidak ditemukan" });
      if (slot.owner_id !== req.user.id) {
        return res.status(403).json({ error: "Kamu hanya bisa menghapus jadwal milikmu sendiri" });
      }

      const active = await MeetingModel.getActiveBySlots([slot.id]);
      if (active.some((m) => m.status === "diterima")) {
        return res.status(409).json({
          error: "Jadwal ini sudah dipesan. Batalkan pertemuannya dulu sebelum menghapus jadwal.",
          code: "SLOT_BOOKED",
        });
      }

      await ScheduleModel.remove(slot.id); // pengajuan yang menunggu ikut terhapus (cascade)
      res.json({ message: "Jadwal dihapus" });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
};
