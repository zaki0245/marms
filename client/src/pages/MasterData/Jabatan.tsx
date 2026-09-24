// client/src/pages/MasterData/Jabatan.tsx
// [FUNGSI] Halaman kelola data jabatan (8 jabatan + gaji pokok).
// [ALASAN] Gaji pokok dari master jabatan menjadi dasar perhitungan payroll.

import { FormEvent, useEffect, useState } from 'react';
import { api, formatRupiah } from '../../api/client';

interface Jabatan {
  kode: string;
  nama: string;
  gajiPokok: number;
}

export default function Jabatan() {
  const [items, setItems] = useState<Jabatan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ kode: '', nama: '', gajiPokok: '' });
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nama: '', gajiPokok: '' });

  // [FUNGSI] Muat daftar jabatan dari backend.
  async function load() {
    try {
      const { data } = await api.get<Jabatan[]>('/master-data/jabatan');
      setItems(data);
    } catch {
      setError('Gagal memuat data jabatan');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/master-data/jabatan', {
        kode: form.kode,
        nama: form.nama,
        gajiPokok: Number(form.gajiPokok),
      });
      setForm({ kode: '', nama: '', gajiPokok: '' });
      setSuccess('Jabatan ditambahkan');
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal menyimpan');
    }
  }

  function startEdit(j: Jabatan) {
    setEditing(j.kode);
    setEditForm({ nama: j.nama, gajiPokok: String(j.gajiPokok) });
  }

  async function handleSaveEdit() {
    setError('');
    setSuccess('');
    try {
      await api.put(`/master-data/jabatan/${editing}`, {
        kode: editing,
        nama: editForm.nama,
        gajiPokok: Number(editForm.gajiPokok),
      });
      setEditing(null);
      setSuccess('Perubahan tersimpan');
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal menyimpan');
    }
  }

  async function handleDelete(kode: string) {
    setError('');
    setSuccess('');
    if (!window.confirm(`Hapus jabatan ${kode}?`)) return;
    try {
      await api.delete(`/master-data/jabatan/${kode}`);
      setSuccess('Jabatan dihapus');
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

      <form onSubmit={handleAdd} className="mb-6 flex flex-wrap items-end gap-2">
        <div>
          <label className="block text-xs text-gray-500">Kode</label>
          <input
            value={form.kode}
            onChange={(e) => setForm({ ...form, kode: e.target.value })}
            className="rounded border border-gray-300 px-2 py-1.5"
            placeholder="MSTR"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500">Nama</label>
          <input
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
            className="rounded border border-gray-300 px-2 py-1.5"
            placeholder="Master"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500">Gaji Pokok</label>
          <input
            type="number"
            value={form.gajiPokok}
            onChange={(e) => setForm({ ...form, gajiPokok: e.target.value })}
            className="rounded border border-gray-300 px-2 py-1.5"
            placeholder="10500000"
          />
        </div>
        <button className="rounded bg-navy px-4 py-1.5 text-sm font-semibold text-white">
          Tambah
        </button>
      </form>

      <table className="w-full border-collapse bg-white text-sm">
        <thead>
          <tr className="bg-navy-light text-left text-navy">
            <th className="px-3 py-2">Kode</th>
            <th className="px-3 py-2">Nama</th>
            <th className="px-3 py-2 text-right">Gaji Pokok</th>
            <th className="px-3 py-2 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {items.map((j) => (
            <tr key={j.kode} className="border-t border-gray-100">
              <td className="px-3 py-2 font-mono">{j.kode}</td>
              {editing === j.kode ? (
                <>
                  <td className="px-3 py-2">
                    <input
                      value={editForm.nama}
                      onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                      className="rounded border border-gray-300 px-2 py-1"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      value={editForm.gajiPokok}
                      onChange={(e) => setEditForm({ ...editForm, gajiPokok: e.target.value })}
                      className="rounded border border-gray-300 px-2 py-1 text-right"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={handleSaveEdit} className="rounded bg-positive px-3 py-1 text-xs text-white">
                      Simpan
                    </button>
                    <button onClick={() => setEditing(null)} className="ml-1 rounded px-3 py-1 text-xs text-gray-500">
                      Batal
                    </button>
                  </td>
                </>
              ) : (
                <>
                  <td className="px-3 py-2">{j.nama}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatRupiah(j.gajiPokok)}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => startEdit(j)} className="text-navy hover:underline">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(j.kode)} className="ml-3 text-negative hover:underline">
                      Hapus
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
