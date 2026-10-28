// client/src/pages/Reports/index.tsx
// [FUNGSI] Halaman Laporan: crew per kapal (dengan masa kerja & detail) dan leave pay.
// [ALASAN] Admin melihat rangkuman operasional & kelayakan leave pay dari sini.

import { useEffect, useState } from 'react';
import { api, formatRupiah } from '../../../api/client';
import { DOKUMEN_LABEL } from '../../../constants';
import Pagination, { DEFAULT_PAGE_SIZE } from '../../../components/Pagination';

interface Dokumen {
  id: string;
  jenis: string;
  filePath: string;
  tanggalExpired?: string | null;
}

interface Applicant {
  id: string;
  nomorPendaftaran: string;
  namaLengkap: string;
  posisiDilamar: string;
  noHp: string;
  email: string | null;
  tanggalLahir: string;
  alamat: string;
  status: string;
  documents?: Dokumen[];
}

interface Jabatan {
  kode: string;
  nama: string;
  gajiPokok: number;
}

interface Vessel {
  id: string;
  namaUnit: string;
  status: string;
}

interface Segmen {
  id: string;
  onBoardTanggal: string;
  offBoardTanggal?: string | null;
  durasi?: number | null;
}

interface Penempatan {
  id: string;
  jabatanKode: string;
  tanggalMulai: string;
  tanggalSelesai?: string | null;
  status: string;
  vessel?: Vessel;
  segments?: Segmen[];
}

interface Crew {
  id: string;
  tanggalBergabung: string;
  status: string;
  totalMasaKerja: number;
  masaKerja?: number;
  jumlahLeavePay: number;
  namaBank?: string | null;
  noRekening?: string | null;
  applicant: Applicant;
  placements?: Penempatan[];
}

interface LeavePayItem {
  crewId: string;
  nama: string;
  posisi: string;
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

const CREW_STATUS: Record<string, string> = {
  AVAILABLE: 'Tersedia',
  ON_BOARD: 'On Board',
  OFF_BOARD: 'Off Board',
};

// [FUNGSI] Nilai filter khusus untuk crew tanpa penempatan aktif (off board/available).
const TANPA_KAPAL = '__tanpa-kapal';

export default function Reports() {
  const [tab, setTab] = useState<'kapal' | 'leavepay'>('kapal');
  const [crewList, setCrewList] = useState<Crew[]>([]);
  const [kapal, setKapal] = useState<Vessel[]>([]);
  const [jabatan, setJabatan] = useState<Jabatan[]>([]);
  const [vesselFilter, setVesselFilter] = useState('');
  const [selected, setSelected] = useState<Crew | null>(null);
  const [updateDoc, setUpdateDoc] = useState<Dokumen | null>(null);
  const [updateFile, setUpdateFile] = useState<File | null>(null);
  const [updateExpired, setUpdateExpired] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [bankTarget, setBankTarget] = useState<Crew | null>(null);
  const [bankForm, setBankForm] = useState({ namaBank: '', noRekening: '' });
  const [bankLoading, setBankLoading] = useState(false);
  const [leavePay, setLeavePay] = useState<LeavePayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cairkanTarget, setCairkanTarget] = useState<LeavePayItem | null>(null);
  const [nominal, setNominal] = useState('');
  const [tanggalCair, setTanggalCair] = useState('');
  const [cairkanLoading, setCairkanLoading] = useState(false);
  const [riwayatTarget, setRiwayatTarget] = useState<LeavePayItem | null>(null);
  const [riwayat, setRiwayat] = useState<RiwayatItem[]>([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  async function loadLeavePay() {
    api.get<LeavePayItem[]>('/leave-pay').then(({ data }) => setLeavePay(data)).catch(() => undefined);
  }

  useEffect(() => {
    api.get<Crew[]>('/reports/crew-per-kapal').then(({ data }) => setCrewList(data)).catch(() => undefined);
    api.get<Vessel[]>('/master-data/kapal').then(({ data }) => setKapal(data)).catch(() => undefined);
    api.get<Jabatan[]>('/master-data/jabatan').then(({ data }) => setJabatan(data)).catch(() => undefined);
    loadLeavePay();
    setLoading(false);
  }, []);

  function jabatanName(kode: string) {
    return jabatan.find((j) => j.kode === kode)?.nama ?? kode;
  }

  function activePlacement(c: Crew) {
    return (c.placements ?? []).find((p) => p.status === 'AKTIF');
  }

  const filtered = vesselFilter
    ? crewList.filter((c) => {
        const active = activePlacement(c);
        if (vesselFilter === TANPA_KAPAL) return !active;
        return active?.vessel?.id === vesselFilter;
      })
    : crewList;

  const grouped = filtered.reduce((acc, c) => {
    const active = activePlacement(c);
    const key = active?.vessel?.id ?? 'unknown';
    if (!acc[key]) acc[key] = { vessel: active?.vessel, crews: [] };
    acc[key].crews.push(c);
    return acc;
  }, {} as Record<string, { vessel?: Vessel; crews: Crew[] }>);

  const tabCls = (t: typeof tab) =>
    `rounded-t px-4 py-2 text-sm font-semibold ${tab === t ? 'bg-white text-navy border-b-2 border-navy' : 'text-gray-500 hover:text-navy'}`;

  // [FUNGSI] Reset halaman saat tab berganti.
  useEffect(() => {
    setPage(1);
  }, [tab]);

  const leavePayRows = leavePay.slice((page - 1) * pageSize, page * pageSize);

  function openCairkan(item: LeavePayItem) {
    setCairkanTarget(item);
    setNominal('');
    setTanggalCair('');
    setError('');
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

  async function openDetail(c: Crew) {
    try {
      const { data } = await api.get<Crew>(`/crew/${c.id}`);
      setSelected(data);
    } catch {
      // ignore
    }
  }

  function openUpdate(d: Dokumen) {
    setUpdateDoc(d);
    setUpdateFile(null);
    setUpdateExpired(d.tanggalExpired?.slice(0, 10) ?? '');
    setError('');
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!updateDoc) return;
    setUpdateLoading(true);
    setError('');
    try {
      const fd = new FormData();
      if (updateFile) fd.append('file', updateFile);
      fd.append('tanggalExpired', updateExpired);
      await api.post(`/recruitment/dokumen/${updateDoc.id}/update`, fd);
      setUpdateDoc(null);
      setMsg('Dokumen diperbarui');
      if (selected) openDetail(selected);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal memperbarui dokumen');
    } finally {
      setUpdateLoading(false);
    }
  }

  function openBankEdit(c: Crew) {
    setBankTarget(c);
    setBankForm({ namaBank: c.namaBank ?? '', noRekening: c.noRekening ?? '' });
    setError('');
  }

  async function handleBankSave(e: React.FormEvent) {
    e.preventDefault();
    if (!bankTarget) return;
    setBankLoading(true);
    setError('');
    try {
      await api.patch(`/crew/${bankTarget.id}/bank`, bankForm);
      setBankTarget(null);
      setMsg('Informasi bank diperbarui');
      if (selected) openDetail(selected);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal memperbarui bank');
    } finally {
      setBankLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-navy">Laporan</h2>

      <div className="mt-4 flex gap-1 border-b border-gray-200">
        <button onClick={() => setTab('kapal')} className={tabCls('kapal')}>Crew per Kapal</button>
        <button onClick={() => setTab('leavepay')} className={tabCls('leavepay')}>Leave Pay</button>
      </div>

      {msg && <div className="mt-3 rounded bg-positive/10 p-3 text-sm text-positive">{msg}</div>}
      {error && <div className="mt-3 rounded bg-negative/10 p-3 text-sm text-negative">{error}</div>}

      {tab === 'kapal' && (
        <div>
          <div className="mt-4 flex items-center gap-2">
            <label className="text-sm text-gray-600">Filter Kapal:</label>
            <select
              value={vesselFilter}
              onChange={(e) => setVesselFilter(e.target.value)}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Semua Kapal</option>
              {kapal.map((k) => (
                <option key={k.id} value={k.id}>{k.namaUnit}</option>
              ))}
              <option value={TANPA_KAPAL}>Tanpa Kapal / Off Board</option>
            </select>
          </div>

          <div className="mt-4 space-y-4">
            {Object.values(grouped).length === 0 && (
              <p className="text-sm text-gray-400">Tidak ada crew.</p>
            )}
            {Object.values(grouped).map((g) => (
              <div key={g.vessel?.id ?? 'unknown'} className="overflow-hidden rounded-lg bg-white shadow-sm">
                <div className="border-b border-gray-100 px-4 py-3 font-semibold text-navy">{g.vessel?.namaUnit ?? 'Tanpa Kapal'}</div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="px-4 py-2 font-medium">Nama</th>
                      <th className="px-4 py-2 font-medium">Posisi</th>
                      <th className="px-4 py-2 font-medium">Naik Sejak</th>
                      <th className="px-4 py-2 text-right font-medium">Masa Kerja</th>
                      <th className="px-4 py-2 text-right font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.crews.map((c) => {
                      const active = activePlacement(c);
                      return (
                        <tr key={c.id} className="border-t border-gray-100">
                          <td className="px-4 py-2">{c.applicant.namaLengkap}</td>
                          <td className="px-4 py-2">{active ? jabatanName(active.jabatanKode) : c.applicant.posisiDilamar}</td>
                          <td className="px-4 py-2">{active?.tanggalMulai?.slice(0, 10) ?? '-'}</td>
                          <td className="px-4 py-2 text-right tabular-nums">{c.masaKerja ?? c.totalMasaKerja} hari</td>
                          <td className="px-4 py-2 text-right">
                            <button onClick={() => openDetail(c)} className="text-navy hover:underline">Detail</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'leavepay' && (
        <>
        <table className="mt-4 w-full border-collapse bg-white text-sm">
          <thead>
            <tr className="bg-navy-light text-left text-navy">
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
              <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">Belum ada crew.</td></tr>
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
                    <button onClick={() => openCairkan(c)} className="text-positive hover:underline">Cairkan</button>
                  )}
                  <button onClick={() => openRiwayat(c)} className="ml-3 text-navy hover:underline">Riwayat</button>
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
        </>
      )}

      {/* Modal detail crew */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-navy">{selected.applicant.namaLengkap}</h3>
                <p className="text-sm text-gray-500">{selected.applicant.nomorPendaftaran} · {selected.applicant.posisiDilamar}</p>
              </div>
              <button onClick={() => setSelected(null)} className="rounded px-3 py-1 text-sm text-gray-500 hover:bg-gray-100">Tutup</button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
              <div><span className="text-gray-500">Status:</span> {CREW_STATUS[selected.status] ?? selected.status}</div>
              <div><span className="text-gray-500">Bergabung:</span> {selected.tanggalBergabung?.slice(0, 10)}</div>
              <div><span className="text-gray-500">Masa Kerja:</span> {selected.masaKerja ?? selected.totalMasaKerja} hari</div>
              <div><span className="text-gray-500">No HP:</span> {selected.applicant.noHp}</div>
              <div><span className="text-gray-500">Email:</span> {selected.applicant.email ?? '-'}</div>
              <div><span className="text-gray-500">Alamat:</span> {selected.applicant.alamat}</div>
            </div>

            <div className="mt-4 flex items-start justify-between rounded border border-gray-200 p-3">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <div><span className="text-gray-500">Nama Bank:</span> {selected.namaBank ?? '-'}</div>
                <div><span className="text-gray-500">No Rekening:</span> {selected.noRekening ?? '-'}</div>
              </div>
              <button onClick={() => openBankEdit(selected)} className="text-sm text-navy underline">Edit</button>
            </div>

            <h4 className="mt-5 font-semibold text-navy">Riwayat Penempatan</h4>
            <div className="mt-2 space-y-2">
              {(selected.placements ?? []).length === 0 && <p className="text-sm text-gray-400">Belum ada penempatan.</p>}
              {(selected.placements ?? []).map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded border border-gray-200 px-3 py-2">
                  <div>
                    <span className="text-sm font-medium">{p.vessel?.namaUnit ?? '-'}</span>
                    <span className="ml-2 text-sm text-gray-500">{jabatanName(p.jabatanKode)}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {p.tanggalMulai?.slice(0, 10)} {p.tanggalSelesai ? '– ' + p.tanggalSelesai.slice(0, 10) : '– sekarang'}
                  </span>
                </div>
              ))}
            </div>

            <h4 className="mt-5 font-semibold text-navy">Dokumen</h4>
            <div className="mt-2 space-y-2">
              {(selected.applicant.documents ?? []).map((d) => {
                const expired = d.tanggalExpired ? new Date(d.tanggalExpired) < new Date() : false;
                return (
                  <div key={d.id} className="flex items-center justify-between rounded border border-gray-200 px-3 py-2">
                    <div>
                      <span className="text-sm font-medium">{DOKUMEN_LABEL[d.jenis] ?? d.jenis}</span>
                      {d.tanggalExpired && (
                        <p className={`text-xs ${expired ? 'font-medium text-negative' : 'text-gray-500'}`}>
                          {expired ? 'Expired' : 'Berlaku s/d'}: {d.tanggalExpired.slice(0, 10)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <a href={d.filePath} target="_blank" rel="noreferrer" className="text-sm text-navy underline">Lihat file</a>
                      <button onClick={() => openUpdate(d)} className="text-sm text-navy underline">Perbarui</button>
                    </div>
                  </div>
                );
              })}
              {(selected.applicant.documents ?? []).length === 0 && <p className="text-sm text-gray-400">Belum ada dokumen.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Modal perbarui dokumen */}
      {updateDoc && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <form onSubmit={handleUpdate} className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-navy">Perbarui Dokumen</h3>
            <p className="mt-1 text-sm text-gray-500">{DOKUMEN_LABEL[updateDoc.jenis] ?? updateDoc.jenis}</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs text-gray-500">Dokumen Terbaru (PDF/JPG/PNG)</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setUpdateFile(e.target.files?.[0] ?? null)} className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Tanggal Expired Baru</label>
                <input type="date" value={updateExpired} onChange={(e) => setUpdateExpired(e.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setUpdateDoc(null)} className="rounded px-4 py-2 text-sm text-gray-500">Batal</button>
              <button type="submit" disabled={updateLoading} className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white">{updateLoading ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal edit bank */}
      {bankTarget && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <form onSubmit={handleBankSave} className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-navy">Edit Informasi Bank</h3>
            <p className="mt-1 text-sm text-gray-500">{bankTarget.applicant.namaLengkap}</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs text-gray-500">Nama Bank</label>
                <input value={bankForm.namaBank} onChange={(e) => setBankForm({ ...bankForm, namaBank: e.target.value })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Nomor Rekening</label>
                <input value={bankForm.noRekening} onChange={(e) => setBankForm({ ...bankForm, noRekening: e.target.value })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setBankTarget(null)} className="rounded px-4 py-2 text-sm text-gray-500">Batal</button>
              <button type="submit" disabled={bankLoading} className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white">{bankLoading ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal cairkan leave pay */}
      {cairkanTarget && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <form onSubmit={handleCairkan} className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-navy">Cairkan Leave Pay</h3>
            <p className="mt-1 text-sm text-gray-500">{cairkanTarget.nama} · masa kerja {cairkanTarget.masaKerja} hari</p>
            {error && <div className="mt-3 rounded bg-negative/10 p-3 text-sm text-negative">{error}</div>}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500">Nominal (Rp)</label>
                <input type="number" required value={nominal} onChange={(e) => setNominal(e.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Tanggal Dibayarkan</label>
                <input type="date" required value={tanggalCair} onChange={(e) => setTanggalCair(e.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setCairkanTarget(null)} className="rounded px-4 py-2 text-sm text-gray-500">Batal</button>
              <button type="submit" disabled={cairkanLoading} className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white">{cairkanLoading ? 'Menyimpan...' : 'Cairkan'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal riwayat leave pay */}
      {riwayatTarget && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-bold text-navy">Riwayat Leave Pay — {riwayatTarget.nama}</h3>
              <button onClick={() => setRiwayatTarget(null)} className="rounded px-3 py-1 text-sm text-gray-500 hover:bg-gray-100">Tutup</button>
            </div>
            <table className="mt-3 w-full border-collapse text-sm">
              <thead>
                <tr className="bg-navy-light text-left text-navy">
                  <th className="px-3 py-2">Ke</th>
                  <th className="px-3 py-2">Tanggal Dibayarkan</th>
                  <th className="px-3 py-2 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody>
                {riwayat.length === 0 && (
                  <tr><td colSpan={3} className="px-3 py-6 text-center text-gray-400">Belum ada pencairan.</td></tr>
                )}
                {riwayat.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100">
                    <td className="px-3 py-2">{r.pencairanKe}</td>
                    <td className="px-3 py-2">{r.tanggalPencairan.slice(0, 10)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatRupiah(r.nominal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
