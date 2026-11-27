import express from "express";
import { MeetingController } from "../controllers/meetingController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requirePemilik, requirePencari } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Semua endpoint pengajuan jadwal wajib login
router.use(requireAuth);

router.post("/", requirePencari, MeetingController.create);                    // ajukan jadwal
router.get("/mine", MeetingController.getMine);                                // pengajuan saya (pencari)
router.get("/incoming", requirePemilik, MeetingController.getIncoming);        // pengajuan masuk (pemilik)
router.patch("/:id/status", requirePemilik, MeetingController.setStatus);      // terima / tolak
router.patch("/:id/cancel", MeetingController.cancel);                         // batalkan (pencari)

export default router;
