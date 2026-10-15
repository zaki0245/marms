// client/src/pages/Finance/Konfigurasi.tsx
// [FUNGSI] Halaman konfigurasi Finance: nama/alamat perusahaan & penandatangan PV.
// [ALASAN] Nilai disimpan di backend agar tidak hardcode, dipakai di cetak PV.

import { FormEvent, useEffect, useState } from 'react';
import { api } from '../../api/client';

const empty = {
  perusahaanNama: '',
  alamat1: '',
  alamat2: '',
  alamat3: '',
  alamat4: '',
  ttdPrepared: '',
  ttdVerified: '',
  ttdApproved: '',
};

export default function Konfigurasi() {
  const [form, setForm] = useState(empty);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/finance/konfigurasi').then(({ data }) => setForm({ ...empty, ...data })).catch(() => undefined);
  }, []);

  function setField(k: keyof typeof empty, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg('');
    setError('');
    try {
      await api.put('/finance/konfigurasi', form);
      setMsg('Konfigurasi disimpan');
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal menyimpan');
    }
  }

  const inputCls = 'mt-1 w-full rounded border border-gray-300 px-3 py-2';

  return (
    <div>
      <h2 className="text-2xl font-bold text-navy">Konfigurasi Finance</h2>

      {msg && <div className="mt-3 rounded bg-positive/10 p-3 text-sm text-positive">{msg}</div>}
      {error && <div className="mt-3 rounded bg-negative/10 p-3 text-sm text-negative">{error}</div>}

      <form onSubmit={handleSubmit} className="mt-4 max-w-2xl rounded-lg bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-navy">Perusahaan</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs text-gray-500">Nama Perusahaan</label>
            <input required value={form.perusahaanNama} onChange={(e) => setField('perusahaanNama', e.target.value)} className={inputCls} />
          </div>
          {(['alamat1', 'alamat2', 'alamat3', 'alamat4'] as const).map((k) => (
            <div key={k} className="sm:col-span-2">
              <label className="block text-xs text-gray-500">Alamat {k.slice(-1)}</label>
              <input value={form[k]} onChange={(e) => setField(k, e.target.value)} className={inputCls} />
            </div>
          ))}
        </div>

        <h3 className="mt-5 font-semibold text-navy">Penandatangan PV</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-xs text-gray-500">Prepared by</label>
            <input value={form.ttdPrepared} onChange={(e) => setField('ttdPrepared', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Verified by (CFO)</label>
            <input value={form.ttdVerified} onChange={(e) => setField('ttdVerified', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Approved by (BOD)</label>
            <input value={form.ttdApproved} onChange={(e) => setField('ttdApproved', e.target.value)} className={inputCls} />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button type="submit" className="rounded bg-navy px-6 py-2 text-sm font-semibold text-white">Simpan</button>
        </div>
      </form>
    </div>
  );
}
