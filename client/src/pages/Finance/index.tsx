// client/src/pages/Finance/index.tsx
// [FUNGSI] Dashboard Finance: ringkasan hutang (AP) & piutang (AR) + tombol cepat.
// [ALASAN] Halaman awal payung bisnis Finance.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { formatUang } from './utils';

interface DashboardData {
  totalHutangBulanIni: number;
  totalPiutangBulanIni: number;
  invoiceBelumBayar: number;
  invoiceBelumDiterima: number;
  fakturPajakBelumDiterima: number;
  jatuhTempoTerdekat: any[];
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-navy">{value}</p>
    </div>
  );
}

export default function FinanceDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    api.get('/finance/laporan/dashboard').then(({ data }) => setData(data)).catch(() => undefined);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-navy">Dashboard Finance</h2>
        <div className="flex gap-2">
          <button onClick={() => navigate('/admin/finance/invoice/input')} className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white">Input Invoice</button>
          <button onClick={() => navigate('/admin/finance/cetak')} className="rounded border border-navy px-4 py-2 text-sm font-semibold text-navy">Cetak</button>
          <button onClick={() => navigate('/admin/finance/konfigurasi')} className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-600">Konfigurasi</button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Total Hutang Bulan Ini (AP)" value={formatUang(data?.totalHutangBulanIni ?? 0)} />
        <Card label="Total Piutang Bulan Ini (AR)" value={formatUang(data?.totalPiutangBulanIni ?? 0)} />
        <Card label="Invoice Belum Dibayar (AP)" value={String(data?.invoiceBelumBayar ?? 0)} />
        <Card label="Invoice Belum Diterima (AR)" value={String(data?.invoiceBelumDiterima ?? 0)} />
      </div>

      <div className="mt-6 rounded-lg bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-navy">Invoice Jatuh Tempo Terdekat</h3>
        <table className="mt-3 w-full text-left text-sm">
          <thead className="bg-navy-light text-navy">
            <tr>
              <th className="px-3 py-2">Jenis</th>
              <th className="px-3 py-2">Tanggal</th>
              <th className="px-3 py-2">Customer/Vendor</th>
              <th className="px-3 py-2">INV</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2">Jatuh Tempo</th>
            </tr>
          </thead>
          <tbody>
            {(data?.jatuhTempoTerdekat ?? []).length === 0 && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">Tidak ada invoice jatuh tempo.</td></tr>
            )}
            {(data?.jatuhTempoTerdekat ?? []).map((r) => (
              <tr key={r.id} className="border-t border-gray-100">
                <td className="px-3 py-2">
                  <span className={`rounded px-2 py-0.5 text-xs ${r.jenis === 'AR' ? 'bg-positive/10 text-positive' : 'bg-amber-100 text-amber-700'}`}>{r.jenis}</span>
                </td>
                <td className="px-3 py-2">{r.tanggal?.slice(0, 10)}</td>
                <td className="px-3 py-2">{r.counterpartyName}</td>
                <td className="px-3 py-2">{r.inv ?? '-'}</td>
                <td className="px-3 py-2 text-right">{formatUang(r.total)}</td>
                <td className="px-3 py-2">{r.dueDate?.slice(0, 10) ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
