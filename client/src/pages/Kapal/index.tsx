// client/src/pages/Kapal/index.tsx
// [FUNGSI] Halaman kelola data kapal (unit TB + BG).
// [ALASAN] Kapal jadi dasar penempatan crew & perhitungan payroll per kapal.

import { FormEvent, useEffect, useState } from 'react';
import { api } from '../../api/client';
import Pagination, { DEFAULT_PAGE_SIZE } from '../../components/Pagination';
import { SortableTh, sortRows, useSort } from '../../components/sortable';

interface Kapal {
  id: string;
  namaUnit: string;
  skema: 'MILIK' | 'SEWA';
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
  skema: string;
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
  skema: 'MILIK',
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
  TIDAK_AKTIF: 'TIDAK AKTIF',
};

const SKEMA_LABEL: Record<string, string> = {
  MILIK: 'Milik',
  SEWA: 'Sewa',
};

export default function Kapal() {
  const [items, setItems] = useState<Kapal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<KapalForm>(emptyForm);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const { sort, toggle } = useSort();

  async function load() {
    try {
      const { data } = await api.get<Kapal[]>('/kapal');
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

  // [FUNGSI] Reset halaman saat sorting berubah.
  useEffect(() => {
    setPage(1);
  }, [sort]);

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
      skema: k.skema,
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
      skema: form.skema,
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
        await api.put(`/kapal/${editingId}`, buildPayload());
        setSuccess('Kapal diperbarui');
      } else {
        await api.post('/kapal', buildPayload());
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
      await api.delete(`/kapal/${id}`);
      setSuccess('Kapal dihapus');
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal menghapus');
    }
  }

  if (loading) return <p className="text-gray-500">Memuat...</p>;

  const pageRows = sortRows(items, sort, {
    unit: (k) => k.namaUnit,
    skema: (k) => SKEMA_LABEL[k.skema] ?? k.skema,
    status: (k) => STATUS_LABEL[k.status] ?? k.status,
    tb: (k) => k.tbNama,
    bg: (k) => k.bgNama,
  }).slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      {error && (
        <div className="mb-3 alert-error">{error}</div>
      )}
      {success && (
        <div className="mb-3 alert-success">{success}</div>
      )}

      <button onClick={openAdd} className="mb-4 btn-primary">
        + Tambah Kapal
      </button>

      <table className="w-full border-collapse bg-card text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500">
            <SortableTh label="Unit" sortKey="unit" sort={sort} onSort={toggle} className="px-3 py-2" />
            <SortableTh label="Skema" sortKey="skema" sort={sort} onSort={toggle} className="px-3 py-2" />
            <SortableTh label="Status" sortKey="status" sort={sort} onSort={toggle} className="px-3 py-2" />
            <SortableTh label="Tugboat (TB)" sortKey="tb" sort={sort} onSort={toggle} className="px-3 py-2" />
            <SortableTh label="Barge (BG)" sortKey="bg" sort={sort} onSort={toggle} className="px-3 py-2" />
            <th className="px-3 py-2 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                Belum ada kapal. Klik "+ Tambah Kapal".
              </td>
            </tr>
          )}
          {pageRows.map((k) => (
            <tr key={k.id} className="border-t border-gray-100">
              <td className="px-3 py-2 font-semibold text-gray-900">{k.namaUnit}</td>
              <td className="px-3 py-2">
                <span className={`rounded px-2 py-0.5 text-xs ${k.skema === 'MILIK' ? 'bg-navy/10 text-navy' : 'bg-amber-100 text-amber-700'}`}>
                  {SKEMA_LABEL[k.skema] ?? k.skema}
                </span>
              </td>
              <td className="px-3 py-2">
                <span className={`rounded px-2 py-0.5 text-xs ${
                  k.status === 'AKTIF'
                    ? 'bg-positive/10 text-positive'
                    : k.status === 'TIDAK_AKTIF'
                    ? 'bg-negative/10 text-negative'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {STATUS_LABEL[k.status] ?? k.status}
                </span>
              </td>
              <td className="px-3 py-2">{k.tbNama}</td>
              <td className="px-3 py-2">{k.bgNama}</td>
              <td className="px-3 py-2 text-right">
                <button onClick={() => openEdit(k)} className="text-gray-700 hover:text-gray-900">Edit</button>
                <button onClick={() => handleDelete(k.id)} className="ml-3 text-negative hover:text-negative/70">Hapus</button>
              </td>
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

      {/* Modal form tambah/edit */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <form onSubmit={handleSubmit} className="w-full max-w-2xl rounded-lg bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingId ? 'Edit Kapal' : 'Tambah Kapal'}
            </h3>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label">Nama Unit</label>
                <input
                  value={form.namaUnit}
                  onChange={(e) => setField('namaUnit', e.target.value)}
                  className="input mt-1 w-full"
                />
              </div>
              <div className="col-span-2">
                <label className="label">Skema</label>
                <select
                  value={form.skema}
                  onChange={(e) => setField('skema', e.target.value)}
                  className="input mt-1 w-full"
                >
                  <option value="MILIK">Milik</option>
                  <option value="SEWA">Sewa</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setField('status', e.target.value)}
                  className="input mt-1 w-full"
                >
                  <option value="AKTIF">Aktif</option>
                  <option value="DOCKING">Docking</option>
                  <option value="TIDAK_AKTIF">TIDAK AKTIF</option>
                </select>
              </div>
            </div>

            {/* Tugboat */}
            <h4 className="mt-5 font-semibold text-gray-900">Tugboat (TB)</h4>
            <div className="mt-2 grid grid-cols-4 gap-3">
              <div className="col-span-2">
                <label className="label">Nama</label>
                <input value={form.tbNama} onChange={(e) => setField('tbNama', e.target.value)} className="input mt-1 w-full" />
              </div>
              <div>
                <label className="label">IMO</label>
                <input value={form.tbImo} onChange={(e) => setField('tbImo', e.target.value)} className="input mt-1 w-full" />
              </div>
              <div>
                <label className="label">Tahun</label>
                <input type="number" value={form.tbTahun} onChange={(e) => setField('tbTahun', e.target.value)} className="input mt-1 w-full" />
              </div>
              <div>
                <label className="label">GT</label>
                <input type="number" value={form.tbGt} onChange={(e) => setField('tbGt', e.target.value)} className="input mt-1 w-full" />
              </div>
            </div>

            {/* Barge */}
            <h4 className="mt-5 font-semibold text-gray-900">Barge (BG)</h4>
            <div className="mt-2 grid grid-cols-4 gap-3">
              <div className="col-span-2">
                <label className="label">Nama</label>
                <input value={form.bgNama} onChange={(e) => setField('bgNama', e.target.value)} className="input mt-1 w-full" />
              </div>
              <div>
                <label className="label">IMO</label>
                <input value={form.bgImo} onChange={(e) => setField('bgImo', e.target.value)} className="input mt-1 w-full" />
              </div>
              <div>
                <label className="label">Tahun</label>
                <input type="number" value={form.bgTahun} onChange={(e) => setField('bgTahun', e.target.value)} className="input mt-1 w-full" />
              </div>
              <div>
                <label className="label">GT</label>
                <input type="number" value={form.bgGt} onChange={(e) => setField('bgGt', e.target.value)} className="input mt-1 w-full" />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-ghost"
              >
                Batal
              </button>
              <button type="submit" className="btn-primary">
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
