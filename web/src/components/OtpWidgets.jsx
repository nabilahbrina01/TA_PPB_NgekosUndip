import { useEffect, useState } from "react";

/** Kolom kode OTP 6 digit. Memanggil onComplete saat 6 angka terisi. */
export function OtpInput({ value, onChange, onComplete }) {
  return (
    <input
      className="otp-input"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      placeholder="••••••"
      value={value}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
        onChange(digits);
        if (digits.length === 6) onComplete?.(digits);
      }}
    />
  );
}

/** Tombol "Kirim ulang kode" dengan hitung mundur 60 detik. */
export function ResendButton({ onResend }) {
  const [seconds, setSeconds] = useState(60);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  if (seconds > 0) {
    return <p className="muted center">Kirim ulang kode dalam {seconds} detik</p>;
  }
  return (
    <button
      type="button"
      className="btn btn-text"
      disabled={sending}
      onClick={async () => {
        setSending(true);
        try {
          await onResend();
          setSeconds(60);
        } catch {
          // pesan error sudah ditampilkan oleh halaman
        } finally {
          setSending(false);
        }
      }}
    >
      {sending ? "Mengirim..." : "Kirim ulang kode"}
    </button>
  );
}
