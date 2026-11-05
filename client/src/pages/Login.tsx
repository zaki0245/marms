// client/src/pages/Login.tsx
// [FUNGSI] Halaman login admin.
// [ALASAN] Pintu masuk panel admin dengan autentikasi.

import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

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
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
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
  );
}
