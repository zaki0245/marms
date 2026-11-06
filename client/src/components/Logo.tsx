// client/src/components/Logo.tsx
// [FUNGSI] Menampilkan logo perusahaan di atas kotak putih membulat.
// [ALASAN] Kotak putih membuat logo berwarna tetap kontras di header navy (mode terang);
//          di mode gelap kembali netral (bg-card). Otomatis sembunyi bila /logo.png belum ada.
//          Lebar mengikuti rasio asli (w-auto) agar logo tidak gepeng/kecil di kotak persegi.
import { useState } from 'react';

export default function Logo({ className = 'h-10 w-auto' }: { className?: string }) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-black/5 bg-white dark:border-white/10 dark:bg-card ${className}`}
    >
      <img
        src="/logo.png"
        alt="Logo"
        className="h-full w-auto object-contain"
        onError={() => setHidden(true)}
      />
    </div>
  );
}