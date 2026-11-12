// client/src/pages/Operation/DataOperation/UnitKapalForm.tsx
// [FUNGSI] Modal tambah/edit unit kapal (TB, BG, owner/operator, contact master).
// [ALASAN] Dipakai halaman Unit Kapal & tombol "+" pada form shipment.

import { FormEvent, useState } from 'react';
import { api } from '../../../api/client';
import { OperationKapal } from '../types';

export default function UnitKapalForm({
  initial,
  onClose,
  onSaved,
}: {
  initial?: OperationKapal | null;
  onClose: () => void;
  onSaved: (unit: OperationKapal) => void;
}) {
  const [form, setForm] = useState({
    tb: initial?.tb ?? '',
    bg: initial?.bg ?? '',
    ownerOperator: initial?.ownerOperator ?? '',
    contactMaster: initial?.contactMaster ?? '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        tb: form.tb,
        bg: form.bg,
        ownerOperator: form.ownerOperator || null,
        contactMaster: form.contactMaster || null,
      };
      const { data } = initial
        ? await api.put<OperationKapal>(`/operation/kapal/${initial.id}`, payload)
        : await api.post<OperationKapal>('/operation/kapal', payload);
      onSaved(data);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal menyimpan unit kapal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg border border-gray-200 bg-card p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">{initial ? 'Edit Unit Kapal' : 'Unit Kapal Baru'}</h3>
        {error && <div className="mt-3 alert-error">{error}</div>}
        <div className="mt-3 space-y-3">
          <div>
            <label className="label">TB *</label>
            <input
              required
              value={form.tb}
              onChange={(e) => setForm({ ...form, tb: e.target.value })}
              className="input mt-1 w-full"
            />
          </div>
          <div>
            <label className="label">BG *</label>
            <input
              required
              value={form.bg}
              onChange={(e) => setForm({ ...form, bg: e.target.value })}
              className="input mt-1 w-full"
            />
          </div>
          <div>
            <label className="label">Barges Owners / Operator</label>
            <input
              value={form.ownerOperator}
              onChange={(e) => setForm({ ...form, ownerOperator: e.target.value })}
              className="input mt-1 w-full"
            />
          </div>
          <div>
            <label className="label">Contact Master / Captain</label>
            <input
              value={form.contactMaster}
              onChange={(e) => setForm({ ...form, contactMaster: e.target.value })}
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
