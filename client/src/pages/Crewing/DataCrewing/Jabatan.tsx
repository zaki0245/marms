// client/src/pages/MasterData/Jabatan.tsx
// [FUNGSI] Halaman kelola data jabatan (8 jabatan + gaji pokok).
// [ALASAN] Gaji pokok dari master jabatan menjadi dasar perhitungan payroll.

import { FormEvent, useEffect, useState } from 'react';
import { api, formatRupiah } from '../../../api/client';
import Pagination, { DEFAULT_PAGE_SIZE } from '../../../components/Pagination';
import { SortableTh, sortRows, useSort } from '../../../components/sortable';

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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const { sort, toggle } = useSort();

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

  // [FUNGSI] Reset halaman saat sorting berubah.
  useEffect(() => {
    setPage(1);
  }, [sort]);

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

  const pageRows = sortRows(items, sort, {
    kode: (j) => j.kode,
    nama: (j) => j.nama,
    gajiPokok: (j) => j.gajiPokok,
  }).slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      {error && (
        <div className="alert-error mb-3">{error}</div>
      )}
      {success && (
        <div className="alert-success mb-3">{success}</div>
      )}

      <form onSubmit={handleAdd} className="mb-6 flex flex-wrap items-end gap-2">
        <div>
          <label className="label">Kode</label>
          <input
            value={form.kode}
            onChange={(e) => setForm({ ...form, kode: e.target.value })}
            className="input px-2 py-1.5"
            placeholder="MSTR"
          />
        </div>
        <div>
          <label className="label">Nama</label>
          <input
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
            className="input px-2 py-1.5"
            placeholder="Master"
          />
        </div>
        <div>
          <label className="label">Gaji Pokok</label>
          <input
            type="number"
            value={form.gajiPokok}
            onChange={(e) => setForm({ ...form, gajiPokok: e.target.value })}
            className="input px-2 py-1.5"
            placeholder="10500000"
          />
        </div>
        <button className="btn-primary py-1.5">
          Tambah
        </button>
      </form>

      <table className="w-full border-collapse bg-card text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500">
            <SortableTh label="Kode" sortKey="kode" sort={sort} onSort={toggle} className="px-3 py-2" />
            <SortableTh label="Nama" sortKey="nama" sort={sort} onSort={toggle} className="px-3 py-2" />
            <SortableTh label="Gaji Pokok" sortKey="gajiPokok" sort={sort} onSort={toggle} className="px-3 py-2 text-right" />
            <th className="px-3 py-2 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {pageRows.map((j) => (
            <tr key={j.kode} className="border-t border-gray-100">
              <td className="px-3 py-2 font-mono">{j.kode}</td>
              {editing === j.kode ? (
                <>
                  <td className="px-3 py-2">
                      <input
                        value={editForm.nama}
                        onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                        className="input px-2 py-1"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        value={editForm.gajiPokok}
                        onChange={(e) => setEditForm({ ...editForm, gajiPokok: e.target.value })}
                        className="input px-2 py-1 text-right"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={handleSaveEdit} className="rounded-md bg-navy px-3 py-1 text-xs font-medium text-white">
                        Simpan
                      </button>
                      <button onClick={() => setEditing(null)} className="ml-1 rounded-md px-3 py-1 text-xs text-gray-600 hover:bg-gray-100">
                        Batal
                      </button>
                    </td>
                </>
              ) : (
                <>
                  <td className="px-3 py-2">{j.nama}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatRupiah(j.gajiPokok)}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => startEdit(j)} className="text-gray-700 hover:text-gray-900">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(j.kode)} className="ml-3 text-negative hover:text-negative/70">
                      Hapus
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination
        page={page}
        pageSize={pageSize}
        total={items.length}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
      />
    </div>
  );
}
