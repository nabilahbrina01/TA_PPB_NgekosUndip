import { useRef, useState } from "react";
import { Camera, ImagePlus, LoaderCircle, RefreshCw, Trash2 } from "lucide-react";
import uploadService from "../services/uploadService";
import { ACCEPTED_IMAGES, compressImage } from "../utils/image";

/**
 * Upload foto properti langsung dari HP/laptop.
 * Alur: pilih foto -> diperkecil -> diunggah ke API (/api/upload) -> URL disimpan di form.
 */
export function PhotoUploader({ value, onChange, onError }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null); // pratinjau lokal saat mengunggah
  const [progress, setProgress] = useState(null); // null = tidak sedang mengunggah

  async function handleFile(file) {
    if (!file) return;
    if (!ACCEPTED_IMAGES.includes(file.type)) {
      onError?.("Pilih foto berformat JPG, PNG, atau WEBP");
      return;
    }
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setProgress(0);
    try {
      const small = await compressImage(file);
      const { url } = await uploadService.uploadImage(small, setProgress);
      onChange(url);
    } catch (err) {
      onError?.(err.message || "Foto gagal diunggah, coba lagi");
    } finally {
      setProgress(null);
      setPreview(null);
      URL.revokeObjectURL(localUrl);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const uploading = progress !== null;
  const shown = preview || value;

  return (
    <div className="photo-uploader">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {shown ? (
        <div className="photo-preview">
          <img src={shown} alt="Foto properti" />
          {uploading && (
            <div className="photo-progress">
              <LoaderCircle className="spin" size={28} />
              <span>Mengunggah {progress}%</span>
              <div className="bar"><div style={{ width: `${progress}%` }} /></div>
            </div>
          )}
          {!uploading && (
            <div className="photo-actions">
              <button type="button" onClick={() => inputRef.current?.click()}>
                <RefreshCw size={16} /> Ganti foto
              </button>
              <button type="button" className="danger" onClick={() => onChange("")}>
                <Trash2 size={16} /> Hapus
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          className="photo-drop"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFile(e.dataTransfer.files?.[0]);
          }}
        >
          <span className="photo-drop-icon"><ImagePlus size={30} /></span>
          <strong>Unggah foto properti</strong>
          <small>Ketuk untuk memilih dari galeri atau kamera</small>
          <span className="photo-drop-hint"><Camera size={14} /> JPG, PNG, WEBP · otomatis diperkecil</span>
        </button>
      )}
    </div>
  );
}
