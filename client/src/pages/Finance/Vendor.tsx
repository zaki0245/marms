// client/src/pages/Finance/Vendor.tsx
// [FUNGSI] Halaman master Vendor Finance.
// [ALASAN] Vendor jadi referensi invoice & cetak PV (nama, NPWP, rekening bank).

import { FormEvent, useEffect, useState } from 'react';
import { api } from '../../api/client';
import Pagination, { DEFAULT_PAGE_SIZE } from '../../components/Pagination';

interface Bank {
  id?: string;
  accountNo: string;
  accountName: string;
  bank: string;
}

interface Vendor {
  id: string;
  nama: string;
  npwp?: string | null;
  alamat?: string | null;
  banks: Bank[];
}

interface Form {
  nama: string;
  npwp: string;
  alamat: string;
  banks: Bank[];
}

const emptyForm: Form = { nama: '', npwp: '', alamat: '', banks: [{ accountNo: '', accountName: '', bank: '' }] };

export default function Vendor() {
  const [items, setItems] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);

  async function load() {
    try {
      const { data } = await api.get<Vendor[]>('/finance/vendor');
      setItems(data);
    } catch {
      setError('Gagal memuat data vendor');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // [FUNGSI] Reset halaman saat pencarian berubah.
  useEffect(() => {
    setPage(1);
  }, [search]);

  function setBank(idx: number, field: keyof Bank, value: string) {
    setForm((f) => ({
      ...f,
      banks: f.banks.map((b, i) => (i === idx ? { ...b, [field]: value } : b)),
    }));
  }

  function addBank() {
    setForm((f) => ({ ...f, banks: [...f.banks, { accountNo: '', accountName: '', bank: '' }] }));
  }

  function removeBank(idx: number) {
    setForm((f) => ({ ...f, banks: f.banks.filter((_, i) => i !== idx) }));
  }

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(v: Vendor) {
    setEditingId(v.id);
    setForm({
      nama: v.nama,
      npwp: v.npwp ?? '',
      alamat: v.alamat ?? '',
      banks: v.banks.length ? v.banks.map((b) => ({ accountNo: b.accountNo, accountName: b.accountName, bank: b.bank })) : [{ accountNo: '', accountName: '', bank: '' }],
    });
    setShowForm(true);
  }

  function buildPayload() {
    return {
      nama: form.nama,
      npwp: form.npwp || null,
      alamat: form.alamat || null,
      banks: form.banks.filter((b) => b.accountNo || b.accountName || b.bank),
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (editingId) {
        await api.put(`/finance/vendor/${editingId}`, buildPayload());
        setSuccess('Vendor diperbarui');
      } else {
        await api.post('/finance/vendor', buildPayload());
        setSuccess('Vendor ditambahkan');
      }
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal menyimpan');
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Hapus vendor ini?')) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/finance/vendor/${id}`);
      setSuccess('Vendor dihapus');
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal menghapus');
    }
  }

  if (loading) return <p className="text-gray-500">Memuat...</p>;

  const filtered = items.filter((v) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const bankText = v.banks.map((b) => `${b.bank} ${b.accountNo} ${b.accountName}`).join(' ');
    return [v.nama, v.npwp, bankText].some((x) => x && x.toLowerCase().includes(s));
  });
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <h2 className="text-2xl font-bold text-navy">Vendor</h2>

      {error && <div className="mt-3 rounded bg-negative/10 p-3 text-sm text-negative">{error}</div>}
      {success && <div className="mt-3 rounded bg-positive/10 p-3 text-sm text-positive">{success}</div>}

      <div className="mt-4 flex items-center gap-3">
        <button onClick={openAdd} className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white">
          + Tambah Vendor
        </button>
        <input placeholder="Cari nama / NPWP / bank..." value={search} onChange={(e) => setSearch(e.target.value)} className="rounded border border-gray-300 px-3 py-2 text-sm" />
      </div>

      <table className="mt-4 w-full border-collapse bg-white text-sm">
        <thead>
          <tr className="bg-navy-light text-left text-navy">
            <th className="px-3 py-2">Nama</th>
            <th className="px-3 py-2">NPWP</th>
            <th className="px-3 py-2">Rekening</th>
            <th className="px-3 py-2 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-400">Belum ada vendor.</td></tr>
          )}
          {pageRows.map((v) => (
              <tr key={v.id} className="border-t border-gray-100">
                <td className="px-3 py-2 font-semibold text-navy">{v.nama}</td>
                <td className="px-3 py-2">{v.npwp ?? '-'}</td>
                <td className="px-3 py-2 text-xs text-gray-600">
                  {v.banks.map((b) => `${b.bank} - ${b.accountNo} (${b.accountName})`).join('; ') || '-'}
                </td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => openEdit(v)} className="text-navy hover:underline">Edit</button>
                  <button onClick={() => handleDelete(v.id)} className="ml-3 text-negative hover:underline">Hapus</button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      <Pagination
        page={page}
        pageSize={pageSize}
        total={filtered.length}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
      />

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <form onSubmit={handleSubmit} className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-navy">{editingId ? 'Edit Vendor' : 'Tambah Vendor'}</h3>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500">Nama *</label>
                <input required value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
              </div>
              <div>
                <label className="block text-xs text-gray-500">NPWP</label>
                <input value={form.npwp} onChange={(e) => setForm({ ...form, npwp: e.target.value })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-500">Alamat</label>
                <input value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
              </div>
            </div>

            <h4 className="mt-5 font-semibold text-navy">Rekening Bank</h4>
            {form.banks.map((b, idx) => (
              <div key={idx} className="mt-2 grid grid-cols-12 gap-2">
                <div className="col-span-3">
                  <input placeholder="Account No" value={b.accountNo} onChange={(e) => setBank(idx, 'accountNo', e.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
                </div>
                <div className="col-span-3">
                  <input placeholder="Account Name" value={b.accountName} onChange={(e) => setBank(idx, 'accountName', e.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
                </div>
                <div className="col-span-4">
                  <input placeholder="Bank" value={b.bank} onChange={(e) => setBank(idx, 'bank', e.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
                </div>
                <div className="col-span-2 flex items-end">
                  <button type="button" onClick={() => removeBank(idx)} className="text-negative hover:underline">Hapus</button>
                </div>
              </div>
            ))}
            <button type="button" onClick={addBank} className="mt-2 text-sm text-navy underline">+ Tambah rekening</button>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded px-4 py-2 text-sm text-gray-500">Batal</button>
              <button type="submit" className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white">Simpan</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
