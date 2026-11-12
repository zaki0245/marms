// client/src/pages/Operation/DataOperation/Agent.tsx
// [FUNGSI] Master agen pelabuhan (dipakai Agent POL/POD pada shipment).
// [ALASAN] Satu sumber data agen beserta PIC & kontak; shipment menyimpan snapshot saat dipilih.

import { useEffect, useState } from 'react';
import { api } from '../../../api/client';
import Pagination, { DEFAULT_PAGE_SIZE } from '../../../components/Pagination';
import { SortableTh, sortRows, useSort } from '../../../components/sortable';
import AgentForm from './AgentForm';
import { AgentTipe, OperationAgent } from '../types';

// [FUNGSI] Tab daftar agen per tipe pelabuhan.
const TIPE: AgentTipe[] = ['POL', 'POD'];

export default function AgentPage() {
  const [items, setItems] = useState<OperationAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tipe, setTipe] = useState<AgentTipe>('POL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const { sort, toggle } = useSort();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<OperationAgent | null>(null);

  async function load() {
    try {
      const { data } = await api.get<OperationAgent[]>('/operation/agents');
      setItems(data);
    } catch {
      setError('Gagal memuat data agen');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // [FUNGSI] Reset halaman saat pencarian/sorting/tab berubah.
  useEffect(() => {
    setPage(1);
  }, [search, sort, tipe]);

  function handleSaved() {
    setShowForm(false);
    setEditing(null);
    setSuccess('Agen disimpan');
    load();
  }

  async function hapus(agent: OperationAgent) {
    if (!window.confirm(`Hapus agen "${agent.nama}"?`)) return;
    setError('');
    try {
      await api.delete(`/operation/agents/${agent.id}`);
      setSuccess('Agen dihapus');
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal menghapus agen');
    }
  }

  if (loading) return <p className="text-gray-500">Memuat...</p>;

  const key = search.toLowerCase();
  const daftar = items.filter((a) => a.tipe === tipe);
  const filtered = key
    ? daftar.filter((a) => [a.nama, a.pic, a.kontak].some((v) => v?.toLowerCase().includes(key)))
    : daftar;
  const rows = sortRows(filtered, sort, {
    nama: (a) => a.nama,
    pic: (a) => a.pic,
    kontak: (a) => a.kontak,
  });
  const paged = rows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <p className="text-sm text-gray-500">Agen pelabuhan untuk POL/POD beserta PIC dan kontak.</p>

      {error && <div className="mt-3 alert-error">{error}</div>}
      {success && <div className="mt-3 alert-success">{success}</div>}

      {/* [FUNGSI] Pilih daftar agen sesuai tipe pelabuhan. */}
      <div className="mt-4 flex gap-4 border-b border-gray-200 text-sm">
        {TIPE.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTipe(t)}
            className={`-mb-px border-b-2 px-1 pb-2 ${
              tipe === t ? 'border-gray-900 font-medium text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Agen {t}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama / PIC / kontak..."
          className="input w-full sm:w-80"
        />
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="btn-primary sm:ml-auto"
        >
          + Tambah Agen {tipe}
        </button>
      </div>

      <div className="mt-2 overflow-x-auto">
        <table className="w-full border-collapse bg-card text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500">
              <SortableTh label="Nama Agen" sortKey="nama" sort={sort} onSort={toggle} className="px-3 py-2" />
              <SortableTh label="PIC" sortKey="pic" sort={sort} onSort={toggle} className="px-3 py-2" />
              <SortableTh label="Kontak" sortKey="kontak" sort={sort} onSort={toggle} className="px-3 py-2" />
              <th className="px-3 py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-gray-500">
                  {daftar.length === 0
                    ? `Belum ada agen ${tipe}. Klik "+ Tambah Agen ${tipe}".`
                    : 'Tidak ada agen yang cocok.'}
                </td>
              </tr>
            )}
            {paged.map((a) => (
              <tr key={a.id} className="border-t border-gray-100">
                <td className="px-3 py-2 font-medium text-gray-900">{a.nama}</td>
                <td className="px-3 py-2">{a.pic ?? '-'}</td>
                <td className="px-3 py-2">{a.kontak ?? '-'}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right">
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => {
                        setEditing(a);
                        setShowForm(true);
                      }}
                      className="rounded-md border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => hapus(a)}
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
        <AgentForm
          initial={editing}
          tipe={tipe}
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
