// client/src/pages/Finance/DaftarInvoice.tsx
// [FUNGSI] Halaman daftar invoice Finance (tab AR/AP, filter status, hapus, edit).
// [ALASAN] Rekap & kelola record invoice AR dan AP.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { formatUang } from './utils';

interface Invoice {
  id: string;
  no: string;
  jenis: string;
  tanggal: string;
  vendorName: string | null;
  customerName: string | null;
  inv: string | null;
  dpp: string;
  ppn: string | null;
  pph: string | null;
  total: string;
  statusPembayaran: string;
  statusFakturPajak: string;
  incomplete: boolean;
}

const STATUS_FAKTUR: Record<string, string> = { SUDAH_DITERIMA: 'Diterima', BELUM_DITERIMA: 'Belum diterima', TIDAK_ADA: 'Tidak ada' };
const STATUS_BAYAR_AP: Record<string, string> = { BELUM_BAYAR: 'Belum bayar', SEBAGIAN: 'Sebagian', LUNAS: 'Lunas' };
const STATUS_BAYAR_AR: Record<string, string> = { BELUM_BAYAR: 'Belum diterima', SEBAGIAN: 'Diterima sebagian', LUNAS: 'Lunas' };

export default function DaftarInvoice() {
  const navigate = useNavigate();
  const [jenis, setJenis] = useState<'AP' | 'AR'>('AP');
  const [items, setItems] = useState<Invoice[]>([]);
  const [filter, setFilter] = useState('SEMUA');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get<Invoice[]>('/finance/invoice', { params: { status: filter, jenis } });
      setItems(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [filter, jenis]);

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

  const statusLabel = (s: string) => (jenis === 'AR' ? STATUS_BAYAR_AR[s] : STATUS_BAYAR_AP[s]) ?? s;

  const tabCls = (active: boolean) =>
    `rounded-t px-4 py-2 text-sm font-semibold ${active ? 'bg-white text-navy border-b-2 border-navy' : 'text-gray-500 hover:text-navy'}`;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-navy">Daftar Invoice</h2>
        <button onClick={() => navigate('/admin/finance/invoice/input')} className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white">
          + Input Invoice
        </button>
      </div>

      {error && <div className="mt-3 rounded bg-negative/10 p-3 text-sm text-negative">{error}</div>}

      <div className="mt-4 flex border-b border-gray-200">
        <button onClick={() => setJenis('AP')} className={tabCls(jenis === 'AP')}>AP (Hutang)</button>
        <button onClick={() => setJenis('AR')} className={tabCls(jenis === 'AR')}>AR (Piutang)</button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label className="text-sm text-gray-500">{jenis === 'AR' ? 'Status terima:' : 'Status bayar:'}</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded border border-gray-300 px-3 py-2 text-sm">
          <option value="SEMUA">Semua</option>
          <option value="BELUM_BAYAR">{jenis === 'AR' ? 'Belum diterima' : 'Belum bayar'}</option>
          <option value="SEBAGIAN">{jenis === 'AR' ? 'Diterima sebagian' : 'Sebagian'}</option>
          <option value="LUNAS">Lunas</option>
        </select>
        <input placeholder={`Cari no / ${jenis === 'AR' ? 'customer' : 'vendor'} / INV...`} value={search} onChange={(e) => setSearch(e.target.value)} className="rounded border border-gray-300 px-3 py-2 text-sm" />
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse bg-white text-sm">
          <thead>
            <tr className="bg-navy-light text-left text-navy">
              <th className="px-3 py-2">No</th>
              <th className="px-3 py-2">Tanggal</th>
              <th className="px-3 py-2">{jenis === 'AR' ? 'Customer' : 'Vendor'}</th>
              <th className="px-3 py-2">INV</th>
              <th className="px-3 py-2 text-right">DPP</th>
              <th className="px-3 py-2 text-right">PPN</th>
              <th className="px-3 py-2 text-right">PPH</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2">Faktur</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={11} className="px-3 py-6 text-center text-gray-400">Memuat...</td></tr>}
            {!loading && items.length === 0 && (
              <tr><td colSpan={11} className="px-3 py-6 text-center text-gray-400">Belum ada invoice.</td></tr>
            )}
            {!loading && items
              .filter((i) => !search || [i.no, i.vendorName, i.customerName, i.inv].some((v) => v && v.toLowerCase().includes(search.toLowerCase())))
              .map((i) => (
              <tr key={i.id} className="border-t border-gray-100">
                <td className="px-3 py-2 font-semibold text-navy">
                  {i.no}
                  {i.incomplete && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">belum lengkap</span>}
                </td>
                <td className="px-3 py-2">{i.tanggal?.slice(0, 10)}</td>
                <td className="px-3 py-2">{jenis === 'AR' ? i.customerName ?? '-' : i.vendorName ?? '-'}</td>
                <td className="px-3 py-2">{i.inv ?? '-'}</td>
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
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <button onClick={() => navigate(`/admin/finance/invoice/input/${i.id}`)} className="text-navy hover:underline">Edit</button>
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
