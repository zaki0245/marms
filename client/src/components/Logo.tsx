// client/src/components/Logo.tsx
// [FUNGSI] Menampilkan logo perusahaan di atas kotak putih membulat.
// [ALASAN] Kotak putih membuat logo berwarna tetap kontras di header navy (mode terang);
//          di mode gelap kembali netral (bg-card). Otomatis sembunyi bila /logo.png belum ada.

import { useState } from 'react';

export default function Logo({ className = 'h-10 w-10' }: { className?: string }) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-white dark:bg-card ${className}`}
    >
      <img
        src="/logo.png"
        alt="Logo"
        className="h-full w-full object-contain"
        onError={() => setHidden(true)}
      />
    </div>
  );
}
