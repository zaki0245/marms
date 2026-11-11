// client/src/pages/Operation/AgentForm.tsx
// [FUNGSI] Modal tambah/edit agen pelabuhan (nama, PIC, kontak).
// [ALASAN] Dipakai halaman Agen & tombol "+" pada form shipment.

import { FormEvent, useState } from 'react';
import { api } from '../../api/client';
import { AgentTipe, OperationAgent } from './types';

export default function AgentForm({
  initial,
  tipe,
  onClose,
  onSaved,
}: {
  initial?: OperationAgent | null;
  /** Tipe agen untuk data baru (POL/POD). */
  tipe?: AgentTipe;
  onClose: () => void;
  onSaved: (agent: OperationAgent) => void;
}) {
  const tipeAktif: AgentTipe = initial?.tipe ?? tipe ?? 'POL';
  const [form, setForm] = useState({
    nama: initial?.nama ?? '',
    pic: initial?.pic ?? '',
    kontak: initial?.kontak ?? '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        tipe: tipeAktif,
        nama: form.nama,
        pic: form.pic || null,
        kontak: form.kontak || null,
      };
      const { data } = initial
        ? await api.put<OperationAgent>(`/operation/agents/${initial.id}`, payload)
        : await api.post<OperationAgent>('/operation/agents', payload);
      onSaved(data);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal menyimpan agen');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg border border-gray-200 bg-card p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">{initial ? 'Edit Agen' : 'Agen Baru'}</h3>
        <p className="mt-0.5 text-xs text-gray-500">Tipe: {tipeAktif}</p>
        {error && <div className="mt-3 alert-error">{error}</div>}
        <div className="mt-3 space-y-3">
          <div>
            <label className="label">Nama Agen *</label>
            <input
              required
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              className="input mt-1 w-full"
            />
          </div>
          <div>
            <label className="label">PIC</label>
            <input
              value={form.pic}
              onChange={(e) => setForm({ ...form, pic: e.target.value })}
              className="input mt-1 w-full"
            />
          </div>
          <div>
            <label className="label">Contact</label>
            <input
              value={form.kontak}
              onChange={(e) => setForm({ ...form, kontak: e.target.value })}
              className="input mt-1 w-full"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Batal
          </button>
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  );
}
