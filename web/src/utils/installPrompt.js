// ---------------------------------------------------------------------------
// Menangkap event "beforeinstallprompt" sejak aplikasi pertama kali dibuka.
// Chrome mengirim event ini sekali saat halaman dimuat, jadi harus ditangkap
// di awal (main.jsx), bukan menunggu halaman Profil dibuka.
// ---------------------------------------------------------------------------
let deferredPrompt = null;
const listeners = new Set();

const notify = () => listeners.forEach((fn) => fn(deferredPrompt));

export function initInstallPrompt() {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // simpan dulu, tampilkan lewat tombol di Profil
    deferredPrompt = e;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
  });
}

export function getInstallPrompt() {
  return deferredPrompt;
}

export function subscribeInstallPrompt(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export async function promptInstall() {
  if (!deferredPrompt) return false;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  notify();
  return outcome === "accepted";
}

// true jika aplikasi sudah dibuka sebagai aplikasi terpasang
export function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

export function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}
