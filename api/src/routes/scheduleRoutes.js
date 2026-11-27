import express from "express";
import { ScheduleController } from "../controllers/scheduleController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requirePemilik } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Semua endpoint jadwal wajib login
router.use(requireAuth);

router.get("/mine", requirePemilik, ScheduleController.getMine);         // jadwal kosong milik saya
router.get("/owner/:ownerId", ScheduleController.getByOwner);            // jadwal kosong seorang pemilik
router.post("/", requirePemilik, ScheduleController.create);             // tambah jadwal kosong
router.delete("/:id", requirePemilik, ScheduleController.remove);        // hapus jadwal kosong

export default router;
