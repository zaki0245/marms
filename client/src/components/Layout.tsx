// client/src/components/Layout.tsx
// [FUNGSI] Kerangka halaman admin: sidebar navy, autentikasi, logout, ganti password wajib.
// [ALASAN] Melindungi panel admin & memaksa ganti password saat login pertama.
// [ALASAN] Sidebar dikelompokkan per payung bisnis (Crewing/Finance) sesuai role.

import { FormEvent, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import Logo from './Logo';

type Role = 'SUPERADMIN' | 'CREWING' | 'FINANCE';

const ROLE_LABEL: Record<Role, string> = {
  SUPERADMIN: 'Super Admin',
  CREWING: 'Crewing',
  FINANCE: 'Finance',
};

// [FUNGSI] Menu modul Crewing.
const CREWING_MENU = [
  { to: '/dashboard', label: 'Dashboard', exact: true },
  { to: '/dashboard/data-crewing', label: 'Data Crewing' },
  { to: '/dashboard/recruitment', label: 'Rekrutmen' },
  { to: '/dashboard/crew', label: 'Crew & Penempatan' },
  { to: '/dashboard/payroll', label: 'Payroll & Uang Makan' },
  { to: '/dashboard/reports', label: 'Laporan' },
];

// [FUNGSI] Menu modul Finance (urutan tetap sesuai spesifikasi).
const FINANCE_MENU = [
  { to: '/dashboard/finance', label: 'Dashboard', exact: true },
  { to: '/dashboard/finance/invoice/input', label: 'Input Invoice' },
  { to: '/dashboard/finance/invoice', label: 'Daftar Invoice' },
  { to: '/dashboard/finance/cetak', label: 'Cetak' },
  { to: '/dashboard/finance/vendor', label: 'Vendor' },
  { to: '/dashboard/finance/customer', label: 'Customer' },
  { to: '/dashboard/finance/laporan', label: 'Laporan' },
];

interface Admin {
  email: string;
  role: Role;
  mustChangePassword: boolean;
}

// [FUNGSI] Key section sidebar yang bisa dibuka/tutup.
type SectionKey = 'crewing' | 'dataMaster' | 'finance' | 'akun';

const SECTIONS_STORAGE_KEY = 'marms-sidebar-sections';

// [FUNGSI] Baca status buka/tutup section dari localStorage.
// Default: Crewing & Finance terbuka, Akun tertutup.
function readOpenSections(): Record<SectionKey, boolean> {
  try {
    const raw = localStorage.getItem(SECTIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        crewing: parsed.crewing !== false,
        dataMaster: parsed.dataMaster !== false,
        finance: parsed.finance !== false,
        akun: parsed.akun === true,
      };
    }
  } catch {
    // abaikan JSON rusak
  }
  return { crewing: true, dataMaster: true, finance: true, akun: false };
}

// [FUNGSI] Gaya item nav di atas sidebar navy; aktif = pill putih transparan.
function navCls({ isActive }: { isActive: boolean }) {
  return `flex items-center justify-between rounded-md px-3 py-2 text-sm ${
    isActive
      ? 'bg-white/15 font-medium text-white dark:bg-gray-200 dark:text-gray-900'
      : 'text-white/80 hover:bg-white/10 hover:text-white dark:text-gray-600 dark:hover:bg-gray-100 dark:hover:text-gray-900'
  }`;
}

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [pelamarBaru, setPelamarBaru] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [checking, setChecking] = useState(true);
  const [passwordBaru, setPasswordBaru] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>(readOpenSections);

  // [FUNGSI] Cek status login; arahkan ke /login bila belum login.
  useEffect(() => {
    api
      .get('/auth/me')
      .then(({ data }) => setAdmin(data))
      .catch(() => navigate('/login'))
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
    if (admin && admin.role === 'FINANCE' && location.pathname === '/dashboard') {
      navigate('/dashboard/finance', { replace: true });
    }
  }, [admin, location.pathname, navigate]);

  // [FUNGSI] Tutup drawer saat pindah halaman (mobile).
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // [FUNGSI] Ganti tema terang/gelap; simpan pilihan & toggle class .dark di <html>.
  function toggleTheme() {
    setDark((d) => {
      const next = !d;
      document.documentElement.classList.toggle('dark', next);
      try {
        localStorage.setItem('marms-theme', next ? 'dark' : 'light');
      } catch {
        // ignore
      }
      return next;
    });
  }

  // [FUNGSI] Buka/tutup satu section & simpan ke localStorage.
  function toggleSection(key: SectionKey) {
    setOpenSections((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // abaikan bila storage penuh/diblokir
      }
      return next;
    });
  }

  async function handleLogout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    navigate('/login');
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
    <div className="min-h-screen bg-surface">
      {/* Top bar mobile */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/10 bg-navy px-4 py-3 text-white dark:border-gray-200 dark:bg-card dark:text-gray-900 lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Buka menu"
          className="rounded-md p-1 text-white hover:bg-white/10 dark:text-gray-600 dark:hover:bg-gray-100"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
          </svg>
        </button>
        <Logo className="h-6 w-6" />
        <span className="text-sm font-semibold text-white dark:text-gray-900">MARMS</span>
      </header>

      {/* Overlay drawer mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-60 border-r border-white/10 bg-navy transition-transform dark:border-gray-200 dark:bg-card lg:static lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-3 px-5 py-5">
              <Logo className="h-8 w-8" />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold tracking-tight text-white dark:text-gray-900">MARMS</div>
                <div className="text-xs text-white/70 dark:text-gray-500">{ROLE_LABEL[admin.role]}</div>
              </div>
            </div>

            <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6">
              {/* [FUNGSI] Data Master — modul top-level yang bisa dipakai lintas payung bisnis. */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleSection('dataMaster')}
                  aria-expanded={openSections.dataMaster}
                  aria-controls="sidebar-data-master"
                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white dark:text-gray-500 dark:hover:bg-gray-100 dark:hover:text-gray-700"
                >
                  <span>Data Master</span>
                  <svg
                    className={`h-3.5 w-3.5 transition-transform ${openSections.dataMaster ? 'rotate-90' : ''}`}
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M7 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {openSections.dataMaster && (
                  <div id="sidebar-data-master" className="space-y-0.5 pt-0.5">
                    <NavLink to="/dashboard/kapal" className={navCls}>
                      <span>Kapal</span>
                    </NavLink>
                  </div>
                )}
              </div>

              {/* [FUNGSI] Payung bisnis Crewing — hanya untuk role Crewing/Superadmin. */}
              {canCrewing && (
                <div>
                  <button
                    type="button"
                    onClick={() => toggleSection('crewing')}
                    aria-expanded={openSections.crewing}
                    aria-controls="sidebar-crewing"
                    className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white dark:text-gray-500 dark:hover:bg-gray-100 dark:hover:text-gray-700"
                  >
                    <span>Crewing</span>
                    <svg
                      className={`h-3.5 w-3.5 transition-transform ${openSections.crewing ? 'rotate-90' : ''}`}
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M7 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {openSections.crewing && (
                    <div id="sidebar-crewing" className="space-y-0.5 pt-0.5">
                      {CREWING_MENU.map((m) => (
                        <NavLink key={m.to} to={m.to} end={m.exact} className={navCls}>
                          <span>{m.label}</span>
                          {m.label === 'Rekrutmen' && pelamarBaru > 0 && (
                            <span className="rounded-full bg-negative px-1.5 py-0.5 text-xs font-medium text-white">
                              {pelamarBaru}
                            </span>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* [FUNGSI] Payung bisnis Finance — hanya untuk role Finance/Superadmin. */}
              {canFinance && (
                <div>
                  <button
                    type="button"
                    onClick={() => toggleSection('finance')}
                    aria-expanded={openSections.finance}
                    aria-controls="sidebar-finance"
                    className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white dark:text-gray-500 dark:hover:bg-gray-100 dark:hover:text-gray-700"
                  >
                    <span>Finance</span>
                    <svg
                      className={`h-3.5 w-3.5 transition-transform ${openSections.finance ? 'rotate-90' : ''}`}
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M7 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {openSections.finance && (
                    <div id="sidebar-finance" className="space-y-0.5 pt-0.5">
                      {FINANCE_MENU.map((m) => (
                        <NavLink key={m.to} to={m.to} end={m.exact} className={navCls}>
                          <span>{m.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* [FUNGSI] Pengaturan & Kelola Akun (di luar payung bisnis). */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleSection('akun')}
                  aria-expanded={openSections.akun}
                  aria-controls="sidebar-akun"
                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white dark:text-gray-500 dark:hover:bg-gray-100 dark:hover:text-gray-700"
                >
                  <span>Akun</span>
                  <svg
                    className={`h-3.5 w-3.5 transition-transform ${openSections.akun ? 'rotate-90' : ''}`}
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M7 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {openSections.akun && (
                  <div id="sidebar-akun" className="space-y-0.5 pt-0.5">
                    {admin.role === 'SUPERADMIN' && (
                      <NavLink to="/dashboard/accounts" className={navCls}>
                        <span>Kelola Akun</span>
                      </NavLink>
                    )}
                    <NavLink to="/dashboard/settings" className={navCls}>
                      <span>Pengaturan</span>
                    </NavLink>
                  </div>
                )}
              </div>
            </nav>

            {/* [FUNGSI] Info user + logout di bawah sidebar. */}
            <div className="border-t border-white/10 p-3 dark:border-gray-200">
              <button
                onClick={toggleTheme}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-white/80 hover:bg-white/10 hover:text-white dark:text-gray-600 dark:hover:bg-gray-100"
              >
                {dark ? (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {dark ? 'Mode Terang' : 'Mode Gelap'}
              </button>
              <div className="mt-1 truncate px-2 text-sm text-white/70 dark:text-gray-600">{admin.email}</div>
              <button
                onClick={handleLogout}
                className="mt-1 w-full rounded-md px-2 py-1.5 text-left text-sm text-red-200 hover:bg-white/10 hover:text-red-100 dark:text-negative dark:hover:bg-negative/5"
              >
                Keluar
              </button>
            </div>
          </div>
        </aside>

        {/* Konten */}
        <main className="flex-1 px-6 py-6">
          <Outlet />
        </main>
      </div>

      {/* Modal ganti password wajib (login pertama) */}
      {admin.mustChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleChangePassword} className="w-full max-w-sm rounded-lg border border-gray-200 bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Ganti Password</h3>
            <p className="mt-1 text-sm text-gray-500">Anda wajib mengganti password setelah login pertama.</p>
            {pwError && <div className="mt-3 rounded-md bg-negative/5 p-3 text-sm text-negative">{pwError}</div>}
            <div className="mt-3">
              <label className="label">Password Baru (min 6 karakter)</label>
              <input type="password" required minLength={6} value={passwordBaru} onChange={(e) => setPasswordBaru(e.target.value)} className="input mt-1 w-full" />
            </div>
            <button type="submit" disabled={pwLoading} className="btn-primary mt-4 w-full disabled:opacity-50">
              {pwLoading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
