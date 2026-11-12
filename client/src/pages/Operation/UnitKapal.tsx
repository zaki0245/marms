// client/src/pages/Operation/UnitKapal.tsx
// [FUNGSI] Master unit kapal Operation (TB + BG + owner + contact master).
// [ALASAN] Satu sumber data unit kapal; form shipment memilih dari sini agar tidak ketik ulang.

import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import Pagination, { DEFAULT_PAGE_SIZE } from '../../components/Pagination';
import { SortableTh, sortRows, useSort } from '../../components/sortable';
import UnitKapalForm from './UnitKapalForm';
import { OperationKapal } from './types';

export default function UnitKapalPage() {
  const [items, setItems] = useState<OperationKapal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const { sort, toggle } = useSort();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<OperationKapal | null>(null);

  async function load() {
    try {
      const { data } = await api.get<OperationKapal[]>('/operation/kapal');
      setItems(data);
    } catch {
      setError('Gagal memuat data unit kapal');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // [FUNGSI] Reset halaman saat pencarian/sorting berubah.
  useEffect(() => {
    setPage(1);
  }, [search, sort]);

  function handleSaved() {
    setShowForm(false);
    setEditing(null);
    setSuccess('Unit kapal disimpan');
    load();
  }

  async function hapus(unit: OperationKapal) {
    if (!window.confirm(`Hapus unit ${unit.tb} / ${unit.bg}?`)) return;
    setError('');
    try {
      await api.delete(`/operation/kapal/${unit.id}`);
      setSuccess('Unit kapal dihapus');
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal menghapus unit kapal');
    }
  }

  if (loading) return <p className="text-gray-500">Memuat...</p>;

  const key = search.toLowerCase();
  const filtered = key
    ? items.filter((u) => [u.tb, u.bg, u.ownerOperator, u.contactMaster].some((v) => v?.toLowerCase().includes(key)))
    : items;
  const rows = sortRows(filtered, sort, {
    tb: (u) => u.tb,
    bg: (u) => u.bg,
    owner: (u) => u.ownerOperator,
    contact: (u) => u.contactMaster,
  });
  const paged = rows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <h1 className="page-title">Unit Kapal</h1>
      <p className="mt-1 text-sm text-gray-500">Data TB, BG, owner/operator, dan contact master untuk shipment.</p>

      {error && <div className="mt-3 alert-error">{error}</div>}
      {success && <div className="mt-3 alert-success">{success}</div>}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari TB / BG / owner / contact..."
          className="input w-full sm:w-80"
        />
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="btn-primary sm:ml-auto"
        >
          + Tambah Unit Kapal
        </button>
      </div>

      <div className="mt-2 overflow-x-auto">
        <table className="w-full border-collapse bg-card text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500">
              <SortableTh label="TB" sortKey="tb" sort={sort} onSort={toggle} className="px-3 py-2" />
              <SortableTh label="BG" sortKey="bg" sort={sort} onSort={toggle} className="px-3 py-2" />
              <SortableTh label="Barges Owners / Operator" sortKey="owner" sort={sort} onSort={toggle} className="px-3 py-2" />
              <SortableTh label="Contact Master / Captain" sortKey="contact" sort={sort} onSort={toggle} className="px-3 py-2" />
              <th className="px-3 py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                  {items.length === 0 ? 'Belum ada unit kapal. Klik "+ Tambah Unit Kapal".' : 'Tidak ada unit kapal yang cocok.'}
                </td>
              </tr>
            )}
            {paged.map((u) => (
              <tr key={u.id} className="border-t border-gray-100">
                <td className="px-3 py-2 font-medium text-gray-900">{u.tb}</td>
                <td className="px-3 py-2">{u.bg}</td>
                <td className="px-3 py-2">{u.ownerOperator ?? '-'}</td>
                <td className="px-3 py-2">{u.contactMaster ?? '-'}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right">
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => {
                        setEditing(u);
                        setShowForm(true);
                      }}
                      className="rounded-md border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => hapus(u)}
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

      <Pagination page={page} pageSize={pageSize} total={rows.length} onPageChange={setPage} onPageSizeChange={setPageSize} />

      {showForm && (
        <UnitKapalForm
          initial={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
