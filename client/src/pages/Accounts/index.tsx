// client/src/pages/Accounts/index.tsx
// [FUNGSI] Halaman Kelola Akun (khusus SUPERADMIN).
// [ALASAN] Membuat akun, memilih role, dan mengaktifkan/nonaktifkan akun.

import { FormEvent, useEffect, useState } from 'react';
import { api } from '../../api/client';

interface Account {
  id: string;
  email: string;
  role: 'SUPERADMIN' | 'CREWING' | 'FINANCE';
  active: boolean;
  mustChangePassword: boolean;
}

const ROLE_LABEL: Record<string, string> = {
  SUPERADMIN: 'Super Admin',
  CREWING: 'Crewing',
  FINANCE: 'Finance',
};

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [form, setForm] = useState({ email: '', password: '', role: 'CREWING' });
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

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

  return (
    <div>
      <h2 className="text-2xl font-bold text-navy">Kelola Akun</h2>

      {msg && <div className="mt-4 rounded bg-positive/10 p-3 text-sm text-positive">{msg}</div>}
      {error && <div className="mt-4 rounded bg-negative/10 p-3 text-sm text-negative">{error}</div>}

      <div className="mt-4 max-w-md rounded-lg bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-navy">Buat Akun Baru</h3>
        <form onSubmit={handleCreate} className="mt-3 space-y-3">
          <div>
            <label className="block text-xs text-gray-500">Email</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Password (min 6 karakter)</label>
            <input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2">
              <option value="CREWING">Crewing</option>
              <option value="FINANCE">Finance</option>
              <option value="SUPERADMIN">Super Admin</option>
            </select>
          </div>
          <button type="submit" className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white">Buat Akun</button>
        </form>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id} className="border-t border-gray-100">
                <td className="px-4 py-3">
                  <span className="font-medium text-navy">{a.email}</span>
                  {a.mustChangePassword && <span className="ml-2 text-xs text-amber-600">(wajib ganti password)</span>}
                </td>
                <td className="px-4 py-3">
                  <select value={a.role} onChange={(e) => handleRole(a, e.target.value)} className="rounded border border-gray-300 px-2 py-1">
                    <option value="CREWING">Crewing</option>
                    <option value="FINANCE">Finance</option>
                    <option value="SUPERADMIN">Super Admin</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={a.active ? 'text-positive' : 'text-negative'}>{a.active ? 'Aktif' : 'Nonaktif'}</span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleToggle(a)} className="text-sm text-navy underline hover:opacity-70">
                    {a.active ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                </td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">Belum ada akun.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
