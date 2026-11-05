// client/src/pages/Crewing/Payroll/LeavePaySection.tsx
// [FUNGSI] Tab Leave Pay di halaman Payroll: tabel kelayakan, pencairan, riwayat & edit.
// [ALASAN] Menyatukan payroll, uang makan, dan leave pay dalam satu modul.

import { useEffect, useState } from 'react';
import { api, formatRupiah } from '../../../api/client';
import { sortByJabatan } from '../../../constants';
import Pagination, { DEFAULT_PAGE_SIZE } from '../../../components/Pagination';

interface LeavePayItem {
  crewId: string;
  nama: string;
  posisi: string;
  jabatanKode?: string | null;
  status: string;
  masaKerja: number;
  berhak: number;
  dibayar: number;
  sisa: number;
}

interface RiwayatItem {
  id: string;
  pencairanKe: number;
  tanggalPencairan: string;
  nominal: number;
}

export default function LeavePaySection() {
  const [leavePay, setLeavePay] = useState<LeavePayItem[]>([]);
  const [cairkanTarget, setCairkanTarget] = useState<LeavePayItem | null>(null);
  const [nominal, setNominal] = useState('');
  const [tanggalCair, setTanggalCair] = useState('');
  const [cairkanLoading, setCairkanLoading] = useState(false);
  const [riwayatTarget, setRiwayatTarget] = useState<LeavePayItem | null>(null);
  const [riwayat, setRiwayat] = useState<RiwayatItem[]>([]);
  const [editTarget, setEditTarget] = useState<RiwayatItem | null>(null);
  const [editNominal, setEditNominal] = useState('');
  const [editTanggal, setEditTanggal] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  async function loadLeavePay() {
    api.get<LeavePayItem[]>('/leave-pay').then(({ data }) => setLeavePay(data)).catch(() => undefined);
  }

  useEffect(() => {
    loadLeavePay();
  }, []);

  const sortedLeavePay = sortByJabatan(
    leavePay,
    (c) => c.jabatanKode ?? c.posisi,
    (c) => c.nama,
  );
  const leavePayRows = sortedLeavePay.slice((page - 1) * pageSize, page * pageSize);

  function openCairkan(item: LeavePayItem) {
    setCairkanTarget(item);
    setNominal('');
    setTanggalCair('');
    setError('');
    setMsg('');
  }

  async function handleCairkan(e: React.FormEvent) {
    e.preventDefault();
    if (!cairkanTarget) return;
    setCairkanLoading(true);
    setError('');
    try {
      await api.post(`/leave-pay/${cairkanTarget.crewId}/disburse`, {
        nominal: Number(nominal),
        tanggalPencairan: tanggalCair,
      });
      setCairkanTarget(null);
      setMsg('Leave pay berhasil dicairkan');
      loadLeavePay();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal mencairkan leave pay');
    } finally {
      setCairkanLoading(false);
    }
  }

  async function openRiwayat(item: LeavePayItem) {
    setRiwayatTarget(item);
    try {
      const { data } = await api.get<RiwayatItem[]>(`/leave-pay/${item.crewId}/riwayat`);
      setRiwayat(data);
    } catch {
      setRiwayat([]);
    }
  }

  function openEditRiwayat(r: RiwayatItem) {
    setEditTarget(r);
    setEditNominal(String(r.nominal));
    setEditTanggal(r.tanggalPencairan.slice(0, 10));
    setError('');
  }

  async function handleEditRiwayat(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setEditLoading(true);
    setError('');
    try {
      await api.put(`/leave-pay/disbursement/${editTarget.id}`, {
        nominal: Number(editNominal),
        tanggalPencairan: editTanggal,
      });
      setEditTarget(null);
      setMsg('Pencairan leave pay diperbarui');
      if (riwayatTarget) {
        const { data } = await api.get<RiwayatItem[]>(`/leave-pay/${riwayatTarget.crewId}/riwayat`);
        setRiwayat(data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal memperbarui pencairan');
    } finally {
      setEditLoading(false);
    }
  }

  return (
    <div className="mt-4">
      {msg && <div className="mb-3 alert-success">{msg}</div>}
      {error && !cairkanTarget && !editTarget && <div className="mb-3 alert-error">{error}</div>}

      <table className="w-full border-collapse bg-card text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500">
            <th className="px-3 py-2">Nama</th>
            <th className="px-3 py-2 text-right">Masa Kerja</th>
            <th className="px-3 py-2 text-right">Berhak</th>
            <th className="px-3 py-2 text-right">Dibayar</th>
            <th className="px-3 py-2 text-right">Sisa</th>
            <th className="px-3 py-2 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {leavePay.length === 0 && (
            <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-500">Belum ada crew.</td></tr>
          )}
          {leavePayRows.map((c) => (
            <tr key={c.crewId} className="border-t border-gray-100">
              <td className="px-3 py-2">{c.nama}</td>
              <td className="px-3 py-2 text-right tabular-nums">{c.masaKerja} hari</td>
              <td className="px-3 py-2 text-right tabular-nums">{c.berhak}</td>
              <td className="px-3 py-2 text-right tabular-nums text-positive">{c.dibayar}</td>
              <td className="px-3 py-2 text-right tabular-nums">{c.sisa > 0 ? c.sisa : '-'}</td>
              <td className="px-3 py-2 text-right whitespace-nowrap">
                {c.sisa > 0 && (
                  <button onClick={() => openCairkan(c)} className="text-positive hover:text-positive/70">Cairkan</button>
                )}
                <button onClick={() => openRiwayat(c)} className="ml-3 text-gray-700 hover:text-gray-900">Riwayat</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination
        page={page}
        pageSize={pageSize}
        total={leavePay.length}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
      />

      {/* Modal cairkan leave pay */}
      {cairkanTarget && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <form onSubmit={handleCairkan} className="w-full max-w-sm rounded-lg bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Cairkan Leave Pay</h3>
            <p className="mt-1 text-sm text-gray-500">{cairkanTarget.nama} · masa kerja {cairkanTarget.masaKerja} hari</p>
            {error && <div className="mt-3 alert-error">{error}</div>}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="label">Nominal (Rp)</label>
                <input type="number" required value={nominal} onChange={(e) => setNominal(e.target.value)} className="input mt-1 w-full" />
              </div>
              <div>
                <label className="label">Tanggal Dibayarkan</label>
                <input type="date" required value={tanggalCair} onChange={(e) => setTanggalCair(e.target.value)} className="input mt-1 w-full" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setCairkanTarget(null)} className="btn-ghost">Batal</button>
              <button type="submit" disabled={cairkanLoading} className="btn-primary">{cairkanLoading ? 'Menyimpan...' : 'Cairkan'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal riwayat leave pay */}
      {riwayatTarget && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-card p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Riwayat Leave Pay — {riwayatTarget.nama}</h3>
              <button onClick={() => setRiwayatTarget(null)} className="rounded px-3 py-1 text-sm text-gray-500 hover:bg-gray-100">Tutup</button>
            </div>
            <table className="mt-3 w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th className="px-3 py-2">Ke</th>
                  <th className="px-3 py-2">Tanggal Dibayarkan</th>
                  <th className="px-3 py-2 text-right">Nominal</th>
                  <th className="px-3 py-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {riwayat.length === 0 && (
                  <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-500">Belum ada pencairan.</td></tr>
                )}
                {riwayat.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100">
                    <td className="px-3 py-2">{r.pencairanKe}</td>
                    <td className="px-3 py-2">{r.tanggalPencairan.slice(0, 10)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatRupiah(r.nominal)}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <button onClick={() => openEditRiwayat(r)} className="text-gray-700 hover:text-gray-900">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal edit pencairan leave pay */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <form onSubmit={handleEditRiwayat} className="w-full max-w-sm rounded-lg bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Edit Pencairan ke-{editTarget.pencairanKe}</h3>
            {error && <div className="mt-3 alert-error">{error}</div>}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="label">Nominal (Rp)</label>
                <input type="number" required value={editNominal} onChange={(e) => setEditNominal(e.target.value)} className="input mt-1 w-full" />
              </div>
              <div>
                <label className="label">Tanggal Dibayarkan</label>
                <input type="date" required value={editTanggal} onChange={(e) => setEditTanggal(e.target.value)} className="input mt-1 w-full" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setEditTarget(null)} className="btn-ghost">Batal</button>
              <button type="submit" disabled={editLoading} className="btn-primary">{editLoading ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
