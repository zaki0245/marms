// client/src/components/Logo.tsx
// [FUNGSI] Menampilkan logo perusahaan di atas kotak putih membulat.
// [ALASAN] Kotak putih membuat logo berwarna tetap kontras di header navy.
//          Otomatis sembunyi bila file /logo.png belum ada.

import { useState } from 'react';

export default function Logo({ className = 'h-10 w-10' }: { className?: string }) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-1 shadow-sm ${className}`}
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
