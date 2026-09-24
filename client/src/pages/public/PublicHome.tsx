// client/src/pages/public/PublicHome.tsx
// [FUNGSI] Beranda publik: pintu masuk rekrutmen (tanpa login).
// [ALASAN] Pelamar mulai dari sini lalu klik "Daftar Sekarang".

import { Link } from 'react-router-dom';
import Logo from '../../components/Logo';

const LANGKAH = [
  { no: '1', judul: 'Isi Formulir', desk: 'Lengkapi data pribadi dan pengalaman Anda.' },
  { no: '2', judul: 'Unggah Dokumen', desk: 'Lampirkan dokumen pendukung yang diminta.' },
  { no: '3', judul: 'Tunggu Konfirmasi', desk: 'Tim kami akan menghubungi Anda.' },
];

export default function PublicHome() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-navy px-6 py-4 text-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="h-9 w-9" />
            <span className="text-lg font-bold tracking-wide">MARMS</span>
          </div>
          <span className="hidden text-sm text-white/70 sm:block">Maritim Armada Raya</span>
        </div>
      </header>

      <section className="bg-navy px-6 pb-16 pt-14 text-center text-white">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">Rekrutmen Crew</h1>
          <p className="mt-4 text-white/80">
            Bergabunglah sebagai crew PT. Maritim Armada Raya dan mulai karier maritim Anda bersama kami.
          </p>
          <Link
            to="/daftar"
            className="mt-8 inline-block rounded-lg bg-white px-8 py-3 text-base font-semibold text-navy hover:bg-gray-100"
          >
            Daftar Sekarang
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {LANGKAH.map((l) => (
            <div key={l.no} className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
                {l.no}
              </div>
              <h3 className="mt-4 font-semibold text-navy">{l.judul}</h3>
              <p className="mt-1 text-sm text-gray-500">{l.desk}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-gray-200 px-6 py-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} PT. Maritim Armada Raya
      </footer>
    </div>
  );
}
