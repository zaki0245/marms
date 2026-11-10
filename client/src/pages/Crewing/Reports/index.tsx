// client/src/pages/Crewing/Reports/index.tsx
// [FUNGSI] Halaman Laporan: crew per kapal (dengan masa kerja & detail).
// [ALASAN] Admin melihat rangkuman operasional crew per kapal.
//          Leave Pay sudah dipindah ke halaman Payroll.

import { useEffect, useState } from 'react';
import { api } from '../../../api/client';
import { DOKUMEN_LABEL, sortByJabatan } from '../../../constants';
import { SortableTh, sortRows, useSort } from '../../../components/sortable';

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

const CREW_STATUS: Record<string, string> = {
  AVAILABLE: 'Tersedia',
  ON_BOARD: 'On Board',
  OFF_BOARD: 'Off Board',
};

// [FUNGSI] Nilai filter khusus untuk crew tanpa penempatan aktif (off board/available).
const TANPA_KAPAL = '__tanpa-kapal';

export default function Reports() {
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
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const { sort, toggle } = useSort();

  useEffect(() => {
    api.get<Crew[]>('/reports/crew-per-kapal').then(({ data }) => setCrewList(data)).catch(() => undefined);
    api.get<Vessel[]>('/kapal').then(({ data }) => setKapal(data)).catch(() => undefined);
    api.get<Jabatan[]>('/master-data/jabatan').then(({ data }) => setJabatan(data)).catch(() => undefined);
    setLoading(false);
  }, []);

  function jabatanName(kode: string) {
    return jabatan.find((j) => j.kode === kode)?.nama ?? kode;
  }

  function activePlacement(c: Crew) {
    return (c.placements ?? []).find((p) => p.status === 'AKTIF');
  }

  const filteredByVessel = vesselFilter
    ? crewList.filter((c) => {
        const active = activePlacement(c);
        if (vesselFilter === TANPA_KAPAL) return !active;
        return active?.vessel?.id === vesselFilter;
      })
    : crewList;
  // [FUNGSI] Urutkan sesuai hierarki jabatan (placement AKTIF), lalu nama.
  const filtered = sortByJabatan(
    filteredByVessel,
    (c) => activePlacement(c)?.jabatanKode ?? c.applicant.posisiDilamar,
    (c) => c.applicant.namaLengkap,
  );

  const grouped = filtered.reduce((acc, c) => {
    const active = activePlacement(c);
    const key = active?.vessel?.id ?? 'unknown';
    if (!acc[key]) acc[key] = { vessel: active?.vessel, crews: [] };
    acc[key].crews.push(c);
    return acc;
  }, {} as Record<string, { vessel?: Vessel; crews: Crew[] }>);

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

  if (loading) return <p className="text-gray-500">Memuat...</p>;

  return (
    <div>
      <h1 className="page-title">Laporan</h1>

      {msg && <div className="mt-3 alert-success">{msg}</div>}
      {error && <div className="mt-3 alert-error">{error}</div>}

      <div className="mt-4 flex items-center gap-2">
        <label className="text-sm text-gray-600">Filter Kapal:</label>
        <select
          value={vesselFilter}
          onChange={(e) => setVesselFilter(e.target.value)}
          className="input"
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
          <p className="text-sm text-gray-500">Tidak ada crew.</p>
        )}
        {Object.values(grouped).map((g) => (
          <div key={g.vessel?.id ?? 'unknown'} className="overflow-hidden card">
            <div className="border-b border-gray-100 px-4 py-3 font-semibold text-gray-900">{g.vessel?.namaUnit ?? 'Tanpa Kapal'}</div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <SortableTh label="Nama" sortKey="nama" sort={sort} onSort={toggle} className="px-4 py-2 font-medium" />
                  <SortableTh label="Posisi" sortKey="posisi" sort={sort} onSort={toggle} className="px-4 py-2 font-medium" />
                  <SortableTh label="Naik Sejak" sortKey="naikSejak" sort={sort} onSort={toggle} className="px-4 py-2 font-medium" />
                  <SortableTh label="Masa Kerja" sortKey="masaKerja" sort={sort} onSort={toggle} className="px-4 py-2 text-right font-medium" />
                  <th className="px-4 py-2 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {sortRows(g.crews, sort, {
                  nama: (c) => c.applicant.namaLengkap,
                  posisi: (c) => {
                    const active = activePlacement(c);
                    return active ? jabatanName(active.jabatanKode) : c.applicant.posisiDilamar;
                  },
                  naikSejak: (c) => activePlacement(c)?.tanggalMulai ?? '',
                  masaKerja: (c) => c.masaKerja ?? c.totalMasaKerja,
                }).map((c) => {
                  const active = activePlacement(c);
                  return (
                    <tr key={c.id} className="border-t border-gray-100">
                      <td className="px-4 py-2">{c.applicant.namaLengkap}</td>
                      <td className="px-4 py-2">{active ? jabatanName(active.jabatanKode) : c.applicant.posisiDilamar}</td>
                      <td className="px-4 py-2">{active?.tanggalMulai?.slice(0, 10) ?? '-'}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{c.masaKerja ?? c.totalMasaKerja} hari</td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={() => openDetail(c)} className="text-gray-700 hover:text-gray-900">Detail</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Modal detail crew */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-card p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selected.applicant.namaLengkap}</h3>
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
              <button onClick={() => openBankEdit(selected)} className="text-sm text-gray-700 underline hover:text-gray-900">Edit</button>
            </div>

            <h4 className="mt-5 font-semibold text-gray-900">Riwayat Penempatan</h4>
            <div className="mt-2 space-y-2">
              {(selected.placements ?? []).length === 0 && <p className="text-sm text-gray-500">Belum ada penempatan.</p>}
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

            <h4 className="mt-5 font-semibold text-gray-900">Dokumen</h4>
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
                      <a href={d.filePath} target="_blank" rel="noreferrer" className="text-sm text-gray-700 underline hover:text-gray-900">Lihat file</a>
                      <button onClick={() => openUpdate(d)} className="text-sm text-gray-700 underline hover:text-gray-900">Perbarui</button>
                    </div>
                  </div>
                );
              })}
              {(selected.applicant.documents ?? []).length === 0 && <p className="text-sm text-gray-500">Belum ada dokumen.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Modal perbarui dokumen */}
      {updateDoc && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <form onSubmit={handleUpdate} className="w-full max-w-sm rounded-lg bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Perbarui Dokumen</h3>
            <p className="mt-1 text-sm text-gray-500">{DOKUMEN_LABEL[updateDoc.jenis] ?? updateDoc.jenis}</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="label">Dokumen Terbaru (PDF/JPG/PNG)</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setUpdateFile(e.target.files?.[0] ?? null)} className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="label">Tanggal Expired Baru</label>
                <input type="date" value={updateExpired} onChange={(e) => setUpdateExpired(e.target.value)} className="input mt-1 w-full" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setUpdateDoc(null)} className="btn-ghost">Batal</button>
              <button type="submit" disabled={updateLoading} className="btn-primary">{updateLoading ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal edit bank */}
      {bankTarget && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <form onSubmit={handleBankSave} className="w-full max-w-sm rounded-lg bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Edit Informasi Bank</h3>
            <p className="mt-1 text-sm text-gray-500">{bankTarget.applicant.namaLengkap}</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="label">Nama Bank</label>
                <input value={bankForm.namaBank} onChange={(e) => setBankForm({ ...bankForm, namaBank: e.target.value })} className="input mt-1 w-full" />
              </div>
              <div>
                <label className="label">Nomor Rekening</label>
                <input value={bankForm.noRekening} onChange={(e) => setBankForm({ ...bankForm, noRekening: e.target.value })} className="input mt-1 w-full" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setBankTarget(null)} className="btn-ghost">Batal</button>
              <button type="submit" disabled={bankLoading} className="btn-primary">{bankLoading ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
