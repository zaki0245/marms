// client/src/pages/MasterData/Pengaturan.tsx
// [FUNGSI] Halaman pengaturan umum (uang makan per bulan).
// [ALASAN] Nilai ini dipakai sebagai dasar prorata uang makan di payroll.

import { FormEvent, useEffect, useState } from 'react';
import { api, formatRupiah } from '../../api/client';

export default function Pengaturan() {
  const [uangMakan, setUangMakan] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api
      .get('/master-data/pengaturan')
      .then(({ data }) => setUangMakan(String(data.uangMakanPerBulan)))
      .catch(() => setError('Gagal memuat pengaturan'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.put('/master-data/pengaturan', { uangMakanPerBulan: Number(uangMakan) });
      setSuccess('Pengaturan tersimpan');
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal menyimpan');
    }
  }

  if (loading) return <p className="text-gray-500">Memuat...</p>;

  return (
    <div className="max-w-md">
      {error && (
        <div className="mb-3 rounded bg-negative/10 p-3 text-sm text-negative">{error}</div>
      )}
      {success && (
        <div className="mb-3 rounded bg-positive/10 p-3 text-sm text-positive">{success}</div>
      )}

      <form onSubmit={handleSave} className="rounded-lg bg-white p-5 shadow-sm">
        <label className="block text-sm font-medium text-gray-700">Uang Makan per Bulan</label>
        <input
          type="number"
          value={uangMakan}
          onChange={(e) => setUangMakan(e.target.value)}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
        />
        <p className="mt-2 text-sm text-gray-500">
          Nilai saat ini: {formatRupiah(Number(uangMakan) || 0)}
        </p>
        <button className="mt-4 rounded bg-navy px-4 py-2 text-sm font-semibold text-white">
          Simpan
        </button>
      </form>
    </div>
  );
}
