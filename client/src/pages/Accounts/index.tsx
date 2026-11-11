// client/src/pages/Accounts/index.tsx
// [FUNGSI] Halaman Kelola Akun (khusus SUPERADMIN).
// [ALASAN] Membuat akun, memilih role, dan mengaktifkan/nonaktifkan akun.

import { FormEvent, useEffect, useState } from 'react';
import { api } from '../../api/client';
import Pagination, { DEFAULT_PAGE_SIZE } from '../../components/Pagination';
import { SortableTh, sortRows, useSort } from '../../components/sortable';

interface Account {
  id: string;
  email: string;
  role: 'SUPERADMIN' | 'CREWING' | 'FINANCE' | 'OPERATION';
  active: boolean;
  mustChangePassword: boolean;
}

const ROLE_LABEL: Record<string, string> = {
  SUPERADMIN: 'Super Admin',
  CREWING: 'Crewing',
  FINANCE: 'Finance',
  OPERATION: 'Operation',
};

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [form, setForm] = useState({ email: '', password: '', role: 'CREWING' });
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const { sort, toggle } = useSort();

  async function load() {
    try {
      const { data } = await api.get<Account[]>('/auth/accounts');
      setAccounts(data);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal memuat akun');
    }
  }

  useEffect(() => {
    load();
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
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal membuat akun');
    }
  }

  async function handleToggle(acc: Account) {
    try {
      await api.patch(`/auth/accounts/${acc.id}`, { active: !acc.active });
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal mengubah status akun');
    }
  }

  async function handleRole(acc: Account, role: string) {
    try {
      await api.patch(`/auth/accounts/${acc.id}`, { role });
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal mengubah role');
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
            <label className="label">Password (min 6 karakter)</label>
            <input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input mt-1 w-full" />
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
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((a) => (
              <tr key={a.id} className="border-t border-gray-100">
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-900">{a.email}</span>
                  {a.mustChangePassword && <span className="ml-2 text-xs text-gray-500">(wajib ganti password)</span>}
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
                <td className="px-4 py-3">
                  <button onClick={() => handleToggle(a)} className="text-sm text-gray-700 hover:text-gray-900">
                    {a.active ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
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
    </div>
  );
}
