import { useState } from "react";
import { House } from "lucide-react";

/** Foto dari URL, dengan gambar pengganti jika kosong / gagal dimuat. */
export function ImageBox({ src, alt, className = "" }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`image-box placeholder ${className}`}>
        <House size={40} />
      </div>
    );
  }
  return (
    <img
      className={`image-box ${className}`}
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
