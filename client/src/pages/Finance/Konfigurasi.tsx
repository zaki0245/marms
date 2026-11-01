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
  approvalEmail: '',
  approvalCc: '',
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

  const inputCls = 'input mt-1 w-full';

  return (
    <div>
      <h1 className="page-title">Konfigurasi Finance</h1>

      {msg && <div className="mt-3 alert-success">{msg}</div>}
      {error && <div className="mt-3 alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="mt-4 max-w-2xl card p-5">
        <h3 className="font-semibold text-gray-900">Perusahaan</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Nama Perusahaan</label>
            <input required value={form.perusahaanNama} onChange={(e) => setField('perusahaanNama', e.target.value)} className={inputCls} />
          </div>
          {(['alamat1', 'alamat2', 'alamat3', 'alamat4'] as const).map((k) => (
            <div key={k} className="sm:col-span-2">
              <label className="label">Alamat {k.slice(-1)}</label>
              <input value={form[k]} onChange={(e) => setField(k, e.target.value)} className={inputCls} />
            </div>
          ))}
        </div>

        <h3 className="mt-5 font-semibold text-gray-900">Penandatangan PV</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="label">Prepared by</label>
            <input value={form.ttdPrepared} onChange={(e) => setField('ttdPrepared', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="label">Verified by (CFO)</label>
            <input value={form.ttdVerified} onChange={(e) => setField('ttdVerified', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="label">Approved by (BOD)</label>
            <input value={form.ttdApproved} onChange={(e) => setField('ttdApproved', e.target.value)} className={inputCls} />
          </div>
        </div>

        <h3 className="mt-5 font-semibold text-gray-900">Approval Email</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Email Approver</label>
            <input value={form.approvalEmail} onChange={(e) => setField('approvalEmail', e.target.value)} placeholder="approver@perusahaan.co.id" className={inputCls} />
            <p className="mt-1 text-xs text-gray-500">Pisahkan dengan koma untuk banyak penerima.</p>
          </div>
          <div>
            <label className="label">Email CC</label>
            <input value={form.approvalCc} onChange={(e) => setField('approvalCc', e.target.value)} placeholder="cc@perusahaan.co.id" className={inputCls} />
            <p className="mt-1 text-xs text-gray-500">Pisahkan dengan koma untuk banyak penerima.</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button type="submit" className="btn-primary px-6">Simpan</button>
        </div>
      </form>
    </div>
  );
}
