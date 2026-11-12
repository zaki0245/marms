// client/src/pages/Accounts/index.tsx
// [FUNGSI] Halaman Kelola Akun (khusus SUPERADMIN).
// [ALASAN] Membuat akun, memilih role, mengganti password, menghapus, dan mengaktifkan akun.

import { FormEvent, useEffect, useState } from 'react';
import { api } from '../../api/client';
import Pagination, { DEFAULT_PAGE_SIZE } from '../../components/Pagination';
import { SortableTh, sortRows, useSort } from '../../components/sortable';

interface Account {
  id: string;
  email: string;
  role: 'SUPERADMIN' | 'CREWING' | 'FINANCE' | 'OPERATION';
  active: boolean;
}

interface AuditLog {
  id: string;
  adminEmail: string | null;
  aksi: string;
  detail: string | null;
  createdAt: string;
}

const ROLE_LABEL: Record<string, string> = {
  SUPERADMIN: 'Super Admin',
  CREWING: 'Crewing',
  FINANCE: 'Finance',
  OPERATION: 'Operation',
};

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [audit, setAudit] = useState<AuditLog[]>([]);
  const [form, setForm] = useState({ email: '', password: '', role: 'CREWING' });
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const { sort, toggle } = useSort();
  const [currentId, setCurrentId] = useState('');
  const [pwTarget, setPwTarget] = useState<Account | null>(null);
  const [pwBaru, setPwBaru] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  async function load() {
    try {
      const { data } = await api.get<Account[]>('/auth/accounts');
      setAccounts(data);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal memuat akun');
    }
  }

  async function loadAudit() {
    try {
      const { data } = await api.get<AuditLog[]>('/auth/audit-log');
      setAudit(data);
    } catch {
      // abaikan; audit bukan data utama
    }
  }

  useEffect(() => {
    load();
    loadAudit();
    api.get('/auth/me').then(({ data }) => setCurrentId(data.id)).catch(() => undefined);
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setMsg('');
    setError('');
    try {
      await api.post('/auth/accounts', form);
      setForm({ email: '', password: '', role: 'CREWING' });
      setMsg('Akun berhasil dibuat');
      load();
      loadAudit();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal membuat akun');
    }
  }

  async function handleToggle(acc: Account) {
    try {
      await api.patch(`/auth/accounts/${acc.id}`, { active: !acc.active });
      load();
      loadAudit();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal mengubah status akun');
    }
  }

  async function handleRole(acc: Account, role: string) {
    try {
      await api.patch(`/auth/accounts/${acc.id}`, { role });
      load();
      loadAudit();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal mengubah role');
    }
  }

  function openPw(acc: Account) {
    setPwTarget(acc);
    setPwBaru('');
    setPwError('');
  }

  async function handlePassword(e: FormEvent) {
    e.preventDefault();
    if (!pwTarget) return;
    setPwLoading(true);
    setPwError('');
    try {
      await api.patch(`/auth/accounts/${pwTarget.id}`, { password: pwBaru });
      setMsg(`Password ${pwTarget.email} diubah`);
      setPwTarget(null);
      loadAudit();
    } catch (err: any) {
      setPwError(err?.response?.data?.error ?? 'Gagal mengganti password');
    } finally {
      setPwLoading(false);
    }
  }

  async function handleDelete(acc: Account) {
    if (!window.confirm(`Hapus akun ${acc.email}?`)) return;
    setMsg('');
    setError('');
    try {
      await api.delete(`/auth/accounts/${acc.id}`);
      setMsg('Akun dihapus');
      load();
      loadAudit();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal menghapus akun');
    }
  }

  // [FUNGSI] Reset halaman saat sorting berubah.
  useEffect(() => {
    setPage(1);
  }, [sort]);

  const pageRows = sortRows(accounts, sort, {
    email: (a) => a.email,
    role: (a) => ROLE_LABEL[a.role] ?? a.role,
    status: (a) => (a.active ? 'Aktif' : 'Nonaktif'),
  }).slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <h1 className="page-title">Kelola Akun</h1>

      {msg && <div className="mt-4 alert-success">{msg}</div>}
      {error && <div className="mt-4 alert-error">{error}</div>}

      <div className="mt-4 max-w-md card p-5">
        <h3 className="font-semibold text-gray-900">Buat Akun Baru</h3>
        <form onSubmit={handleCreate} className="mt-3 space-y-3">
          <div>
            <label className="label">Email</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input mt-1 w-full" />
          </div>
          <div>
            <label className="label">Password (min 8 karakter)</label>
            <input type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input mt-1 w-full" />
          </div>
          <div>
            <label className="label">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input mt-1 w-full">
              <option value="CREWING">Crewing</option>
              <option value="FINANCE">Finance</option>
              <option value="OPERATION">Operation</option>
              <option value="SUPERADMIN">Super Admin</option>
            </select>
          </div>
          <button type="submit" className="btn-primary">Buat Akun</button>
        </form>
      </div>

      <div className="mt-4 card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-gray-500">
            <tr>
              <SortableTh label="Email" sortKey="email" sort={sort} onSort={toggle} className="px-4 py-3" />
              <SortableTh label="Role" sortKey="role" sort={sort} onSort={toggle} className="px-4 py-3" />
              <SortableTh label="Status" sortKey="status" sort={sort} onSort={toggle} className="px-4 py-3" />
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((a) => (
              <tr key={a.id} className="border-t border-gray-100">
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-900">{a.email}</span>
                  {a.id === currentId && <span className="ml-2 text-xs text-gray-500">(akun Anda)</span>}
                </td>
                <td className="px-4 py-3">
                  <select value={a.role} onChange={(e) => handleRole(a, e.target.value)} className="rounded-md border border-gray-300 px-2 py-1">
                    <option value="CREWING">Crewing</option>
                    <option value="FINANCE">Finance</option>
                    <option value="OPERATION">Operation</option>
                    <option value="SUPERADMIN">Super Admin</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={a.active ? 'text-positive' : 'text-negative'}>{a.active ? 'Aktif' : 'Nonaktif'}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1.5">
                    <button onClick={() => handleToggle(a)} className="rounded-md border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50">
                      {a.active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button onClick={() => openPw(a)} className="rounded-md border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50">
                      Ganti Password
                    </button>
                    {a.id !== currentId && (
                      <button onClick={() => handleDelete(a)} className="rounded-md border border-negative/40 px-2.5 py-1 text-xs text-negative hover:bg-negative/5">
                        Hapus
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">Belum ada akun.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        total={accounts.length}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
      />

      {/* [FUNGSI] Riwayat aksi sensitif (audit log) untuk SUPERADMIN. */}
      <div className="mt-6 card overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-3 font-semibold text-gray-900">Riwayat Aktivitas</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-gray-500">
              <tr>
                <th className="px-4 py-2">Waktu</th>
                <th className="px-4 py-2">Admin</th>
                <th className="px-4 py-2">Aksi</th>
                <th className="px-4 py-2">Detail</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((a) => (
                <tr key={a.id} className="border-t border-gray-100">
                  <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-500">
                    {new Date(a.createdAt).toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-2">{a.adminEmail ?? '-'}</td>
                  <td className="px-4 py-2">{a.aksi}</td>
                  <td className="px-4 py-2">{a.detail ?? '-'}</td>
                </tr>
              ))}
              {audit.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500">Belum ada aktivitas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* [FUNGSI] Reset password akun lain oleh SUPERADMIN. */}
      {pwTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handlePassword} className="w-full max-w-sm rounded-lg border border-gray-200 bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Ganti Password</h3>
            <p className="mt-1 text-sm text-gray-500">{pwTarget.email}</p>
            {pwError && <div className="mt-3 rounded-md bg-negative/5 p-3 text-sm text-negative">{pwError}</div>}
            <div className="mt-3">
              <label className="label">Password Baru (min 8 karakter)</label>
              <input type="password" required minLength={8} value={pwBaru} onChange={(e) => setPwBaru(e.target.value)} className="input mt-1 w-full" />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setPwTarget(null)} className="btn-secondary">
                Batal
              </button>
              <button type="submit" disabled={pwLoading} className="btn-primary disabled:opacity-50">
                {pwLoading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
