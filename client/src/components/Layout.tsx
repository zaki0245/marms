// client/src/components/Layout.tsx
// [FUNGSI] Kerangka halaman admin: sidebar, autentikasi, logout, ganti password wajib.
// [ALASAN] Melindungi panel admin & memaksa ganti password saat login pertama.
// [ALASAN] Sidebar dikelompokkan per payung bisnis (Crewing/Finance) sesuai role.

import { FormEvent, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import Logo from './Logo';

type Role = 'SUPERADMIN' | 'CREWING' | 'FINANCE';

// [FUNGSI] Menu modul Crewing.
const CREWING_MENU = [
  { to: '/admin', label: 'Dashboard', exact: true },
  { to: '/admin/master-data', label: 'Master Data' },
  { to: '/admin/recruitment', label: 'Rekrutmen' },
  { to: '/admin/crew', label: 'Crew & Penempatan' },
  { to: '/admin/payroll', label: 'Payroll & Uang Makan' },
  { to: '/admin/reports', label: 'Laporan' },
];

// [FUNGSI] Menu modul Finance (scaffold awal).
const FINANCE_MENU = [{ to: '/admin/finance', label: 'Finance', exact: false }];

interface Admin {
  email: string;
  role: Role;
  mustChangePassword: boolean;
}

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [pelamarBaru, setPelamarBaru] = useState(0);
  const [open, setOpen] = useState(true);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [checking, setChecking] = useState(true);
  const [passwordBaru, setPasswordBaru] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  // [FUNGSI] Cek status login; arahkan ke /admin/login bila belum login.
  useEffect(() => {
    api
      .get('/auth/me')
      .then(({ data }) => setAdmin(data))
      .catch(() => navigate('/admin/login'))
      .finally(() => setChecking(false));
  }, []);

  // [FUNGSI] Muat jumlah pelamar baru untuk badge di menu Rekrutmen (hanya role Crewing).
  useEffect(() => {
    if (admin && admin.role !== 'FINANCE') {
      api.get('/recruitment/stats').then(({ data }) => setPelamarBaru(data.pelamarBaru ?? 0)).catch(() => undefined);
    }
  }, [admin]);

  // [FUNGSI] User FINANCE diarahkan ke halaman Finance (bukan Dashboard crew).
  useEffect(() => {
    if (admin && admin.role === 'FINANCE' && location.pathname === '/admin') {
      navigate('/admin/finance', { replace: true });
    }
  }, [admin, location.pathname, navigate]);

  async function handleLogout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    navigate('/admin/login');
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setPwLoading(true);
    setPwError('');
    try {
      await api.post('/auth/change-password', { passwordBaru });
      setAdmin((a) => (a ? { ...a, mustChangePassword: false } : a));
      setPasswordBaru('');
    } catch (err: any) {
      setPwError(err?.response?.data?.error ?? 'Gagal mengganti password');
    } finally {
      setPwLoading(false);
    }
  }

  if (checking) return <p className="p-6 text-gray-500">Memuat...</p>;
  if (!admin) return null; // sedang diarahkan ke halaman login

  const canCrewing = admin.role === 'SUPERADMIN' || admin.role === 'CREWING';
  const canFinance = admin.role === 'SUPERADMIN' || admin.role === 'FINANCE';

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-navy text-white">
        <div className="flex items-center gap-3 px-5 py-6">
          <Logo className="h-9 w-9" />
          <span className="text-lg font-bold tracking-wide">MARMS</span>
        </div>
        <nav className="px-2">
          {/* [FUNGSI] Payung bisnis Crewing — hanya untuk role Crewing/Superadmin. */}
          {canCrewing && (
            <>
              <button
                onClick={() => setOpen((o) => !o)}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white/70 hover:bg-white/10"
              >
                <span>Crewing</span>
                <svg className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="none">
                  <path d="M5 7.5 L10 12.5 L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {open && (
                <div className="space-y-1 pt-1">
                  {CREWING_MENU.map((m) => (
                    <NavLink
                      key={m.to}
                      to={m.to}
                      end={m.exact}
                      className={({ isActive }) =>
                        `flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                          isActive ? 'bg-white/15 font-semibold' : 'hover:bg-white/10'
                        }`
                      }
                    >
                      <span>{m.label}</span>
                      {m.label === 'Rekrutmen' && pelamarBaru > 0 && (
                        <span className="rounded-full bg-negative px-2 py-0.5 text-xs font-bold">
                          {pelamarBaru}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </div>
              )}
            </>
          )}

          {/* [FUNGSI] Payung bisnis Finance — hanya untuk role Finance/Superadmin. */}
          {canFinance && (
            <div className="mt-2 border-t border-white/10 pt-1">
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white/70">Finance</div>
              <div className="space-y-1">
                {FINANCE_MENU.map((m) => (
                  <NavLink
                    key={m.to}
                    to={m.to}
                    end={m.exact}
                    className={({ isActive }) =>
                      `flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                        isActive ? 'bg-white/15 font-semibold' : 'hover:bg-white/10'
                      }`
                    }
                  >
                    <span>{m.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          )}

          {/* [FUNGSI] Pengaturan & Kelola Akun (di luar payung bisnis). */}
          <div className="mt-2 border-t border-white/10 pt-1">
            {admin.role === 'SUPERADMIN' && (
              <NavLink
                to="/admin/accounts"
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                    isActive ? 'bg-white/15 font-semibold' : 'hover:bg-white/10'
                  }`
                }
              >
                <span>Kelola Akun</span>
              </NavLink>
            )}
            <NavLink
              to="/admin/settings"
              className={({ isActive }) =>
                `flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                  isActive ? 'bg-white/15 font-semibold' : 'hover:bg-white/10'
                }`
              }
            >
              <span>Pengaturan</span>
            </NavLink>
          </div>
        </nav>
      </aside>

      {/* Konten */}
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <h1 className="text-sm font-semibold text-gray-500">
            Maritim Armada Raya Management System
          </h1>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-500">{admin.email}</span>
            <button onClick={handleLogout} className="text-negative hover:underline">Keluar</button>
          </div>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {/* Modal ganti password wajib (login pertama) */}
      {admin.mustChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleChangePassword} className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-navy">Ganti Password</h3>
            <p className="mt-1 text-sm text-gray-500">Anda wajib mengganti password setelah login pertama.</p>
            {pwError && <div className="mt-3 rounded bg-negative/10 p-3 text-sm text-negative">{pwError}</div>}
            <div className="mt-3">
              <label className="block text-xs text-gray-500">Password Baru (min 6 karakter)</label>
              <input type="password" required minLength={6} value={passwordBaru} onChange={(e) => setPasswordBaru(e.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
            </div>
            <button type="submit" disabled={pwLoading} className="mt-4 w-full rounded bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {pwLoading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
