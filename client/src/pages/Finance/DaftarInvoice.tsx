// client/src/pages/Finance/DaftarInvoice.tsx
// [FUNGSI] Halaman daftar invoice Finance (tab AR/AP, filter status/approval/bulan/tahun, export Excel, hapus, edit).
// [ALASAN] Rekap & kelola record invoice AR dan AP.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { exportExcel } from '../../utils/export';
import { formatUang, formatDecimal3 } from './utils';
import Pagination, { DEFAULT_PAGE_SIZE } from '../../components/Pagination';
import { SortableTh, sortRows, useSort } from '../../components/sortable';

interface Invoice {
  id: string;
  no: string;
  jenis: string;
  kategori: string;
  tipe: string;
  tanggal: string;
  vendorName: string | null;
  customerName: string | null;
  inv: string | null;
  keterangan: string | null;
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
  perluApproval: boolean;
}

const STATUS_FAKTUR: Record<string, string> = { SUDAH_DITERIMA: 'Diterima', BELUM_DITERIMA: 'Belum diterima', TIDAK_ADA: 'Tidak ada' };
const STATUS_BAYAR_AP: Record<string, string> = { BELUM_BAYAR: 'Belum bayar', SEBAGIAN: 'Sebagian', LUNAS: 'Lunas' };
const STATUS_BAYAR_AR: Record<string, string> = { BELUM_BAYAR: 'Belum dibayar', SEBAGIAN: 'Dibayar sebagian', LUNAS: 'Lunas' };
const KATEGORI: Record<string, string> = { FREIGHT: 'Freight', OPERATION: 'Operation', OTHERS: 'Others' };
const TIPE: Record<string, string> = { REGULAR: 'Regular', DP: 'DP', PELUNASAN: 'Pelunasan' };
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function DaftarInvoice() {
  const navigate = useNavigate();
  const [jenis, setJenis] = useState<'AP' | 'AR'>('AP');
  const [items, setItems] = useState<Invoice[]>([]);
  const [filter, setFilter] = useState('SEMUA');
  const [approval, setApproval] = useState('SEMUA');
  const [perlu, setPerlu] = useState('SEMUA');
  const [kategori, setKategori] = useState<string[]>([]);
  const [kategoriOpen, setKategoriOpen] = useState(false);
  const [bulan, setBulan] = useState('');
  const [tahun, setTahun] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const { sort, toggle } = useSort();
  const kategoriRef = useRef<HTMLDivElement>(null);

  // [FUNGSI] Deteksi role SUPERADMIN untuk mengaktifkan ubah approval manual.
  useEffect(() => {
    api.get('/auth/me').then(({ data }) => setIsSuperAdmin(data.role === 'SUPERADMIN')).catch(() => undefined);
  }, []);

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

  // [FUNGSI] Tutup dropdown kategori saat klik di luar area.
  useEffect(() => {
    if (!kategoriOpen) return;
    function onDown(e: MouseEvent) {
      if (!kategoriRef.current?.contains(e.target as Node)) setKategoriOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [kategoriOpen]);

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

  async function changeApproval(id: string, approvalStatus: string) {
    setError('');
    try {
      await api.patch(`/finance/invoice/${id}/approval`, { approvalStatus });
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal mengubah status approval');
    }
  }

  const statusLabel = (s: string) => (jenis === 'AR' ? STATUS_BAYAR_AR[s] : STATUS_BAYAR_AP[s]) ?? s;

  function toggleKategori(k: string) {
    setKategori((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  }

  const kategoriLabel =
    kategori.length === 0
      ? 'Semua'
      : kategori.length === 1
        ? KATEGORI[kategori[0]] ?? kategori[0]
        : `${kategori.length} dipilih`;

  const years = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => { if (i.tanggal) set.add(String(new Date(i.tanggal).getFullYear())); });
    return Array.from(set).sort().reverse();
  }, [items]);

  const filtered = items.filter((i) => {
    if (search) {
      const s = search.toLowerCase();
      if (![i.no, i.vendorName, i.customerName, i.inv, i.keterangan, KATEGORI[i.kategori] ?? i.kategori, TIPE[i.tipe] ?? i.tipe].some((v) => v && v.toLowerCase().includes(s))) return false;
    }
    if (filter !== 'SEMUA' && i.statusPembayaran !== filter) return false;
    if (jenis === 'AP' && approval !== 'SEMUA' && i.approvalStatus !== approval) return false;
    if (jenis === 'AP' && perlu !== 'SEMUA' && i.perluApproval !== (perlu === 'YA')) return false;
    if (kategori.length && !kategori.includes(i.kategori)) return false;
    if (bulan || tahun) {
      const d = new Date(i.tanggal);
      if (bulan && d.getMonth() + 1 !== Number(bulan)) return false;
      if (tahun && d.getFullYear() !== Number(tahun)) return false;
    }
    return true;
  });

  // [FUNGSI] Reset halaman saat filter berubah agar tidak tertinggal di halaman terakhir.
  useEffect(() => {
    setPage(1);
  }, [search, filter, approval, perlu, kategori, bulan, tahun, jenis, sort]);

  const pageRows = sortRows(filtered, sort, {
    no: (i) => i.no,
    tanggal: (i) => i.tanggal,
    pihak: (i) => (jenis === 'AR' ? i.customerName : i.vendorName),
    inv: (i) => i.inv,
    keterangan: (i) => i.keterangan,
    kategori: (i) => KATEGORI[i.kategori] ?? i.kategori,
    tipe: (i) => TIPE[i.tipe] ?? i.tipe,
    cargoQuantity: (i) => (i.cargoQuantity != null ? Number(i.cargoQuantity) : null),
    unitPrice: (i) => (i.unitPrice != null ? Number(i.unitPrice) : null),
    dpp: (i) => Number(i.dpp),
    ppn: (i) => (i.ppn != null ? Number(i.ppn) : null),
    pph: (i) => (i.pph != null ? Number(i.pph) : null),
    total: (i) => Number(i.total),
    faktur: (i) => STATUS_FAKTUR[i.statusFakturPajak] ?? i.statusFakturPajak,
    status: (i) => statusLabel(i.statusPembayaran),
    approval: (i) => (i.approvalStatus === 'SUDAH_DIAPPROVE' ? 'Sudah di Approve' : 'Belum di Approve'),
    perlu: (i) => (i.perluApproval ? 'Ya' : 'Tidak'),
  }).slice((page - 1) * pageSize, page * pageSize);

  function doExport() {
    const columns = jenis === 'AP'
      ? ['No Invoice', 'Tanggal', 'Vendor', 'INV', 'Keterangan', 'Kategori', 'Tipe', 'DPP', 'PPN', 'PPH', 'Total', 'Status Faktur', 'Status Pembayaran', 'Perlu Approval', 'Status Approval']
      : ['No Invoice', 'Tanggal', 'Customer', 'INV', 'Keterangan', 'Kategori', 'Tipe', 'Cargo Quantity', 'Unit Price', 'DPP', 'PPN', 'PPH', 'Total', 'Status Faktur', 'Status Pembayaran'];

    const rows = filtered.map((i) => {
      const base = [
        i.no,
        i.tanggal?.slice(0, 10) ?? '',
        jenis === 'AR' ? i.customerName ?? '-' : i.vendorName ?? '-',
        i.inv ?? '',
        i.keterangan ?? '',
        KATEGORI[i.kategori] ?? i.kategori,
        TIPE[i.tipe] ?? i.tipe,
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
      const approvalCol = jenis === 'AP' ? [i.perluApproval ? 'Ya' : 'Tidak', i.approvalStatus === 'SUDAH_DIAPPROVE' ? 'Sudah di Approve' : 'Belum di Approve'] : [];
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
    `px-4 py-2 text-sm font-medium ${active ? '-mb-px border-b-2 border-gray-900 text-gray-900' : 'border-b-2 border-transparent text-gray-500 hover:text-gray-900'}`;

  const inputCls = 'input';

  const changeJenis = (j: 'AP' | 'AR') => {
    setJenis(j);
    setApproval('SEMUA');
    setPerlu('SEMUA');
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="page-title">Daftar Invoice</h1>
        <div className="flex gap-2">
          <button onClick={doExport} className="btn-secondary">Export Excel</button>
          <button onClick={() => navigate('/dashboard/finance/invoice/input')} className="btn-primary">
            + Input Invoice
          </button>
        </div>
      </div>

      {error && <div className="mt-3 alert-error">{error}</div>}

      <div className="mt-4 flex border-b border-gray-200">
        <button onClick={() => changeJenis('AP')} className={tabCls(jenis === 'AP')}>AP (Hutang)</button>
        <button onClick={() => changeJenis('AR')} className={tabCls(jenis === 'AR')}>AR (Piutang)</button>
      </div>

      {/* [FUNGSI] Panel filter dengan label di atas kontrol agar rapi. */}
      <div className="mt-4 rounded-lg border border-gray-200 bg-card p-3">
        <div
          className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${
            jenis === 'AP' ? 'lg:grid-cols-6' : 'lg:grid-cols-4'
          }`}
        >
          <div>
            <label className="label">Status bayar</label>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className={`${inputCls} mt-1 w-full`}>
              <option value="SEMUA">Semua</option>
              <option value="BELUM_BAYAR">{jenis === 'AR' ? 'Belum dibayar' : 'Belum bayar'}</option>
              <option value="SEBAGIAN">{jenis === 'AR' ? 'Dibayar sebagian' : 'Sebagian'}</option>
              <option value="LUNAS">Lunas</option>
            </select>
          </div>

          {jenis === 'AP' && (
            <div>
              <label className="label">Status Approval</label>
              <select value={approval} onChange={(e) => setApproval(e.target.value)} className={`${inputCls} mt-1 w-full`}>
                <option value="SEMUA">Semua</option>
                <option value="SUDAH_DIAPPROVE">Sudah di Approve</option>
                <option value="BELUM_DIAPPROVE">Belum di Approve</option>
              </select>
            </div>
          )}

          {jenis === 'AP' && (
            <div>
              <label className="label">Perlu Approval</label>
              <select value={perlu} onChange={(e) => setPerlu(e.target.value)} className={`${inputCls} mt-1 w-full`}>
                <option value="SEMUA">Semua</option>
                <option value="YA">Ya</option>
                <option value="TIDAK">Tidak</option>
              </select>
            </div>
          )}

          <div
            className="relative"
            ref={kategoriRef}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setKategoriOpen(false);
            }}
          >
            <label className="label">Kategori</label>
            <button
              type="button"
              onClick={() => setKategoriOpen((o) => !o)}
              aria-expanded={kategoriOpen}
              className={`${inputCls} mt-1 flex w-full items-center justify-between text-left`}
            >
              <span className={kategori.length ? 'text-gray-900' : 'text-gray-500'}>{kategoriLabel}</span>
              <svg
                className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${kategoriOpen ? 'rotate-180' : ''}`}
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {kategoriOpen && (
              <div className="absolute left-0 right-0 z-20 mt-1 rounded-md border border-gray-200 bg-card p-2 shadow-lg">
                <label className="flex items-center gap-2 rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-50">
                  <input type="checkbox" checked={kategori.length === 0} onChange={() => setKategori([])} />
                  Semua
                </label>
                {Object.entries(KATEGORI).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-50">
                    <input type="checkbox" checked={kategori.includes(key)} onChange={() => toggleKategori(key)} />
                    {label}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="label">Bulan</label>
            <select value={bulan} onChange={(e) => setBulan(e.target.value)} className={`${inputCls} mt-1 w-full`}>
              <option value="">Semua</option>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Tahun</label>
            <select value={tahun} onChange={(e) => setTahun(e.target.value)} className={`${inputCls} mt-1 w-full`}>
              <option value="">Semua</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-3 w-full sm:w-96">
          <label className="label">Cari</label>
          <input
            placeholder={`Cari no / ${jenis === 'AR' ? 'customer' : 'vendor'} / INV / keterangan...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} mt-1 w-full`}
          />
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse bg-card text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500">
              <SortableTh label="No" sortKey="no" sort={sort} onSort={toggle} className="px-3 py-2" />
              <SortableTh label="Tanggal" sortKey="tanggal" sort={sort} onSort={toggle} className="px-3 py-2" />
              <SortableTh label={jenis === 'AR' ? 'Customer' : 'Vendor'} sortKey="pihak" sort={sort} onSort={toggle} className="px-3 py-2" />
              <SortableTh label="INV" sortKey="inv" sort={sort} onSort={toggle} className="px-3 py-2" />
              <SortableTh label="Keterangan (TB/BG/voyage)" sortKey="keterangan" sort={sort} onSort={toggle} className="px-3 py-2" />
              <SortableTh label="Kategori" sortKey="kategori" sort={sort} onSort={toggle} className="px-3 py-2" />
              <SortableTh label="Tipe" sortKey="tipe" sort={sort} onSort={toggle} className="px-3 py-2" />
              {jenis === 'AR' && <SortableTh label="Cargo Quantity" sortKey="cargoQuantity" sort={sort} onSort={toggle} className="px-3 py-2 text-right" />}
              {jenis === 'AR' && <SortableTh label="Unit Price" sortKey="unitPrice" sort={sort} onSort={toggle} className="px-3 py-2 text-right" />}
              <SortableTh label="DPP" sortKey="dpp" sort={sort} onSort={toggle} className="px-3 py-2 text-right" />
              <SortableTh label="PPN" sortKey="ppn" sort={sort} onSort={toggle} className="px-3 py-2 text-right" />
              <SortableTh label="PPH" sortKey="pph" sort={sort} onSort={toggle} className="px-3 py-2 text-right" />
              <SortableTh label="Total" sortKey="total" sort={sort} onSort={toggle} className="px-3 py-2 text-right" />
              <SortableTh label="Faktur" sortKey="faktur" sort={sort} onSort={toggle} className="px-3 py-2" />
              <SortableTh label="Status" sortKey="status" sort={sort} onSort={toggle} className="px-3 py-2" />
              {jenis === 'AP' && <SortableTh label="Perlu Approval" sortKey="perlu" sort={sort} onSort={toggle} className="px-3 py-2" />}
              {jenis === 'AP' && <SortableTh label="Status Approval" sortKey="approval" sort={sort} onSort={toggle} className="px-3 py-2" />}
              <th className="px-3 py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={16} className="px-3 py-6 text-center text-gray-500">Memuat...</td></tr>}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={16} className="px-3 py-6 text-center text-gray-500">Belum ada invoice.</td></tr>
            )}
            {!loading && pageRows.map((i) => (
              <tr key={i.id} className="border-t border-gray-100">
                <td className="px-3 py-2 font-semibold text-gray-900">
                  {i.no}
                  {i.incomplete && <span className="ml-2 rounded badge-warning px-1.5 py-0.5 text-xs">belum lengkap</span>}
                </td>
                <td className="px-3 py-2">{i.tanggal?.slice(0, 10)}</td>
                <td className="px-3 py-2">{jenis === 'AR' ? i.customerName ?? '-' : i.vendorName ?? '-'}</td>
                <td className="px-3 py-2">{i.inv ?? '-'}</td>
                <td className="px-3 py-2">{i.keterangan ?? '-'}</td>
                <td className="px-3 py-2">{KATEGORI[i.kategori] ?? i.kategori}</td>
                <td className="px-3 py-2">{TIPE[i.tipe] ?? i.tipe}</td>
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
                    i.statusPembayaran === 'SEBAGIAN' ? 'badge-warning' : 'bg-gray-100 text-gray-600'
                  }`}>{statusLabel(i.statusPembayaran)}</span>
                </td>
                {jenis === 'AP' && (
                  <td className="px-3 py-2">
                    <span className={`rounded px-2 py-0.5 text-xs ${i.perluApproval ? 'bg-navy/10 text-navy' : 'bg-gray-100 text-gray-600'}`}>
                      {i.perluApproval ? 'Ya' : 'Tidak'}
                    </span>
                  </td>
                )}
                {jenis === 'AP' && (
                  <td className="px-3 py-2">
                    {!i.perluApproval ? '-' : isSuperAdmin ? (
                      <select
                        value={i.approvalStatus}
                        onChange={(e) => changeApproval(i.id, e.target.value)}
                        className="rounded-md border border-gray-300 px-2 py-0.5 text-xs"
                      >
                        <option value="BELUM_DIAPPROVE">Belum di Approve</option>
                        <option value="SUDAH_DIAPPROVE">Sudah di Approve</option>
                      </select>
                    ) : (
                      i.approvalStatus === 'SUDAH_DIAPPROVE' ? (
                        <span className="rounded px-2 py-0.5 text-xs bg-positive/10 text-positive">Sudah di Approve</span>
                      ) : (
                        <span className="rounded px-2 py-0.5 text-xs bg-gray-100 text-gray-600">Belum di Approve</span>
                      )
                    )}
                  </td>
                )}
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <div className="flex justify-end gap-1.5">
                    <button onClick={() => navigate(`/dashboard/finance/invoice/input/${i.id}`)} className="rounded-md border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50">Edit</button>
                    {jenis === 'AP' && i.perluApproval && i.approvalStatus !== 'SUDAH_DIAPPROVE' && (
                      <button onClick={() => sendApproval(i.id)} className="rounded-md border border-navy/40 px-2.5 py-1 text-xs text-navy hover:bg-navy/5">
                        {i.approvalSentAt ? 'Kirim Ulang' : 'Kirim Approval'}
                      </button>
                    )}
                    <button onClick={() => handleDelete(i.id)} className="rounded-md border border-negative/40 px-2.5 py-1 text-xs text-negative hover:bg-negative/5">Hapus</button>
                  </div>
                </td>
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
