// client/src/pages/Settings/index.tsx
// [FUNGSI] Halaman Pengaturan: info akun, ganti password, panduan reset.
// [ALASAN] Admin mengelola akunnya dari sini.

import { FormEvent, useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function Settings() {
  const [email, setEmail] = useState('');
  const [form, setForm] = useState({ passwordLama: '', passwordBaru: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/auth/me').then(({ data }) => setEmail(data.email)).catch(() => undefined);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg('');
    setError('');
    try {
      await api.post('/auth/change-password', form);
      setForm({ passwordLama: '', passwordBaru: '' });
      setMsg('Password berhasil diganti');
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal mengganti password');
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-navy">Pengaturan</h2>

      <div className="mt-4 max-w-md rounded-lg bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-500">Akun admin</p>
        <p className="mt-1 font-semibold text-navy">{email}</p>
      </div>

      <div className="mt-4 max-w-md rounded-lg bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-navy">Ganti Password</h3>
        {msg && <div className="mt-3 rounded bg-positive/10 p-3 text-sm text-positive">{msg}</div>}
        {error && <div className="mt-3 rounded bg-negative/10 p-3 text-sm text-negative">{error}</div>}
        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          <div>
            <label className="block text-xs text-gray-500">Password Lama</label>
            <input type="password" required value={form.passwordLama} onChange={(e) => setForm({ ...form, passwordLama: e.target.value })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Password Baru</label>
            <input type="password" required minLength={6} value={form.passwordBaru} onChange={(e) => setForm({ ...form, passwordBaru: e.target.value })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
          </div>
          <button type="submit" className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white">Simpan</button>
        </form>
      </div>

      <div className="mt-4 max-w-md rounded-lg bg-white p-5 text-sm shadow-sm">
        <h3 className="font-semibold text-navy">Lupa Password?</h3>
        <p className="mt-2 text-gray-500">
          Reset dilakukan manual lewat database. Lihat panduan di file SECURITY.md.
        </p>
      </div>
    </div>
  );
}
