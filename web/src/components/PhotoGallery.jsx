import { useState } from "react";
import { ImageBox } from "./ImageBox";

/** Galeri foto yang bisa digeser (swipe) di halaman detail. */
export function PhotoGallery({ images, alt }) {
  const [index, setIndex] = useState(0);
  if (images.length <= 1) return <ImageBox src={images[0]} alt={alt} />;
  return (
    <div className="photo-gallery">
      <div
        className="gallery-track"
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
      >
        {images.map((src, i) => (
          <ImageBox key={src} src={src} alt={`${alt} ${i + 1}`} />
        ))}
      </div>
      <span className="gallery-counter">{index + 1}/{images.length}</span>
      <div className="gallery-dots">
        {images.map((src, i) => (
          <span key={src} className={i === index ? "active" : ""} />
        ))}
      </div>
    </div>
  );
}
