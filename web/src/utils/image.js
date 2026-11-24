/**
 * Perkecil foto sebelum diunggah (maks 1280 px, JPEG kualitas 80%)
 * agar upload cepat dan tidak melebihi batas ukuran server.
 */
export async function compressImage(file, maxSize = 1280, quality = 0.8) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  return new File([blob], (file.name || "foto").replace(/\.\w+$/, "") + ".jpg", {
    type: "image/jpeg",
  });
}

export const ACCEPTED_IMAGES = ["image/jpeg", "image/png", "image/webp"];
