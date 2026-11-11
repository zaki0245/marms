// client/src/pages/Operation/Shipment.tsx
// [FUNGSI] Daftar shipment: cari, filter status, sorting, buat/edit/hapus, tautan laporan.
// [ALASAN] Satu tempat mengelola seluruh voyage tongkang (pengganti sheet monitoring).

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import Pagination, { DEFAULT_PAGE_SIZE } from '../../components/Pagination';
import { SortableTh, sortRows, useSort } from '../../components/sortable';
import ShipmentForm from './ShipmentForm';
import { Shipment, ShipmentStatus, STATUS_BADGE, STATUS_LABEL, fmtUpdate } from './types';

export default function ShipmentPage() {
  const [items, setItems] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Shipment | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | ''>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const { sort, toggle } = useSort();

  async function load() {
    try {
      const { data } = await api.get<Shipment[]>('/operation/shipments');
      setItems(data);
    } catch {
      setError('Gagal memuat data shipment');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // [FUNGSI] Reset halaman saat pencarian/filter/sorting berubah.
  // [ALASAN] Mencegah user tertinggal di halaman kosong setelah data berubah.
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sort]);

  function openAdd() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(s: Shipment) {
    setEditing(s);
    setShowForm(true);
  }

  function handleSaved() {
    setShowForm(false);
    setSuccess(editing ? 'Shipment diperbarui' : 'Shipment dibuat');
    load();
  }

  async function handleDelete(s: Shipment) {
    setError('');
    setSuccess('');
    if (!window.confirm(`Hapus shipment ${s.kode}?`)) return;
    try {
      await api.delete(`/operation/shipments/${s.id}`);
      setSuccess('Shipment dihapus');
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal menghapus shipment');
    }
  }

  if (loading) return <p className="text-gray-500">Memuat...</p>;

  // [FUNGSI] Terapkan pencarian & filter status sebelum sorting.
  const q = search.trim().toLowerCase();
  const filtered = items.filter((s) => {
    if (statusFilter && s.status !== statusFilter) return false;
    if (!q) return true;
    return [s.kode, s.tb, s.bg, s.shipper, s.pol, s.pod, s.position, s.remarks]
      .some((v) => (v ?? '').toLowerCase().includes(q));
  });

  const rows = sortRows(filtered, sort, {
    kode: (s) => s.kode,
    kapal: (s) => `${s.tb} / ${s.bg}`,
    shipper: (s) => s.shipper,
    rute: (s) => `${s.pol} ${s.pod ?? ''}`,
    laycan: (s) => s.laycan,
    status: (s) => STATUS_LABEL[s.status],
    posisi: (s) => s.position,
    update: (s) => s.updatedAt,
  }).slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <h1 className="page-title">Shipment</h1>
      <p className="mt-1 text-sm text-gray-500">Data voyage tongkang beserta posisi dan status.</p>

      {error && <div className="mt-3 alert-error">{error}</div>}
      {success && <div className="mt-3 alert-success">{success}</div>}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari kode / TB / BG / shipper / POL / POD..."
          className="input w-full sm:w-80"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ShipmentStatus | '')}
          className="input w-40"
        >
          <option value="">Semua status</option>
          {(Object.keys(STATUS_LABEL) as ShipmentStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
        <button onClick={openAdd} className="btn-primary sm:ml-auto">
          + Buat Shipment
        </button>
      </div>

      <div className="mt-2 overflow-x-auto">
        <table className="w-full border-collapse bg-card text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500">
              <SortableTh label="Kode" sortKey="kode" sort={sort} onSort={toggle} className="px-3 py-2" />
              <SortableTh label="TB / BG" sortKey="kapal" sort={sort} onSort={toggle} className="px-3 py-2" />
              <SortableTh label="Shipper" sortKey="shipper" sort={sort} onSort={toggle} className="px-3 py-2" />
              <SortableTh label="POL → POD" sortKey="rute" sort={sort} onSort={toggle} className="px-3 py-2" />
              <SortableTh label="Laycan" sortKey="laycan" sort={sort} onSort={toggle} className="px-3 py-2" />
              <SortableTh label="Status" sortKey="status" sort={sort} onSort={toggle} className="px-3 py-2" />
              <SortableTh label="Posisi" sortKey="posisi" sort={sort} onSort={toggle} className="px-3 py-2" />
              <SortableTh label="Update" sortKey="update" sort={sort} onSort={toggle} className="px-3 py-2" />
              <th className="px-3 py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-gray-500">
                  {items.length === 0
                    ? 'Belum ada shipment. Klik "+ Buat Shipment".'
                    : 'Tidak ada shipment yang cocok dengan pencarian/filter.'}
                </td>
              </tr>
            )}
            {rows.map((s) => (
              <tr key={s.id} className="border-t border-gray-100">
                <td className="whitespace-nowrap px-3 py-2 font-medium text-gray-900">{s.kode}</td>
                <td className="px-3 py-2">
                  <div className="font-medium text-gray-900">{s.tb}</div>
                  <div className="text-xs text-gray-500">{s.bg}</div>
                </td>
                <td className="px-3 py-2">{s.shipper ?? '-'}</td>
                <td className="px-3 py-2">
                  <div>{s.pol}</div>
                  <div className="text-xs text-gray-500">{s.pod ?? 'TBA'}</div>
                </td>
                <td className="px-3 py-2">{s.laycan ?? '-'}</td>
                <td className="px-3 py-2">
                  <span className={`rounded px-2 py-0.5 text-xs ${STATUS_BADGE[s.status]}`}>
                    {STATUS_LABEL[s.status]}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div>{s.position ?? '-'}</div>
                  {s.latitude != null && s.longitude != null && (
                    <div className="text-xs text-gray-500">{s.latitude} {s.longitude}</div>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-500">{fmtUpdate(s.updatedAt)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right">
                  <div className="flex justify-end gap-1.5">
                    <Link
                      to={`/dashboard/operation/laporan/${s.id}`}
                      className="rounded-md border border-navy/40 px-2.5 py-1 text-xs text-navy hover:bg-navy/5"
                    >
                      Laporan
                    </Link>
                    <button
                      onClick={() => openEdit(s)}
                      className="rounded-md border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(s)}
                      className="rounded-md border border-negative/40 px-2.5 py-1 text-xs text-negative hover:bg-negative/5"
                    >
                      Hapus
                    </button>
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

      {showForm && (
        <ShipmentForm
          initial={editing}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
          onRefresh={load}
        />
      )}
    </div>
  );
}
