// client/src/components/PublicLayout.tsx
// [FUNGSI] Kerangka halaman publik: header navy + footer navy untuk alur rekrutmen.
// [ALASAN] /career, /career/daftar, /career/terima-kasih memakai header & footer yang sama.
import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import Logo from './Logo';

function navClass({ isActive }: { isActive: boolean }) {
  return `rounded-md px-3 py-2 text-sm transition-colors ${
    isActive ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
  }`;
}

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-surface">
      <header className="bg-navy text-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link to="/career" aria-label="Beranda">
            {/* [FUNGSI] Logo dijadikan putih monokrom via filter. | [ALASAN] Logo asli biru/merah; di atas navy teks birunya hilang, kotak putih malah mencolok. */}
            <Logo plain className="h-9 w-auto brightness-0 invert" />
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <NavLink to="/career" end className={navClass}>
              Beranda
            </NavLink>
            <NavLink to="/career/daftar" className={navClass}>
              Daftar
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">{children}</main>

      <footer className="bg-navy text-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-8">
          <p className="text-sm text-white/70">Rekrutmen crew PT. Maritim Armada Raya.</p>
          <p className="mt-2 text-[13px] text-white/60">
            © {new Date().getFullYear()} PT. Maritim Armada Raya
          </p>
        </div>
      </footer>
    </div>
  );
}
