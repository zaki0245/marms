// client/src/pages/Finance/Laporan.tsx
// [FUNGSI] Laporan Rekap (AR & AP): semua voucher + data invoice, filter bulan/tahun, search, export Excel.
// [ALASAN] Satu laporan ringkas untuk hutang (AP) & piutang (AR).

import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client';
import { exportExcel } from '../../utils/export';
import { num, formatUang, formatDecimal3 } from './utils';
import Pagination, { DEFAULT_PAGE_SIZE } from '../../components/Pagination';

interface Row {
  id: string;
  pvNo: string;
  jenis: string;
  tanggal: string;
  counterpartyName: string;
  inv: string | null;
  ref: string | null;
  keterangan: string | null;
  cargoQuantity: number | null;
  unitPrice: number | null;
  dpp: number;
  ppn: number | null;
  pph: number | null;
  bankCharge: number | null;
  balance: number | null;
}

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const COLS = [
  'No', 'Voucher', 'Tanggal', 'Counterparty', 'INV', 'REF', 'Keterangan', 'Cargo Quantity', 'Unit Price', 'DPP', 'PPN', 'PPH', 'Bank Charge', 'Balance', 'Total',
];

function matches(r: Row, q: string): boolean {
  if (!q) return true;
  const s = q.toLowerCase();
  return [r.pvNo, r.counterpartyName, r.inv, r.ref, r.keterangan].some((v) => v && v.toLowerCase().includes(s));
}

export default function Laporan() {
  const [jenis, setJenis] = useState<'AP' | 'AR'>('AP');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [bulan, setBulan] = useState('');
  const [tahun, setTahun] = useState('');

  const voucherJenis = jenis === 'AR' ? 'RV' : 'PV';

  useEffect(() => {
    setLoading(true);
    api.get<Row[]>('/finance/laporan/rekap', { params: { jenis: voucherJenis } })
      .then(({ data }) => setRows(data))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [voucherJenis]);

  const years = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => { if (r.tanggal) set.add(String(new Date(r.tanggal).getFullYear())); });
    return Array.from(set).sort().reverse();
  }, [rows]);

  const filtered = rows.filter((r) => {
    if (!matches(r, search)) return false;
    if (bulan || tahun) {
      const d = new Date(r.tanggal);
      if (bulan && d.getMonth() + 1 !== Number(bulan)) return false;
      if (tahun && d.getFullYear() !== Number(tahun)) return false;
    }
    return true;
  });

  // [FUNGSI] Reset halaman saat filter berubah.
  useEffect(() => {
    setPage(1);
  }, [search, bulan, tahun, voucherJenis]);

  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  function doExport() {
    const data = filtered.map((r, i) => [
      String(i + 1),
      r.pvNo,
      r.tanggal?.slice(0, 10) ?? '',
      r.counterpartyName,
      r.inv ?? '',
      r.ref ?? '',
      r.keterangan ?? '',
      r.cargoQuantity != null ? formatDecimal3(r.cargoQuantity) : '',
      r.unitPrice != null ? formatDecimal3(r.unitPrice) : '',
      formatUang(r.dpp),
      r.ppn != null ? formatUang(r.ppn) : '',
      r.pph != null ? formatUang(r.pph) : '',
      r.bankCharge != null ? formatUang(r.bankCharge) : '',
      r.balance != null ? formatUang(r.balance) : '',
      formatUang(num(r.dpp) + num(r.ppn) - num(r.pph) + num(r.bankCharge) + num(r.balance)),
    ]);
    exportExcel({ title: jenis === 'AR' ? 'Rekap AR' : 'Rekap AP', subtitle: 'Finance', filename: jenis === 'AR' ? 'rekap-ar' : 'rekap-ap', columns: COLS, rows: data, totalLabel: '', totalValue: '' });
  }

  const inputCls = 'rounded border border-gray-300 px-3 py-2 text-sm';

  const tabCls = (active: boolean) =>
    `rounded-t px-4 py-2 text-sm font-semibold ${active ? 'bg-white text-navy border-b-2 border-navy' : 'text-gray-500 hover:text-navy'}`;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-navy">Rekap</h2>
        <button onClick={doExport} className="rounded border border-navy px-4 py-2 text-sm text-navy">Export Excel</button>
      </div>

      <div className="mt-4 flex border-b border-gray-200">
        <button onClick={() => setJenis('AP')} className={tabCls(jenis === 'AP')}>AP (Hutang)</button>
        <button onClick={() => setJenis('AR')} className={tabCls(jenis === 'AR')}>AR (Piutang)</button>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-gray-500">Search</label>
          <input placeholder={`Cari ${voucherJenis}, counterparty, INV, REF, keterangan...`} value={search} onChange={(e) => setSearch(e.target.value)} className={`${inputCls} w-72`} />
        </div>
        <div>
          <label className="block text-xs text-gray-500">Bulan</label>
          <select value={bulan} onChange={(e) => setBulan(e.target.value)} className={inputCls}>
            <option value="">Semua</option>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500">Tahun</label>
          <select value={tahun} onChange={(e) => setTahun(e.target.value)} className={inputCls}>
            <option value="">Semua</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-navy-light text-navy">
            <tr>
              <th className="px-3 py-2">No</th>
              <th className="px-3 py-2">Voucher</th>
              <th className="px-3 py-2">Tanggal</th>
              <th className="px-3 py-2">Counterparty</th>
              <th className="px-3 py-2">INV</th>
              <th className="px-3 py-2">REF</th>
              <th className="px-3 py-2">Keterangan</th>
              <th className="px-3 py-2 text-right">Cargo Quantity</th>
              <th className="px-3 py-2 text-right">Unit Price</th>
              <th className="px-3 py-2 text-right">DPP</th>
              <th className="px-3 py-2 text-right">PPN</th>
              <th className="px-3 py-2 text-right">PPH</th>
              <th className="px-3 py-2 text-right">Bank Charge</th>
              <th className="px-3 py-2 text-right">Balance</th>
              <th className="px-3 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={15} className="px-3 py-6 text-center text-gray-400">Memuat...</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={15} className="px-3 py-6 text-center text-gray-400">Tidak ada data.</td></tr>}
            {!loading && pageRows.map((r, i) => (
              <tr key={r.id} className="border-t border-gray-100">
                <td className="px-3 py-2">{(page - 1) * pageSize + i + 1}</td>
                <td className="px-3 py-2">{r.pvNo}</td>
                <td className="px-3 py-2">{r.tanggal?.slice(0, 10)}</td>
                <td className="px-3 py-2">{r.counterpartyName}</td>
                <td className="px-3 py-2">{r.inv ?? '-'}</td>
                <td className="px-3 py-2">{r.ref ?? '-'}</td>
                <td className="px-3 py-2">{r.keterangan ?? '-'}</td>
                <td className="px-3 py-2 text-right">{r.cargoQuantity != null ? formatDecimal3(r.cargoQuantity) : '-'}</td>
                <td className="px-3 py-2 text-right">{r.unitPrice != null ? formatDecimal3(r.unitPrice) : '-'}</td>
                <td className="px-3 py-2 text-right">{formatUang(r.dpp)}</td>
                <td className="px-3 py-2 text-right">{r.ppn != null ? formatUang(r.ppn) : '-'}</td>
                <td className="px-3 py-2 text-right">{r.pph != null ? formatUang(r.pph) : '-'}</td>
                <td className="px-3 py-2 text-right">{r.bankCharge != null ? formatUang(r.bankCharge) : '-'}</td>
                <td className="px-3 py-2 text-right">{r.balance != null ? formatUang(r.balance) : '-'}</td>
                <td className="px-3 py-2 text-right font-semibold">{formatUang(num(r.dpp) + num(r.ppn) - num(r.pph) + num(r.bankCharge) + num(r.balance))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        total={filtered.length}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
      />
    </div>
  );
}
