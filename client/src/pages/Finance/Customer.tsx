// client/src/pages/Finance/Customer.tsx
// [FUNGSI] Halaman master Customer Finance.
// [ALASAN] Customer jadi referensi invoice AR & cetak RV (nama, NPWP, rekening bank).

import { FormEvent, useEffect, useState } from 'react';
import { api } from '../../api/client';
import Pagination, { DEFAULT_PAGE_SIZE } from '../../components/Pagination';
import { SortableTh, sortRows, useSort } from '../../components/sortable';

interface Bank {
  id?: string;
  accountNo: string;
  accountName: string;
  bank: string;
}

interface Customer {
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

export default function Customer() {
  const [items, setItems] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const { sort, toggle } = useSort();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);

  async function load() {
    try {
      const { data } = await api.get<Customer[]>('/finance/customer');
      setItems(data);
    } catch {
      setError('Gagal memuat data customer');
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

  // [FUNGSI] Reset halaman saat sorting berubah.
  useEffect(() => {
    setPage(1);
  }, [sort]);

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

  function openEdit(v: Customer) {
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
        await api.put(`/finance/customer/${editingId}`, buildPayload());
        setSuccess('Customer diperbarui');
      } else {
        await api.post('/finance/customer', buildPayload());
        setSuccess('Customer ditambahkan');
      }
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal menyimpan');
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Hapus customer ini?')) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/finance/customer/${id}`);
      setSuccess('Customer dihapus');
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
  const pageRows = sortRows(filtered, sort, {
    nama: (v) => v.nama,
    npwp: (v) => v.npwp,
    rekening: (v) => v.banks.map((b) => `${b.bank} ${b.accountNo} ${b.accountName}`).join('; '),
  }).slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <h1 className="page-title">Customer</h1>

      {error && <div className="mt-3 alert-error">{error}</div>}
      {success && <div className="mt-3 alert-success">{success}</div>}

      <div className="mt-4 flex items-center gap-3">
        <button onClick={openAdd} className="btn-primary">
          + Tambah Customer
        </button>
        <input placeholder="Cari nama / NPWP / bank..." value={search} onChange={(e) => setSearch(e.target.value)} className="input" />
      </div>

      <table className="mt-4 w-full border-collapse bg-card text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500">
            <SortableTh label="Nama" sortKey="nama" sort={sort} onSort={toggle} className="px-3 py-2" />
            <SortableTh label="NPWP" sortKey="npwp" sort={sort} onSort={toggle} className="px-3 py-2" />
            <SortableTh label="Rekening" sortKey="rekening" sort={sort} onSort={toggle} className="px-3 py-2" />
            <th className="px-3 py-2 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-500">Belum ada customer.</td></tr>
          )}
          {pageRows.map((v) => (
              <tr key={v.id} className="border-t border-gray-100">
                <td className="px-3 py-2 font-semibold text-gray-900">{v.nama}</td>
                <td className="px-3 py-2">{v.npwp ?? '-'}</td>
                <td className="px-3 py-2 text-xs text-gray-600">
                  {v.banks.map((b) => `${b.bank} - ${b.accountNo} (${b.accountName})`).join('; ') || '-'}
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex justify-end gap-1.5">
                    <button onClick={() => openEdit(v)} className="rounded-md border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50">Edit</button>
                    <button onClick={() => handleDelete(v.id)} className="rounded-md border border-negative/40 px-2.5 py-1 text-xs text-negative hover:bg-negative/5">Hapus</button>
                  </div>
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
          <form onSubmit={handleSubmit} className="w-full max-w-2xl rounded-lg bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">{editingId ? 'Edit Customer' : 'Tambah Customer'}</h3>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="label">Nama *</label>
                <input required value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="input mt-1 w-full" />
              </div>
              <div>
                <label className="label">NPWP</label>
                <input value={form.npwp} onChange={(e) => setForm({ ...form, npwp: e.target.value })} className="input mt-1 w-full" />
              </div>
              <div className="col-span-2">
                <label className="label">Alamat</label>
                <input value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} className="input mt-1 w-full" />
              </div>
            </div>

            <h4 className="mt-5 font-semibold text-gray-900">Rekening Bank</h4>
            {form.banks.map((b, idx) => (
              <div key={idx} className="mt-2 grid grid-cols-12 gap-2">
                <div className="col-span-3">
                  <input placeholder="Account No" value={b.accountNo} onChange={(e) => setBank(idx, 'accountNo', e.target.value)} className="input mt-1 w-full" />
                </div>
                <div className="col-span-3">
                  <input placeholder="Account Name" value={b.accountName} onChange={(e) => setBank(idx, 'accountName', e.target.value)} className="input mt-1 w-full" />
                </div>
                <div className="col-span-4">
                  <input placeholder="Bank" value={b.bank} onChange={(e) => setBank(idx, 'bank', e.target.value)} className="input mt-1 w-full" />
                </div>
                <div className="col-span-2 flex items-end">
                  <button type="button" onClick={() => removeBank(idx)} className="text-negative hover:text-negative/70">Hapus</button>
                </div>
              </div>
            ))}
            <button type="button" onClick={addBank} className="mt-2 text-sm text-gray-700 underline hover:text-gray-900">+ Tambah rekening</button>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Batal</button>
              <button type="submit" className="btn-primary">Simpan</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
