import multer from "multer";

const MAX_SIZE_MB = 4; // batas request Vercel 4,5 MB

// File disimpan sementara di memori, lalu diteruskan ke Supabase Storage
export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File harus berupa gambar JPG, PNG, atau WEBP"));
    }
  },
}).single("image");

// Bungkus multer agar error-nya dikirim sebagai JSON
export function handleUpload(req, res, next) {
  uploadImage(req, res, (err) => {
    if (!err) return next();
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? `Ukuran foto maksimal ${MAX_SIZE_MB} MB`
        : err.message;
    res.status(400).json({ error: message });
  });
}
