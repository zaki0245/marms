// client/src/pages/public/TerimaKasih.tsx
// [FUNGSI] Halaman "Terima Kasih" setelah pendaftaran selesai.
// [ALASAN] Konfirmasi sopan tanpa menampilkan nomor lamaran.

import { Link } from 'react-router-dom';
import Logo from '../../components/Logo';

export default function TerimaKasih() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="bg-navy px-6 py-5 text-white">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
          <Logo className="h-8 w-8" />
          <span className="text-lg font-bold tracking-wide">MARMS</span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-2xl bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-positive/10">
            <svg className="h-8 w-8 text-positive" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="mt-6 text-2xl font-bold text-navy">Terima Kasih</h1>
          <p className="mt-3 text-gray-600">
            Pendaftaran Anda telah kami terima. Tim kami akan menghubungi Anda untuk proses selanjutnya.
          </p>
          <Link
            to="/"
            className="mt-8 inline-block rounded-lg bg-navy px-8 py-2.5 text-sm font-semibold text-white hover:bg-navy/90"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </main>
    </div>
  );
}
