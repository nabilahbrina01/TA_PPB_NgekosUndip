import express from "express";
import { UploadController } from "../controllers/uploadController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requirePemilik } from "../middleware/roleMiddleware.js";
import { handleUpload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Upload foto properti: wajib login sebagai pemilik kos
router.post("/", requireAuth, requirePemilik, handleUpload, UploadController.uploadImage);

export default router;
