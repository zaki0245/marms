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
      <h1 className="page-title">Pengaturan</h1>

      <div className="mt-4 max-w-md card p-5">
        <p className="text-sm text-gray-500">Akun admin</p>
        <p className="mt-1 font-semibold text-gray-900">{email}</p>
      </div>

      <div className="mt-4 max-w-md card p-5">
        <h3 className="font-semibold text-gray-900">Ganti Password</h3>
        {msg && <div className="mt-3 alert-success">{msg}</div>}
        {error && <div className="mt-3 alert-error">{error}</div>}
        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          <div>
            <label className="label">Password Lama</label>
            <input type="password" required value={form.passwordLama} onChange={(e) => setForm({ ...form, passwordLama: e.target.value })} className="input mt-1 w-full" />
          </div>
          <div>
            <label className="label">Password Baru</label>
            <input type="password" required minLength={6} value={form.passwordBaru} onChange={(e) => setForm({ ...form, passwordBaru: e.target.value })} className="input mt-1 w-full" />
          </div>
          <button type="submit" className="btn-primary">Simpan</button>
        </form>
      </div>

      <div className="mt-4 max-w-md card p-5 text-sm">
        <h3 className="font-semibold text-gray-900">Lupa Password?</h3>
        <p className="mt-2 text-gray-500">
          Reset dilakukan manual lewat database: hash password baru dengan bcrypt, lalu update
          kolom <code>passwordHash</code> di tabel <code>Admin</code>.
        </p>
      </div>
    </div>
  );
}
