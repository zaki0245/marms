// client/src/pages/Finance/CetakPv.tsx
// [FUNGSI] Modul Cetak PV: kelola Payment Voucher (bisa membayar banyak invoice) lalu cetak PDF.
// [ALASAN] Satu PV = satu pembayaran ke satu vendor, bisa menampung banyak invoice.

import { FormEvent, useEffect, useState } from 'react';
import { api } from '../../api/client';
import { num, formatUang } from './utils';
import { cetakPV } from '../../utils/pvPrint';

interface Bank { id?: string; accountNo: string; accountName: string; bank: string; }
interface Vendor { id: string; nama: string; alamat?: string | null; banks: Bank[]; }
interface Invoice {
  id: string; no: string; vendorId: string; vendorName: string; inv: string | null;
  ref: string | null; dpp: string; ppn: string | null; pphPasal: string | null; pph: string | null;
  total: string; statusPembayaran: string;
  pvItems: { nominal: string }[];
}
interface Pv {
  id: string; pvNo: string; tanggal: string; vendorId: string; vendorName: string; vendorAlamat: string | null;
  bankAccountNo: string | null; bankAccountName: string | null; bank: string | null; chequeNo: string | null;
  issuedDate: string | null; bankCharge: string | null; balance: string | null; keterangan: string | null;
  items: { id: string; invoiceId: string; nominal: string; includeTax: boolean; invoice: Invoice }[];
}

interface FormItem { invoiceId: string; nominal: string; includeTax: boolean; }

interface Form {
  pvNo: string; tanggal: string; vendorId: string; bankAccountId: string;
  chequeNo: string; issuedDate: string; bankCharge: string; balance: string; keterangan: string;
  items: FormItem[];
}

const emptyForm = (): Form => ({
  pvNo: '', tanggal: '', vendorId: '', bankAccountId: '',
  chequeNo: '', issuedDate: '', bankCharge: '', balance: '', keterangan: '',
  items: [],
});

export default function CetakPv() {
  const [pvs, setPvs] = useState<Pv[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [konfigurasi, setKonfigurasi] = useState<any>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [p, v, i] = await Promise.all([
        api.get<Pv[]>('/finance/pv'),
        api.get<Vendor[]>('/finance/vendor'),
        api.get<Invoice[]>('/finance/invoice'),
      ]);
      setPvs(p.data);
      setVendors(v.data);
      setInvoices(i.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    api.get('/finance/konfigurasi').then(({ data }) => setKonfigurasi(data)).catch(() => undefined);
  }, []);

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm());
    setError('');
    setMsg('');
  }

  function openEdit(pv: Pv) {
    setEditingId(pv.id);
    setForm({
      pvNo: pv.pvNo,
      tanggal: pv.tanggal?.slice(0, 10) ?? '',
      vendorId: pv.vendorId,
      bankAccountId: '',
      chequeNo: pv.chequeNo ?? '',
      issuedDate: pv.issuedDate?.slice(0, 10) ?? '',
      bankCharge: pv.bankCharge != null ? String(pv.bankCharge) : '',
      balance: pv.balance != null ? String(pv.balance) : '',
      keterangan: pv.keterangan ?? '',
      items: pv.items.map((it) => ({ invoiceId: it.invoiceId, nominal: String(it.nominal), includeTax: it.includeTax ?? false })),
    });
    setError('');
    setMsg('');
  }

  function setF(field: keyof Form, value: string) {
    setForm((f) => (f ? { ...f, [field]: value } : f));
  }

  function setItem(idx: number, field: keyof FormItem, value: string) {
    setForm((f) => {
      if (!f) return f;
      const items = f.items.map((it, i) => (i === idx ? { ...it, [field]: value } : it));
      return { ...f, items };
    });
  }

  function addItem() {
    setForm((f) => (f ? { ...f, items: [...f.items, { invoiceId: '', nominal: '', includeTax: false }] } : f));
  }

  function toggleIncludeTax(idx: number) {
    setForm((f) => {
      if (!f) return f;
      const items = f.items.map((it, i) => (i === idx ? { ...it, includeTax: !it.includeTax } : it));
      return { ...f, items };
    });
  }

  function removeItem(idx: number) {
    setForm((f) => (f ? { ...f, items: f.items.filter((_, i) => i !== idx) } : f));
  }

  const selectedVendor = vendors.find((v) => v.id === form?.vendorId);

  async function submitForm(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setError('');
    setMsg('');
    const payload = {
      pvNo: form.pvNo,
      tanggal: form.tanggal,
      vendorId: form.vendorId,
      bankAccountId: form.bankAccountId || null,
      chequeNo: form.chequeNo || null,
      issuedDate: form.issuedDate || null,
      bankCharge: form.bankCharge === '' ? null : Number(form.bankCharge),
      balance: form.balance === '' ? null : Number(form.balance),
      keterangan: form.keterangan || null,
      items: form.items
        .filter((it) => it.invoiceId)
        .map((it) => ({ invoiceId: it.invoiceId, nominal: num(it.nominal), includeTax: it.includeTax })),
    };
    try {
      if (editingId) {
        await api.put(`/finance/pv/${editingId}`, payload);
        setMsg('PV diperbarui');
      } else {
        await api.post('/finance/pv', payload);
        setMsg('PV ditambahkan');
      }
      setForm(null);
      setEditingId(null);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal menyimpan');
    }
  }

  async function deletePv(id: string) {
    if (!window.confirm('Hapus PV ini?')) return;
    setError('');
    setMsg('');
    try {
      await api.delete(`/finance/pv/${id}`);
      setMsg('PV dihapus');
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal menghapus');
    }
  }

  function handleCetak(pv: Pv) {
    cetakPV({
      konfigurasi,
      pvNo: pv.pvNo,
      payTo: pv.vendorName,
      vendorAlamat: pv.vendorAlamat ?? '',
      tanggal: pv.tanggal?.slice(0, 10) ?? '',
      keterangan: pv.keterangan ?? '',
      bankAccountNo: pv.bankAccountNo ?? '',
      bankAccountName: pv.bankAccountName ?? '',
      bank: pv.bank ?? '',
      chequeNo: pv.chequeNo ?? 'Online Banking',
      issuedDate: pv.issuedDate?.slice(0, 10) ?? '',
      bankCharge: num(pv.bankCharge),
      balance: num(pv.balance),
      invoices: pv.items.map((it) => ({
        inv: it.invoice.inv,
        ref: it.invoice.ref,
        dpp: num(it.nominal),
        ppn: it.invoice.ppn,
        pphPasal: it.invoice.pphPasal,
        pph: it.invoice.pph,
        includeTax: it.includeTax ?? false,
      })),
    });
  }

  const pvTotal = (pv: Pv) =>
    pv.items.reduce(
      (s, it) => s + num(it.nominal) + (it.includeTax ? num(it.invoice.ppn) - num(it.invoice.pph) : 0),
      0,
    ) + num(pv.bankCharge) + num(pv.balance);

  const inputCls = 'mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm';

  const filteredPvs = pvs.filter((pv) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return [pv.pvNo, pv.vendorName, ...pv.items.map((it) => it.invoice.inv)].some((v) => v && v.toLowerCase().includes(s));
  });

  return (
    <div>
      <h2 className="text-2xl font-bold text-navy">Cetak PV</h2>
      <p className="mt-1 text-sm text-gray-500">Kelola Payment Voucher (bisa membayar banyak invoice) lalu cetak PDF.</p>

      <div className="mt-3 flex items-center gap-3">
        <button onClick={openAdd} className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white">+ Tambah PV</button>
        <input placeholder="Cari PV / vendor / INV..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-72 rounded border border-gray-300 px-3 py-2 text-sm" />
      </div>

      {msg && <div className="mt-3 rounded bg-positive/10 p-3 text-sm text-positive">{msg}</div>}
      {error && <div className="mt-3 rounded bg-negative/10 p-3 text-sm text-negative">{error}</div>}

      {loading && <p className="mt-4 text-gray-500">Memuat...</p>}
      {!loading && filteredPvs.length === 0 && <p className="mt-4 text-gray-400">Belum ada PV.</p>}

      {!loading && filteredPvs.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-lg bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-navy-light text-navy">
              <tr>
                <th className="px-3 py-2">PV No</th>
                <th className="px-3 py-2">Tanggal</th>
                <th className="px-3 py-2">Vendor</th>
                <th className="px-3 py-2 text-right">Total</th>
                <th className="px-3 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredPvs.map((pv) => (
                <tr key={pv.id} className="border-t border-gray-100">
                  <td className="px-3 py-2 font-semibold text-navy">{pv.pvNo}</td>
                  <td className="px-3 py-2">{pv.tanggal?.slice(0, 10)}</td>
                  <td className="px-3 py-2">
                    <div>{pv.vendorName}</div>
                    <div className="text-xs text-gray-500">{pv.items.map((it) => it.invoice.inv ?? '-').join(', ')}</div>
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">{formatUang(pvTotal(pv))}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <button onClick={() => handleCetak(pv)} className="text-navy hover:underline">Cetak</button>
                    <button onClick={() => openEdit(pv)} className="ml-3 text-navy hover:underline">Edit</button>
                    <button onClick={() => deletePv(pv.id)} className="ml-3 text-negative hover:underline">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <form onSubmit={submitForm} className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-navy">{editingId ? 'Edit PV' : 'Tambah PV'}</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500">Nomor PV *</label>
                <input required value={form.pvNo} onChange={(e) => setF('pvNo', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Tanggal *</label>
                <input required type="date" value={form.tanggal} onChange={(e) => setF('tanggal', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Vendor *</label>
                <select required value={form.vendorId} onChange={(e) => { setF('vendorId', e.target.value); setF('bankAccountId', ''); }} className={inputCls}>
                  <option value="">Pilih vendor</option>
                  {vendors.map((v) => <option key={v.id} value={v.id}>{v.nama}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500">Rekening Bank</label>
                <select value={form.bankAccountId} onChange={(e) => setF('bankAccountId', e.target.value)} className={inputCls}>
                  <option value="">Pilih rekening</option>
                  {(selectedVendor?.banks ?? []).map((b) => <option key={b.id} value={b.id}>{b.bank} - {b.accountNo}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500">Bank Charge</label>
                <input type="number" step="0.01" value={form.bankCharge} onChange={(e) => setF('bankCharge', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Balance</label>
                <input type="number" step="0.01" value={form.balance} onChange={(e) => setF('balance', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Issued Date</label>
                <input type="date" value={form.issuedDate} onChange={(e) => setF('issuedDate', e.target.value)} className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-500">Keterangan</label>
                <input value={form.keterangan} onChange={(e) => setF('keterangan', e.target.value)} className={inputCls} />
              </div>
            </div>

            <h4 className="mt-5 font-semibold text-navy">Invoice yang dibayar</h4>
            {form.items.map((item, idx) => {
              const options = invoices.filter((i) =>
                i.vendorId === form.vendorId &&
                (i.id === item.invoiceId || !form.items.some((o, j) => j !== idx && o.invoiceId === i.id)),
              );
              const selectedInvoice = invoices.find((i) => i.id === item.invoiceId);
              return (
                <div key={idx} className="mt-2 rounded border border-gray-100 bg-gray-50 p-2">
                  <div className="flex items-center gap-2">
                    <select value={item.invoiceId} onChange={(e) => setItem(idx, 'invoiceId', e.target.value)} className={`${inputCls} flex-1`}>
                      <option value="">Pilih invoice</option>
                      {options.map((i) => (
                        <option key={i.id} value={i.id}>{i.inv ?? 'Tanpa no. invoice'} — {i.ref ?? '-'} — {formatUang(i.total)}</option>
                      ))}
                    </select>
                    <input type="number" step="0.01" placeholder="DPP" value={item.nominal} onChange={(e) => setItem(idx, 'nominal', e.target.value)} className={`${inputCls} w-40`} />
                    <label className="flex items-center gap-1 whitespace-nowrap text-xs text-gray-600">
                      <input type="checkbox" checked={item.includeTax} onChange={() => toggleIncludeTax(idx)} />
                      Bayar PPN/PPH
                    </label>
                    <button type="button" onClick={() => removeItem(idx)} className="text-negative hover:underline">Hapus</button>
                  </div>
                  {selectedInvoice && (
                    <div className="mt-2 text-xs text-gray-500">
                      INV: {selectedInvoice.inv ?? '-'} · REF: {selectedInvoice.ref ?? '-'} · DPP: {formatUang(selectedInvoice.dpp)} · PPN: {selectedInvoice.ppn ? formatUang(selectedInvoice.ppn) : '-'} · PPH: {selectedInvoice.pph ? formatUang(selectedInvoice.pph) : '-'} · Total: {formatUang(selectedInvoice.total)}
                    </div>
                  )}
                </div>
              );
            })}
            <button type="button" onClick={addItem} className="mt-2 text-sm text-navy underline">+ Tambah invoice</button>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setForm(null)} className="rounded px-4 py-2 text-sm text-gray-500">Batal</button>
              <button type="submit" className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white">Simpan</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
