import { useRef, useState } from "react";
import { ImagePlus, LoaderCircle, Star, Trash2 } from "lucide-react";
import uploadService from "../services/uploadService";
import { ACCEPTED_IMAGES, compressImage } from "../utils/image";

export const MAX_PHOTOS = 5;

/**
 * Unggah sampai 5 foto properti. Foto pertama menjadi sampul.
 * Setiap foto diperkecil lalu dikirim ke API (/api/upload).
 */
export function GalleryUploader({ value, onChange, onError }) {
  const inputRef = useRef(null);
  const [uploads, setUploads] = useState([]); // foto yang sedang diunggah: { id, preview, progress }

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    const room = MAX_PHOTOS - value.length - uploads.length;
    if (room <= 0) {
      onError?.(`Maksimal ${MAX_PHOTOS} foto`);
      return;
    }
    if (files.length > room) onError?.(`Hanya ${room} foto lagi yang bisa ditambahkan`);

    let urls = [...value];
    for (const file of files.slice(0, room)) {
      if (!ACCEPTED_IMAGES.includes(file.type)) {
        onError?.(`${file.name}: format harus JPG, PNG, atau WEBP`);
        continue;
      }
      const id = Math.random().toString(36).slice(2);
      const preview = URL.createObjectURL(file);
      setUploads((u) => [...u, { id, preview, progress: 0 }]);
      try {
        const small = await compressImage(file);
        const { url } = await uploadService.uploadImage(small, (p) =>
          setUploads((u) => u.map((x) => (x.id === id ? { ...x, progress: p } : x))),
        );
        urls = [...urls, url];
        onChange(urls);
      } catch (err) {
        onError?.(err.message || "Foto gagal diunggah");
      } finally {
        setUploads((u) => u.filter((x) => x.id !== id));
        URL.revokeObjectURL(preview);
      }
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  const remove = (url) => onChange(value.filter((u) => u !== url));
  const makeCover = (url) => onChange([url, ...value.filter((u) => u !== url)]);
  const canAdd = value.length + uploads.length < MAX_PHOTOS;

  return (
    <div className="gallery-uploader">
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden
        onChange={(e) => handleFiles(e.target.files)} />

      {value.length === 0 && uploads.length === 0 ? (
        <button type="button" className="photo-drop" onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}>
          <span className="photo-drop-icon"><ImagePlus size={30} /></span>
          <strong>Unggah foto properti</strong>
          <small>Pilih hingga {MAX_PHOTOS} foto dari galeri atau kamera</small>
          <span className="photo-drop-hint">JPG, PNG, WEBP · otomatis diperkecil</span>
        </button>
      ) : (
        <div className="gallery-grid">
          {value.map((url, i) => (
            <div key={url} className={"gallery-item" + (i === 0 ? " cover" : "")}>
              <img src={url} alt={`Foto ${i + 1}`} />
              {i === 0 ? (
                <span className="cover-tag"><Star size={12} /> Sampul</span>
              ) : (
                <button type="button" className="set-cover" onClick={() => makeCover(url)}>Jadikan sampul</button>
              )}
              <button type="button" className="remove-photo" onClick={() => remove(url)} aria-label="Hapus foto">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {uploads.map((u) => (
            <div key={u.id} className="gallery-item uploading">
              <img src={u.preview} alt="" />
              <div className="gallery-progress">
                <LoaderCircle size={22} className="spin" />
                <span>{u.progress}%</span>
              </div>
            </div>
          ))}
          {canAdd && (
            <button type="button" className="gallery-add" onClick={() => inputRef.current?.click()}>
              <ImagePlus size={24} />
              <span>Tambah foto</span>
              <small>{value.length + uploads.length}/{MAX_PHOTOS}</small>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
