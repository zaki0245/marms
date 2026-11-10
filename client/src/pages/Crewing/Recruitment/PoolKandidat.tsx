// client/src/pages/Crewing/Recruitment/PoolKandidat.tsx
// [FUNGSI] Tab Pool Kandidat di halaman Rekrutmen: daftar kandidat diterima yang belum ditempatkan.
// [ALASAN] Menyatukan alur rekrutmen: seleksi (Pelamar) + penempatan (Pool Kandidat).

import { useEffect, useState } from 'react';
import { api } from '../../../api/client';
import Pagination, { DEFAULT_PAGE_SIZE } from '../../../components/Pagination';
import { SortableTh, sortRows, useSort } from '../../../components/sortable';

interface Applicant {
  id: string;
  nomorPendaftaran: string;
  namaLengkap: string;
  posisiDilamar: string;
  noHp: string;
}

interface Jabatan {
  kode: string;
  nama: string;
  gajiPokok: number;
}

interface Vessel {
  id: string;
  namaUnit: string;
}

interface AssignTarget {
  id: string;
  nama: string;
  posisi: string;
}

export default function PoolKandidat() {
  const [pool, setPool] = useState<Applicant[]>([]);
  const [jabatan, setJabatan] = useState<Jabatan[]>([]);
  const [kapal, setKapal] = useState<Vessel[]>([]);
  const [assignTarget, setAssignTarget] = useState<AssignTarget | null>(null);
  const [assignForm, setAssignForm] = useState({ jabatanKode: '', vesselId: '', tanggalMulai: '', namaBank: '', noRekening: '' });
  const [assigning, setAssigning] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const { sort, toggle } = useSort();

  async function loadPool() {
    try {
      const { data } = await api.get<Applicant[]>('/recruitment/kandidat');
      setPool(data);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadPool();
    api.get<Jabatan[]>('/master-data/jabatan').then(({ data }) => setJabatan(data)).catch(() => undefined);
    api.get<Vessel[]>('/kapal').then(({ data }) => setKapal(data)).catch(() => undefined);
  }, []);

  function openAssign(p: Applicant) {
    const match = jabatan.find((j) => j.nama === p.posisiDilamar);
    setAssignForm({ jabatanKode: match?.kode ?? '', vesselId: '', tanggalMulai: '', namaBank: '', noRekening: '' });
    setAssignTarget({ id: p.id, nama: p.namaLengkap, posisi: p.posisiDilamar });
    setError('');
    setMsg('');
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!assignTarget) return;
    setAssigning(true);
    setError('');
    try {
      await api.post(`/crew/assign-applicant/${assignTarget.id}`, {
        jabatanKode: assignForm.jabatanKode,
        vesselId: assignForm.vesselId,
        tanggalMulai: assignForm.tanggalMulai,
        namaBank: assignForm.namaBank,
        noRekening: assignForm.noRekening,
      });
      setAssignTarget(null);
      setMsg('Kandidat berhasil ditempatkan di kapal');
      loadPool();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal menempatkan kandidat');
    } finally {
      setAssigning(false);
    }
  }

  useEffect(() => {
    setPage(1);
  }, [sort]);

  const sortedPool = sortRows(pool, sort, {
    nomor: (p) => p.nomorPendaftaran,
    nama: (p) => p.namaLengkap,
    posisi: (p) => p.posisiDilamar,
    noHp: (p) => p.noHp,
  });
  const rows = sortedPool.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      {msg && <div className="mt-3 alert-success">{msg}</div>}
      {error && <div className="mt-3 alert-error">{error}</div>}

      <table className="mt-4 w-full border-collapse bg-card text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500">
            <SortableTh label="No. Pendaftaran" sortKey="nomor" sort={sort} onSort={toggle} className="px-3 py-2" />
            <SortableTh label="Nama" sortKey="nama" sort={sort} onSort={toggle} className="px-3 py-2" />
            <SortableTh label="Posisi" sortKey="posisi" sort={sort} onSort={toggle} className="px-3 py-2" />
            <SortableTh label="No HP" sortKey="noHp" sort={sort} onSort={toggle} className="px-3 py-2" />
            <th className="px-3 py-2 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {pool.length === 0 && (
            <tr>
              <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                Tidak ada kandidat. Ubah status pelamar jadi "Diterima" dulu di tab Pelamar.
              </td>
            </tr>
          )}
          {rows.map((p) => (
            <tr key={p.id} className="border-t border-gray-100">
              <td className="px-3 py-2 font-mono">{p.nomorPendaftaran}</td>
              <td className="px-3 py-2">{p.namaLengkap}</td>
              <td className="px-3 py-2">{p.posisiDilamar}</td>
              <td className="px-3 py-2">{p.noHp}</td>
              <td className="px-3 py-2 text-right">
                <button onClick={() => openAssign(p)} className="rounded-md bg-navy px-3 py-1 text-xs font-medium text-white">
                  Assign ke Kapal
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination
        page={page}
        pageSize={pageSize}
        total={pool.length}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
      />

      {assignTarget && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <form onSubmit={handleAssign} className="w-full max-w-md rounded-lg bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Assign ke Kapal</h3>
            <p className="mt-1 text-sm text-gray-500">{assignTarget.nama} · {assignTarget.posisi}</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="label">Jabatan</label>
                <select required value={assignForm.jabatanKode} onChange={(e) => setAssignForm({ ...assignForm, jabatanKode: e.target.value })} className="input mt-1 w-full">
                  <option value="">Pilih jabatan</option>
                  {jabatan.map((j) => <option key={j.kode} value={j.kode}>{j.nama}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Kapal</label>
                <select required value={assignForm.vesselId} onChange={(e) => setAssignForm({ ...assignForm, vesselId: e.target.value })} className="input mt-1 w-full">
                  <option value="">Pilih kapal</option>
                  {kapal.map((k) => <option key={k.id} value={k.id}>{k.namaUnit}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Tanggal Mulai On Board</label>
                <input required type="date" value={assignForm.tanggalMulai} onChange={(e) => setAssignForm({ ...assignForm, tanggalMulai: e.target.value })} className="input mt-1 w-full" />
              </div>
              <div>
                <label className="label">Nama Bank</label>
                <input value={assignForm.namaBank} onChange={(e) => setAssignForm({ ...assignForm, namaBank: e.target.value })} className="input mt-1 w-full" placeholder="Contoh: BCA" />
              </div>
              <div>
                <label className="label">Nomor Rekening</label>
                <input value={assignForm.noRekening} onChange={(e) => setAssignForm({ ...assignForm, noRekening: e.target.value })} className="input mt-1 w-full" placeholder="Contoh: 1234567890" />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setAssignTarget(null)} className="btn-ghost">Batal</button>
              <button type="submit" disabled={assigning} className="btn-primary">{assigning ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
