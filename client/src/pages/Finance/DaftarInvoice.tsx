// client/src/pages/Finance/DaftarInvoice.tsx
// [FUNGSI] Halaman daftar invoice Finance (tab AR/AP, filter status/approval/bulan/tahun, export Excel, hapus, edit).
// [ALASAN] Rekap & kelola record invoice AR dan AP.

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { exportExcel } from '../../utils/export';
import { formatUang, formatDecimal3 } from './utils';

interface Invoice {
  id: string;
  no: string;
  jenis: string;
  kategori: string;
  tanggal: string;
  vendorName: string | null;
  customerName: string | null;
  inv: string | null;
  cargoQuantity: string | null;
  unitPrice: string | null;
  dpp: string;
  ppn: string | null;
  pph: string | null;
  total: string;
  statusPembayaran: string;
  statusFakturPajak: string;
  incomplete: boolean;
  approvalStatus: string;
  approvalSentAt: string | null;
}

const STATUS_FAKTUR: Record<string, string> = { SUDAH_DITERIMA: 'Diterima', BELUM_DITERIMA: 'Belum diterima', TIDAK_ADA: 'Tidak ada' };
const STATUS_BAYAR_AP: Record<string, string> = { BELUM_BAYAR: 'Belum bayar', SEBAGIAN: 'Sebagian', LUNAS: 'Lunas' };
const STATUS_BAYAR_AR: Record<string, string> = { BELUM_BAYAR: 'Belum diterima', SEBAGIAN: 'Diterima sebagian', LUNAS: 'Lunas' };
const KATEGORI: Record<string, string> = { FREIGHT: 'Freight', OPERATION: 'Operation', OTHERS: 'Others' };
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function DaftarInvoice() {
  const navigate = useNavigate();
  const [jenis, setJenis] = useState<'AP' | 'AR'>('AP');
  const [items, setItems] = useState<Invoice[]>([]);
  const [filter, setFilter] = useState('SEMUA');
  const [approval, setApproval] = useState('SEMUA');
  const [kategori, setKategori] = useState<string[]>([]);
  const [bulan, setBulan] = useState('');
  const [tahun, setTahun] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get<Invoice[]>('/finance/invoice', { params: { jenis } });
      setItems(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [jenis]);

  async function handleDelete(id: string) {
    if (!window.confirm('Hapus invoice ini?')) return;
    setError('');
    try {
      await api.delete(`/finance/invoice/${id}`);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal menghapus');
    }
  }

  async function sendApproval(id: string) {
    if (!window.confirm('Kirim email approval untuk invoice ini?')) return;
    setError('');
    try {
      await api.post(`/finance/invoice/${id}/send-approval`);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal mengirim email');
    }
  }

  const statusLabel = (s: string) => (jenis === 'AR' ? STATUS_BAYAR_AR[s] : STATUS_BAYAR_AP[s]) ?? s;

  function toggleKategori(k: string) {
    setKategori((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  }

  const years = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => { if (i.tanggal) set.add(String(new Date(i.tanggal).getFullYear())); });
    return Array.from(set).sort().reverse();
  }, [items]);

  const filtered = items.filter((i) => {
    if (search) {
      const s = search.toLowerCase();
      if (![i.no, i.vendorName, i.customerName, i.inv].some((v) => v && v.toLowerCase().includes(s))) return false;
    }
    if (filter !== 'SEMUA' && i.statusPembayaran !== filter) return false;
    if (jenis === 'AP' && approval !== 'SEMUA' && i.approvalStatus !== approval) return false;
    if (kategori.length && !kategori.includes(i.kategori)) return false;
    if (bulan || tahun) {
      const d = new Date(i.tanggal);
      if (bulan && d.getMonth() + 1 !== Number(bulan)) return false;
      if (tahun && d.getFullYear() !== Number(tahun)) return false;
    }
    return true;
  });

  function doExport() {
    const columns = jenis === 'AP'
      ? ['No Invoice', 'Tanggal', 'Vendor', 'INV', 'Kategori', 'DPP', 'PPN', 'PPH', 'Total', 'Status Faktur', 'Status Pembayaran', 'Approval']
      : ['No Invoice', 'Tanggal', 'Customer', 'INV', 'Kategori', 'Cargo Quantity', 'Unit Price', 'DPP', 'PPN', 'PPH', 'Total', 'Status Faktur', 'Status Pembayaran'];

    const rows = filtered.map((i) => {
      const base = [
        i.no,
        i.tanggal?.slice(0, 10) ?? '',
        jenis === 'AR' ? i.customerName ?? '-' : i.vendorName ?? '-',
        i.inv ?? '',
        KATEGORI[i.kategori] ?? i.kategori,
      ];
      const cargo = jenis === 'AR'
        ? [i.cargoQuantity != null ? formatDecimal3(i.cargoQuantity) : '', i.unitPrice != null ? formatDecimal3(i.unitPrice) : '']
        : [];
      const tail = [
        formatUang(i.dpp),
        i.ppn ? formatUang(i.ppn) : '',
        i.pph ? formatUang(i.pph) : '',
        formatUang(i.total),
        STATUS_FAKTUR[i.statusFakturPajak] ?? i.statusFakturPajak,
        statusLabel(i.statusPembayaran),
      ];
      const approvalCol = jenis === 'AP' ? [i.approvalStatus === 'SUDAH_DIAPPROVE' ? 'Sudah di Approve' : 'Belum di Approve'] : [];
      return [...base, ...cargo, ...tail, ...approvalCol];
    });

    exportExcel({
      title: jenis === 'AR' ? 'Daftar Invoice AR' : 'Daftar Invoice AP',
      subtitle: 'Finance',
      filename: jenis === 'AR' ? 'daftar-invoice-ar' : 'daftar-invoice-ap',
      columns,
      rows,
      totalLabel: '',
      totalValue: '',
    });
  }

  const tabCls = (active: boolean) =>
    `rounded-t px-4 py-2 text-sm font-semibold ${active ? 'bg-white text-navy border-b-2 border-navy' : 'text-gray-500 hover:text-navy'}`;

  const inputCls = 'rounded border border-gray-300 px-3 py-2 text-sm';

  const changeJenis = (j: 'AP' | 'AR') => {
    setJenis(j);
    setApproval('SEMUA');
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-navy">Daftar Invoice</h2>
        <div className="flex gap-2">
          <button onClick={doExport} className="rounded border border-navy px-4 py-2 text-sm font-semibold text-navy">Export Excel</button>
          <button onClick={() => navigate('/admin/finance/invoice/input')} className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white">
            + Input Invoice
          </button>
        </div>
      </div>

      {error && <div className="mt-3 rounded bg-negative/10 p-3 text-sm text-negative">{error}</div>}

      <div className="mt-4 flex border-b border-gray-200">
        <button onClick={() => changeJenis('AP')} className={tabCls(jenis === 'AP')}>AP (Hutang)</button>
        <button onClick={() => changeJenis('AR')} className={tabCls(jenis === 'AR')}>AR (Piutang)</button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label className="text-sm text-gray-500">{jenis === 'AR' ? 'Status terima:' : 'Status bayar:'}</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className={inputCls}>
          <option value="SEMUA">Semua</option>
          <option value="BELUM_BAYAR">{jenis === 'AR' ? 'Belum diterima' : 'Belum bayar'}</option>
          <option value="SEBAGIAN">{jenis === 'AR' ? 'Diterima sebagian' : 'Sebagian'}</option>
          <option value="LUNAS">Lunas</option>
        </select>

        {jenis === 'AP' && (
          <>
            <label className="text-sm text-gray-500">Approval:</label>
            <select value={approval} onChange={(e) => setApproval(e.target.value)} className={inputCls}>
              <option value="SEMUA">Semua</option>
              <option value="SUDAH_DIAPPROVE">Sudah di Approve</option>
              <option value="BELUM_DIAPPROVE">Belum di Approve</option>
            </select>
          </>
        )}

        <label className="text-sm text-gray-500">Kategori:</label>
        {Object.entries(KATEGORI).map(([key, label]) => (
          <label key={key} className="flex items-center gap-1 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={kategori.includes(key)}
              onChange={() => toggleKategori(key)}
            />
            {label}
          </label>
        ))}

        <label className="text-sm text-gray-500">Bulan:</label>
        <select value={bulan} onChange={(e) => setBulan(e.target.value)} className={inputCls}>
          <option value="">Semua</option>
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>

        <label className="text-sm text-gray-500">Tahun:</label>
        <select value={tahun} onChange={(e) => setTahun(e.target.value)} className={inputCls}>
          <option value="">Semua</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>

        <input placeholder={`Cari no / ${jenis === 'AR' ? 'customer' : 'vendor'} / INV...`} value={search} onChange={(e) => setSearch(e.target.value)} className={`${inputCls} w-64`} />
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse bg-white text-sm">
          <thead>
            <tr className="bg-navy-light text-left text-navy">
              <th className="px-3 py-2">No</th>
              <th className="px-3 py-2">Tanggal</th>
              <th className="px-3 py-2">{jenis === 'AR' ? 'Customer' : 'Vendor'}</th>
              <th className="px-3 py-2">INV</th>
              <th className="px-3 py-2">Kategori</th>
              {jenis === 'AR' && <th className="px-3 py-2 text-right">Cargo Quantity</th>}
              {jenis === 'AR' && <th className="px-3 py-2 text-right">Unit Price</th>}
              <th className="px-3 py-2 text-right">DPP</th>
              <th className="px-3 py-2 text-right">PPN</th>
              <th className="px-3 py-2 text-right">PPH</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2">Faktur</th>
              <th className="px-3 py-2">Status</th>
              {jenis === 'AP' && <th className="px-3 py-2">Approval</th>}
              <th className="px-3 py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={jenis === 'AP' ? 13 : 14} className="px-3 py-6 text-center text-gray-400">Memuat...</td></tr>}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={jenis === 'AP' ? 13 : 14} className="px-3 py-6 text-center text-gray-400">Belum ada invoice.</td></tr>
            )}
            {!loading && filtered.map((i) => (
              <tr key={i.id} className="border-t border-gray-100">
                <td className="px-3 py-2 font-semibold text-navy">
                  {i.no}
                  {i.incomplete && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">belum lengkap</span>}
                </td>
                <td className="px-3 py-2">{i.tanggal?.slice(0, 10)}</td>
                <td className="px-3 py-2">{jenis === 'AR' ? i.customerName ?? '-' : i.vendorName ?? '-'}</td>
                <td className="px-3 py-2">{i.inv ?? '-'}</td>
                <td className="px-3 py-2">{KATEGORI[i.kategori] ?? i.kategori}</td>
                {jenis === 'AR' && <td className="px-3 py-2 text-right">{i.cargoQuantity != null ? formatDecimal3(i.cargoQuantity) : '-'}</td>}
                {jenis === 'AR' && <td className="px-3 py-2 text-right">{i.unitPrice != null ? formatDecimal3(i.unitPrice) : '-'}</td>}
                <td className="px-3 py-2 text-right">{formatUang(i.dpp)}</td>
                <td className="px-3 py-2 text-right">{i.ppn ? formatUang(i.ppn) : '-'}</td>
                <td className="px-3 py-2 text-right">{i.pph ? formatUang(i.pph) : '-'}</td>
                <td className="px-3 py-2 text-right font-semibold">{formatUang(i.total)}</td>
                <td className="px-3 py-2">{STATUS_FAKTUR[i.statusFakturPajak] ?? i.statusFakturPajak}</td>
                <td className="px-3 py-2">
                  <span className={`rounded px-2 py-0.5 text-xs ${
                    i.statusPembayaran === 'LUNAS' ? 'bg-positive/10 text-positive' :
                    i.statusPembayaran === 'SEBAGIAN' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                  }`}>{statusLabel(i.statusPembayaran)}</span>
                </td>
                {jenis === 'AP' && (
                  <td className="px-3 py-2">
                    {i.kategori === 'FREIGHT' ? null : (
                      i.approvalStatus === 'SUDAH_DIAPPROVE' ? (
                        <span className="rounded px-2 py-0.5 text-xs bg-positive/10 text-positive">Sudah di Approve</span>
                      ) : (
                        <span className="rounded px-2 py-0.5 text-xs bg-gray-100 text-gray-600">Belum di Approve</span>
                      )
                    )}
                  </td>
                )}
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <button onClick={() => navigate(`/admin/finance/invoice/input/${i.id}`)} className="text-navy hover:underline">Edit</button>
                  {jenis === 'AP' && i.approvalStatus !== 'SUDAH_DIAPPROVE' && i.kategori !== 'FREIGHT' && (
                    <button onClick={() => sendApproval(i.id)} className="ml-3 text-navy hover:underline">
                      {i.approvalSentAt ? 'Kirim Ulang' : 'Kirim Approval'}
                    </button>
                  )}
                  <button onClick={() => handleDelete(i.id)} className="ml-3 text-negative hover:underline">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
