// client/src/pages/MasterData/Kapal.tsx
// [FUNGSI] Halaman kelola data kapal (unit TB + BG).
// [ALASAN] Kapal jadi dasar penempatan crew & perhitungan payroll per kapal.

import { FormEvent, useEffect, useState } from 'react';
import { api } from '../../api/client';

interface Kapal {
  id: string;
  namaUnit: string;
  status: string;
  tbNama: string;
  tbImo?: string | null;
  tbGt?: number | null;
  tbTahun?: number | null;
  bgNama: string;
  bgImo?: string | null;
  bgGt?: number | null;
  bgTahun?: number | null;
}

interface KapalForm {
  namaUnit: string;
  status: string;
  tbNama: string;
  tbImo: string;
  tbGt: string;
  tbTahun: string;
  bgNama: string;
  bgImo: string;
  bgGt: string;
  bgTahun: string;
}

const emptyForm: KapalForm = {
  namaUnit: '',
  status: 'AKTIF',
  tbNama: '',
  tbImo: '',
  tbGt: '',
  tbTahun: '',
  bgNama: '',
  bgImo: '',
  bgGt: '',
  bgTahun: '',
};

const STATUS_LABEL: Record<string, string> = {
  AKTIF: 'Aktif',
  DOCKING: 'Docking',
};

export default function Kapal() {
  const [items, setItems] = useState<Kapal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<KapalForm>(emptyForm);

  async function load() {
    try {
      const { data } = await api.get<Kapal[]>('/master-data/kapal');
      setItems(data);
    } catch {
      setError('Gagal memuat data kapal');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function setField(field: keyof KapalForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(k: Kapal) {
    setEditingId(k.id);
    setForm({
      namaUnit: k.namaUnit,
      status: k.status,
      tbNama: k.tbNama,
      tbImo: k.tbImo ?? '',
      tbGt: k.tbGt ? String(k.tbGt) : '',
      tbTahun: k.tbTahun ? String(k.tbTahun) : '',
      bgNama: k.bgNama,
      bgImo: k.bgImo ?? '',
      bgGt: k.bgGt ? String(k.bgGt) : '',
      bgTahun: k.bgTahun ? String(k.bgTahun) : '',
    });
    setShowForm(true);
  }

  // [FUNGSI] Susun payload yang dikirim ke backend (angka/null untuk field opsional).
  function buildPayload() {
    return {
      namaUnit: form.namaUnit,
      status: form.status,
      tbNama: form.tbNama,
      tbImo: form.tbImo || null,
      tbGt: form.tbGt ? Number(form.tbGt) : null,
      tbTahun: form.tbTahun ? Number(form.tbTahun) : null,
      bgNama: form.bgNama,
      bgImo: form.bgImo || null,
      bgGt: form.bgGt ? Number(form.bgGt) : null,
      bgTahun: form.bgTahun ? Number(form.bgTahun) : null,
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (editingId) {
        await api.put(`/master-data/kapal/${editingId}`, buildPayload());
        setSuccess('Kapal diperbarui');
      } else {
        await api.post('/master-data/kapal', buildPayload());
        setSuccess('Kapal ditambahkan');
      }
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal menyimpan');
    }
  }

  async function handleDelete(id: string) {
    setError('');
    setSuccess('');
    if (!window.confirm('Hapus kapal ini?')) return;
    try {
      await api.delete(`/master-data/kapal/${id}`);
      setSuccess('Kapal dihapus');
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal menghapus');
    }
  }

  if (loading) return <p className="text-gray-500">Memuat...</p>;

  return (
    <div>
      {error && (
        <div className="mb-3 rounded bg-negative/10 p-3 text-sm text-negative">{error}</div>
      )}
      {success && (
        <div className="mb-3 rounded bg-positive/10 p-3 text-sm text-positive">{success}</div>
      )}

      <button onClick={openAdd} className="mb-4 rounded bg-navy px-4 py-2 text-sm font-semibold text-white">
        + Tambah Kapal
      </button>

      <table className="w-full border-collapse bg-white text-sm">
        <thead>
          <tr className="bg-navy-light text-left text-navy">
            <th className="px-3 py-2">Unit</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Tugboat (TB)</th>
            <th className="px-3 py-2">Barge (BG)</th>
            <th className="px-3 py-2 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={5} className="px-3 py-6 text-center text-gray-400">
                Belum ada kapal. Klik "+ Tambah Kapal".
              </td>
            </tr>
          )}
          {items.map((k) => (
            <tr key={k.id} className="border-t border-gray-100">
              <td className="px-3 py-2 font-semibold text-navy">{k.namaUnit}</td>
              <td className="px-3 py-2">
                <span className={`rounded px-2 py-0.5 text-xs ${k.status === 'AKTIF' ? 'bg-positive/10 text-positive' : 'bg-gray-200 text-gray-600'}`}>
                  {STATUS_LABEL[k.status] ?? k.status}
                </span>
              </td>
              <td className="px-3 py-2">{k.tbNama}</td>
              <td className="px-3 py-2">{k.bgNama}</td>
              <td className="px-3 py-2 text-right">
                <button onClick={() => openEdit(k)} className="text-navy hover:underline">Edit</button>
                <button onClick={() => handleDelete(k.id)} className="ml-3 text-negative hover:underline">Hapus</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal form tambah/edit */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <form onSubmit={handleSubmit} className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-navy">
              {editingId ? 'Edit Kapal' : 'Tambah Kapal'}
            </h3>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-gray-500">Nama Unit</label>
                <input
                  value={form.namaUnit}
                  onChange={(e) => setField('namaUnit', e.target.value)}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-500">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setField('status', e.target.value)}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                >
                  <option value="AKTIF">Aktif</option>
                  <option value="DOCKING">Docking</option>
                </select>
              </div>
            </div>

            {/* Tugboat */}
            <h4 className="mt-5 font-semibold text-navy">Tugboat (TB)</h4>
            <div className="mt-2 grid grid-cols-4 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-gray-500">Nama</label>
                <input value={form.tbNama} onChange={(e) => setField('tbNama', e.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
              </div>
              <div>
                <label className="block text-xs text-gray-500">IMO</label>
                <input value={form.tbImo} onChange={(e) => setField('tbImo', e.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Tahun</label>
                <input type="number" value={form.tbTahun} onChange={(e) => setField('tbTahun', e.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
              </div>
              <div>
                <label className="block text-xs text-gray-500">GT</label>
                <input type="number" value={form.tbGt} onChange={(e) => setField('tbGt', e.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
              </div>
            </div>

            {/* Barge */}
            <h4 className="mt-5 font-semibold text-navy">Barge (BG)</h4>
            <div className="mt-2 grid grid-cols-4 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-gray-500">Nama</label>
                <input value={form.bgNama} onChange={(e) => setField('bgNama', e.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
              </div>
              <div>
                <label className="block text-xs text-gray-500">IMO</label>
                <input value={form.bgImo} onChange={(e) => setField('bgImo', e.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Tahun</label>
                <input type="number" value={form.bgTahun} onChange={(e) => setField('bgTahun', e.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
              </div>
              <div>
                <label className="block text-xs text-gray-500">GT</label>
                <input type="number" value={form.bgGt} onChange={(e) => setField('bgGt', e.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded px-4 py-2 text-sm text-gray-500"
              >
                Batal
              </button>
              <button type="submit" className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white">
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
