// client/src/components/Layout.tsx
// [FUNGSI] Kerangka halaman admin: sidebar terang, autentikasi, logout, ganti password wajib.
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
  { to: '/dashboard/master-data', label: 'Master Data' },
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

// [FUNGSI] Gaya item nav; aktif = pill abu netral, bukan warna navy.
function navCls({ isActive }: { isActive: boolean }) {
  return `flex items-center justify-between rounded-md px-3 py-2 text-sm ${
    isActive
      ? 'bg-gray-200/70 font-medium text-gray-900'
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Buka menu"
          className="rounded-md p-1 text-gray-600 hover:bg-gray-100"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
          </svg>
        </button>
        <Logo className="h-6 w-6" />
        <span className="text-sm font-semibold text-gray-900">MARMS</span>
      </header>

      {/* Overlay drawer mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-60 border-r border-gray-200 bg-white transition-transform lg:static lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-3 px-5 py-5">
              <Logo className="h-8 w-8" />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold tracking-tight text-gray-900">MARMS</div>
                <div className="text-xs text-gray-500">{ROLE_LABEL[admin.role]}</div>
              </div>
            </div>

            <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6">
              {/* [FUNGSI] Payung bisnis Crewing — hanya untuk role Crewing/Superadmin. */}
              {canCrewing && (
                <div>
                  <div className="px-2 pb-1 text-xs font-medium text-gray-500">Crewing</div>
                  <div className="space-y-0.5">
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
                </div>
              )}

              {/* [FUNGSI] Payung bisnis Finance — hanya untuk role Finance/Superadmin. */}
              {canFinance && (
                <div>
                  <div className="px-2 pb-1 text-xs font-medium text-gray-500">Finance</div>
                  <div className="space-y-0.5">
                    {FINANCE_MENU.map((m) => (
                      <NavLink key={m.to} to={m.to} end={m.exact} className={navCls}>
                        <span>{m.label}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              )}

              {/* [FUNGSI] Pengaturan & Kelola Akun (di luar payung bisnis). */}
              <div>
                <div className="px-2 pb-1 text-xs font-medium text-gray-500">Akun</div>
                <div className="space-y-0.5">
                  {admin.role === 'SUPERADMIN' && (
                    <NavLink to="/dashboard/accounts" className={navCls}>
                      <span>Kelola Akun</span>
                    </NavLink>
                  )}
                  <NavLink to="/dashboard/settings" className={navCls}>
                    <span>Pengaturan</span>
                  </NavLink>
                </div>
              </div>
            </nav>

            {/* [FUNGSI] Info user + logout di bawah sidebar. */}
            <div className="border-t border-gray-200 p-3">
              <div className="truncate px-2 text-sm text-gray-600">{admin.email}</div>
              <button
                onClick={handleLogout}
                className="mt-1 w-full rounded-md px-2 py-1.5 text-left text-sm text-negative hover:bg-negative/5"
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
          <form onSubmit={handleChangePassword} className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-xl">
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
