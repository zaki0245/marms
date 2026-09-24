// client/src/pages/Login.tsx
// [FUNGSI] Halaman login admin.
// [ALASAN] Pintu masuk panel admin dengan autentikasi.

import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import Logo from '../components/Logo';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/login', form);
      navigate('/admin');
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg bg-white p-8 shadow-xl">
        <div className="flex justify-center">
          <Logo className="h-12 w-12" />
        </div>
        <h1 className="mt-2 text-center text-xl font-bold text-navy">MARMS</h1>
        <p className="mt-1 text-center text-sm text-gray-500">Masuk Admin</p>
        {error && <div className="mt-4 rounded bg-negative/10 p-3 text-sm text-negative">{error}</div>}
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs text-gray-500">Email</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Password</label>
            <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
          </div>
        </div>
        <button type="submit" disabled={loading} className="mt-6 w-full rounded bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {loading ? 'Masuk...' : 'Masuk'}
        </button>
      </form>
    </div>
  );
}
