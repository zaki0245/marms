// client/src/pages/Finance/InputInvoice.tsx
// [FUNGSI] Form input/edit invoice Finance.
// [ALASAN] Input header invoice, faktur pajak multi, pilih vendor+rekening, total otomatis.
// [ALASAN] Field pembayaran (PV, Bank Charge, Balance, Issued Date) diisi di modul Cetak PV.

import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { num, formatUang } from './utils';

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

const emptyForm = {
  kategori: 'FREIGHT',
  tipe: 'REGULAR',
  tanggal: '',
  bupot: '',
  vendorId: '',
  bankAccountId: '',
  inv: '',
  ref: '',
  keterangan: '',
  dpp: '',
  ppn: '',
  pphPasal: '',
  pph: '',
  dueDate: '',
  masaPajakPPN: '',
  masaPajakPPH: '',
  statusFakturPajak: 'BELUM_DITERIMA',
  parentInvoiceId: '',
};

const emptyBank: Bank = { accountNo: '', accountName: '', bank: '' };

export default function InputInvoice() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [parents, setParents] = useState<{ id: string; no: string; inv: string }[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [faktur, setFaktur] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [quick, setQuick] = useState(false);
  const [quickForm, setQuickForm] = useState({ nama: '', npwp: '', alamat: '', banks: [{ ...emptyBank }] });

  async function loadVendors() {
    const { data } = await api.get<Vendor[]>('/finance/vendor');
    setVendors(data);
  }

  async function loadParents() {
    const { data } = await api.get<any[]>('/finance/invoice');
    setParents(data.map((d) => ({ id: d.id, no: d.no, inv: d.inv })));
  }

  useEffect(() => {
    loadVendors().catch(() => undefined);
    loadParents().catch(() => undefined);
    if (id) {
      api
        .get(`/finance/invoice/${id}`)
        .then(({ data }) => {
          setForm({
            kategori: data.kategori,
            tipe: data.tipe,
            tanggal: data.tanggal?.slice(0, 10) ?? '',
            bupot: data.bupot ?? '',
            vendorId: data.vendorId,
            bankAccountId: data.bankAccountId ?? '',
            inv: data.inv,
            ref: data.ref ?? '',
            keterangan: data.keterangan ?? '',
            dpp: data.dpp != null ? String(data.dpp) : '',
            ppn: data.ppn != null ? String(data.ppn) : '',
            pphPasal: data.pphPasal ?? '',
            pph: data.pph != null ? String(data.pph) : '',
            dueDate: data.dueDate?.slice(0, 10) ?? '',
            masaPajakPPN: data.masaPajakPPN ?? '',
            masaPajakPPH: data.masaPajakPPH ?? '',
            statusFakturPajak: data.statusFakturPajak,
            parentInvoiceId: data.parentInvoiceId ?? '',
          });
          setFaktur((data.fakturPajak ?? []).map((f: any) => f.nomor));
        })
        .catch(() => undefined);
    }
  }, [id]);

  function setField(k: keyof typeof emptyForm, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function addFaktur() {
    setFaktur((f) => [...f, '']);
  }
  function setFakturIdx(i: number, v: string) {
    setFaktur((f) => f.map((x, idx) => (idx === i ? v : x)));
  }
  function removeFaktur(i: number) {
    setFaktur((f) => f.filter((_, idx) => idx !== i));
  }

  function setQuickBank(idx: number, field: keyof Bank, value: string) {
    setQuickForm((qf) => ({ ...qf, banks: qf.banks.map((b, i) => (i === idx ? { ...b, [field]: value } : b)) }));
  }
  function addQuickBank() {
    setQuickForm((qf) => ({ ...qf, banks: [...qf.banks, { ...emptyBank }] }));
  }
  function removeQuickBank(idx: number) {
    setQuickForm((qf) => ({ ...qf, banks: qf.banks.filter((_, i) => i !== idx) }));
  }

  const selectedVendor = vendors.find((v) => v.id === form.vendorId);
  const isDp = form.tipe === 'DP';
  const total = num(form.dpp) + num(form.ppn) - num(form.pph);

  async function handleQuickAdd(e: FormEvent) {
    e.preventDefault();
    setError('');
    // [FUNGSI] Bila vendor dengan nama sama sudah ada, langsung pilih vendor tsb.
    const existing = vendors.find((v) => v.nama.toLowerCase() === quickForm.nama.trim().toLowerCase());
    if (existing) {
      setForm((f) => ({ ...f, vendorId: existing.id }));
      setQuick(false);
      setQuickForm({ nama: '', npwp: '', alamat: '', banks: [{ ...emptyBank }] });
      return;
    }
    try {
      const { data } = await api.post('/finance/vendor', {
        nama: quickForm.nama,
        npwp: quickForm.npwp || null,
        alamat: quickForm.alamat || null,
        banks: quickForm.banks.filter((b) => b.accountNo || b.accountName || b.bank),
      });
      setForm((f) => ({ ...f, vendorId: data.id }));
      setQuick(false);
      setQuickForm({ nama: '', npwp: '', alamat: '', banks: [{ ...emptyBank }] });
      loadVendors();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal menambah vendor');
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const money = (v: string) => (v === '' ? null : Number(v));
    const payload = {
      kategori: form.kategori,
      tipe: form.tipe,
      tanggal: form.tanggal,
      bupot: form.bupot || null,
      vendorId: form.vendorId,
      bankAccountId: form.bankAccountId || null,
      inv: form.inv || null,
      ref: form.ref || null,
      keterangan: form.keterangan || null,
      dpp: num(form.dpp),
      ppn: money(form.ppn),
      pphPasal: form.pphPasal || null,
      pph: money(form.pph),
      dueDate: form.dueDate || null,
      masaPajakPPN: form.masaPajakPPN || null,
      masaPajakPPH: form.masaPajakPPH || null,
      statusFakturPajak: form.statusFakturPajak,
      parentInvoiceId: form.parentInvoiceId || null,
      fakturPajak: faktur.filter((n) => n.trim()).map((n) => ({ nomor: n.trim() })),
    };
    try {
      if (id) {
        await api.put(`/finance/invoice/${id}`, payload);
      } else {
        await api.post('/finance/invoice', payload);
      }
      navigate('/admin/finance/invoice');
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal menyimpan');
    }
  }

  const inputCls = 'mt-1 w-full rounded border border-gray-300 px-3 py-2';

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-navy">{id ? 'Edit Invoice' : 'Input Invoice'}</h2>
        <button onClick={() => navigate('/admin/finance/invoice')} className="text-sm text-navy underline">Kembali</button>
      </div>

      {error && <div className="mt-3 rounded bg-negative/10 p-3 text-sm text-negative">{error}</div>}

      <form onSubmit={handleSubmit} className="mt-4 space-y-5">
        {/* Header */}
        <section className="rounded-lg bg-white p-5 shadow-sm">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="block text-xs text-gray-500">Kategori</label>
              <select value={form.kategori} onChange={(e) => setField('kategori', e.target.value)} className={inputCls}>
                <option value="FREIGHT">Freight</option>
                <option value="OPERATION">Operation</option>
                <option value="OTHERS">Others</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500">Tipe</label>
              <select value={form.tipe} onChange={(e) => setField('tipe', e.target.value)} className={inputCls}>
                <option value="REGULAR">Regular</option>
                <option value="DP">DP</option>
                <option value="PELUNASAN">Pelunasan</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500">Tanggal Invoice *</label>
              <input required type="date" value={form.tanggal} onChange={(e) => setField('tanggal', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Bupot</label>
              <input value={form.bupot} onChange={(e) => setField('bupot', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Vendor *</label>
              <div className="flex gap-1">
                <select required value={form.vendorId} onChange={(e) => { setField('vendorId', e.target.value); setField('bankAccountId', ''); }} className={inputCls}>
                  <option value="">Pilih vendor</option>
                  {vendors.map((v) => <option key={v.id} value={v.id}>{v.nama}</option>)}
                </select>
                <button type="button" onClick={() => setQuick(!quick)} className="whitespace-nowrap rounded border border-gray-300 px-2 text-xs text-navy">+ Baru</button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500">INV (nomor invoice)</label>
              <input value={form.inv} onChange={(e) => setField('inv', e.target.value)} placeholder="Opsional" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500">REF</label>
              <input value={form.ref} onChange={(e) => setField('ref', e.target.value)} className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500">Keterangan (TB/BG/voyage)</label>
              <input value={form.keterangan} onChange={(e) => setField('keterangan', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Rekening Bank</label>
              <select value={form.bankAccountId} onChange={(e) => setField('bankAccountId', e.target.value)} className={inputCls}>
                <option value="">Pilih rekening</option>
                {(selectedVendor?.banks ?? []).map((b) => <option key={b.id} value={b.id}>{b.bank} - {b.accountNo}</option>)}
              </select>
            </div>
            {(form.tipe === 'DP' || form.tipe === 'PELUNASAN') && (
              <div>
                <label className="block text-xs text-gray-500">Invoice Induk</label>
                <select value={form.parentInvoiceId} onChange={(e) => setField('parentInvoiceId', e.target.value)} className={inputCls}>
                  <option value="">Pilih invoice induk</option>
                  {parents.map((p) => <option key={p.id} value={p.id}>{p.no} ({p.inv})</option>)}
                </select>
              </div>
            )}
          </div>

          {quick && (
            <div className="mt-3 space-y-2 rounded bg-gray-50 p-3">
              <div className="flex gap-2">
                <input placeholder="Nama vendor *" value={quickForm.nama} onChange={(e) => setQuickForm({ ...quickForm, nama: e.target.value })} className="w-full rounded border border-gray-300 px-3 py-2" />
                <input placeholder="NPWP" value={quickForm.npwp} onChange={(e) => setQuickForm({ ...quickForm, npwp: e.target.value })} className="w-full rounded border border-gray-300 px-3 py-2" />
              </div>
              <input placeholder="Alamat" value={quickForm.alamat} onChange={(e) => setQuickForm({ ...quickForm, alamat: e.target.value })} className="w-full rounded border border-gray-300 px-3 py-2" />
              <p className="text-xs font-semibold text-gray-500">Rekening Bank</p>
              {quickForm.banks.map((b, i) => (
                <div key={i} className="flex gap-2">
                  <input placeholder="Account No" value={b.accountNo} onChange={(e) => setQuickBank(i, 'accountNo', e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2" />
                  <input placeholder="Account Name" value={b.accountName} onChange={(e) => setQuickBank(i, 'accountName', e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2" />
                  <input placeholder="Bank" value={b.bank} onChange={(e) => setQuickBank(i, 'bank', e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2" />
                  <button type="button" onClick={() => removeQuickBank(i)} className="text-negative hover:underline">Hapus</button>
                </div>
              ))}
              <div className="flex gap-2">
                <button type="button" onClick={addQuickBank} className="text-sm text-navy underline">+ Tambah rekening</button>
                <button type="button" onClick={handleQuickAdd} className="rounded bg-navy px-3 py-2 text-sm text-white">Simpan Vendor</button>
              </div>
            </div>
          )}
        </section>

        {/* Nominal */}
        <section className="rounded-lg bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-navy">Nominal</h3>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="block text-xs text-gray-500">DPP *</label>
              <input required type="number" step="0.01" value={form.dpp} onChange={(e) => setField('dpp', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500">PPN {isDp ? '(tidak ada untuk DP)' : ''}</label>
              <input type="number" step="0.01" disabled={isDp} value={isDp ? '' : form.ppn} onChange={(e) => setField('ppn', e.target.value)} className={`${inputCls} disabled:bg-gray-100`} />
            </div>
            <div>
              <label className="block text-xs text-gray-500">PPH Pasal</label>
              <input placeholder="23 / 4(2) / 21" disabled={isDp} value={isDp ? '' : form.pphPasal} onChange={(e) => setField('pphPasal', e.target.value)} className={`${inputCls} disabled:bg-gray-100`} />
            </div>
            <div>
              <label className="block text-xs text-gray-500">PPH {isDp ? '(tidak ada untuk DP)' : ''}</label>
              <input type="number" step="0.01" disabled={isDp} value={isDp ? '' : form.pph} onChange={(e) => setField('pph', e.target.value)} className={`${inputCls} disabled:bg-gray-100`} />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Total (otomatis)</label>
              <div className="mt-1 rounded border border-gray-200 bg-gray-50 px-3 py-2 font-semibold">{formatUang(total)}</div>
            </div>
          </div>
        </section>

        {/* Pajak & tanggal */}
        <section className="rounded-lg bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-navy">Pajak & Tanggal</h3>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="block text-xs text-gray-500">Masa Pajak PPN</label>
              <input placeholder="Januari 2026" value={form.masaPajakPPN} onChange={(e) => setField('masaPajakPPN', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Masa Pajak PPH</label>
              <input placeholder="Januari 2026" value={form.masaPajakPPH} onChange={(e) => setField('masaPajakPPH', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Status Faktur Pajak</label>
              <select value={form.statusFakturPajak} onChange={(e) => setField('statusFakturPajak', e.target.value)} className={inputCls}>
                <option value="SUDAH_DITERIMA">Sudah diterima</option>
                <option value="BELUM_DITERIMA">Belum diterima</option>
                <option value="TIDAK_ADA">Tidak ada</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500">Tanggal Jatuh Tempo</label>
              <input type="date" value={form.dueDate} onChange={(e) => setField('dueDate', e.target.value)} className={inputCls} />
            </div>
          </div>

          <h4 className="mt-4 font-semibold text-navy">Nomor Faktur Pajak</h4>
          {faktur.map((f, i) => (
            <div key={i} className="mt-2 flex gap-2">
              <input value={f} onChange={(e) => setFakturIdx(i, e.target.value)} placeholder="Nomor faktur pajak" className="w-full max-w-sm rounded border border-gray-300 px-3 py-2" />
              <button type="button" onClick={() => removeFaktur(i)} className="text-negative hover:underline">Hapus</button>
            </div>
          ))}
          <button type="button" onClick={addFaktur} className="mt-2 text-sm text-navy underline">+ Tambah faktur pajak</button>
        </section>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => navigate('/admin/finance/invoice')} className="rounded px-4 py-2 text-sm text-gray-500">Batal</button>
          <button type="submit" className="rounded bg-navy px-6 py-2 text-sm font-semibold text-white">Simpan</button>
        </div>
      </form>
    </div>
  );
}
