import crypto from "crypto";
import { supabase } from "../config/supabaseClient.js";

const BUCKET = process.env.SUPABASE_BUCKET || "kos-images";
const EXTENSIONS = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export const UploadController = {
  // POST /api/upload  (form-data, field "image") -> { url }
  async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Pilih foto terlebih dahulu" });
      }
      // Nama file unik: <id user>/<waktu>-<acak>.<ekstensi>
      const ext = EXTENSIONS[req.file.mimetype] || "jpg";
      const path = `${req.user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, req.file.buffer, { contentType: req.file.mimetype });
      if (error) throw error;

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      res.status(201).json({ url: data.publicUrl });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
