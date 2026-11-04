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
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="bg-navy px-6 py-4 text-white dark:hidden">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3">
          <Logo className="h-9 w-9" />
          <span className="text-lg font-bold tracking-wide">MARMS</span>
          <span className="ml-auto hidden text-sm text-white/70 sm:block">Maritim Armada Raya</span>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <form onSubmit={handleSubmit} className="card w-full max-w-sm p-8">
          <h1 className="text-center text-xl font-semibold text-gray-900">MARMS</h1>
          <p className="mt-1 text-center text-sm text-gray-500">Masuk Admin</p>
          {error && <div className="alert-error mt-4">{error}</div>}
          <div className="mt-4 space-y-3">
            <div>
              <label className="label">Email</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input mt-1 w-full" />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input mt-1 w-full" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary mt-6 w-full disabled:opacity-50">
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}
