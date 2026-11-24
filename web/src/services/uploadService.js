import { apiClient } from "../config/api";

// POST /api/upload (form-data, field "image") -> { url }
// Wajib login sebagai pemilik kos. onProgress(persen) untuk progress bar.
const uploadService = {
  uploadImage: (file, onProgress) => {
    const formData = new FormData();
    formData.append("image", file, file.name || "foto.jpg");
    return apiClient.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000,
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
      },
    });
  },
};

export default uploadService;
