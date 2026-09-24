// client/src/pages/Crew/index.tsx
// [FUNGSI] Halaman Kru & Penempatan: Pool Kandidat (assign ke kapal) + Crew (filter & status).
// [ALASAN] Admin menempatkan kandidat ke kapal dan memantau status + masa kerja crew.

import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { DOKUMEN_LABEL } from '../../constants';

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
  email: string;
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

const ALASAN: Record<string, string> = {
  RELIEF: 'Relief',
  END_OF_CONTRACT: 'End of Contract',
};

interface AssignTarget {
  type: 'applicant' | 'crew';
  id: string;
  nama: string;
  posisi: string;
}

export default function Crew() {
  const [tab, setTab] = useState<'pool' | 'crew' | 'offboard'>('pool');
  const [pool, setPool] = useState<Applicant[]>([]);
  const [crew, setCrew] = useState<Crew[]>([]);
  const [jabatan, setJabatan] = useState<Jabatan[]>([]);
  const [kapal, setKapal] = useState<Vessel[]>([]);
  const [vesselFilter, setVesselFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Crew | null>(null);
  const [assignTarget, setAssignTarget] = useState<AssignTarget | null>(null);
  const [assignForm, setAssignForm] = useState({ jabatanKode: '', vesselId: '', tanggalMulai: '', namaBank: '', noRekening: '' });
  const [assigning, setAssigning] = useState(false);
  const [offBoardTarget, setOffBoardTarget] = useState<Crew | null>(null);
  const [offBoardForm, setOffBoardForm] = useState({ alasan: 'RELIEF', tanggal: '' });
  const [offBoarding, setOffBoarding] = useState(false);
  const [updateDoc, setUpdateDoc] = useState<Dokumen | null>(null);
  const [updateFile, setUpdateFile] = useState<File | null>(null);
  const [updateExpired, setUpdateExpired] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [bankTarget, setBankTarget] = useState<Crew | null>(null);
  const [bankForm, setBankForm] = useState({ namaBank: '', noRekening: '' });
  const [bankLoading, setBankLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  async function loadPool() {
    try {
      const { data } = await api.get<Applicant[]>('/recruitment/kandidat');
      setPool(data);
    } catch {
      // ignore
    }
  }

  async function loadCrew() {
    try {
      const { data } = await api.get<Crew[]>('/crew');
      setCrew(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPool();
    loadCrew();
    api.get<Jabatan[]>('/master-data/jabatan').then(({ data }) => setJabatan(data)).catch(() => undefined);
    api.get<Vessel[]>('/master-data/kapal').then(({ data }) => setKapal(data)).catch(() => undefined);
  }, []);

  function jabatanName(kode: string) {
    return jabatan.find((j) => j.kode === kode)?.nama ?? kode;
  }

  function activePlacement(c: Crew) {
    return (c.placements ?? []).find((p) => p.status === 'AKTIF');
  }

  function openAssignApplicant(p: Applicant) {
    const match = jabatan.find((j) => j.nama === p.posisiDilamar);
    setAssignForm({ jabatanKode: match?.kode ?? '', vesselId: '', tanggalMulai: '', namaBank: '', noRekening: '' });
    setAssignTarget({ type: 'applicant', id: p.id, nama: p.namaLengkap, posisi: p.posisiDilamar });
    setError('');
  }

  function openAssignCrew(c: Crew) {
    const active = activePlacement(c);
    const kode = active?.jabatanKode ?? jabatan.find((j) => j.nama === c.applicant.posisiDilamar)?.kode ?? '';
    setAssignForm({ jabatanKode: kode, vesselId: '', tanggalMulai: '', namaBank: c.namaBank ?? '', noRekening: c.noRekening ?? '' });
    setAssignTarget({ type: 'crew', id: c.id, nama: c.applicant.namaLengkap, posisi: c.applicant.posisiDilamar });
    setError('');
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!assignTarget) return;
    setAssigning(true);
    setError('');
    try {
      const payload = {
        jabatanKode: assignForm.jabatanKode,
        vesselId: assignForm.vesselId,
        tanggalMulai: assignForm.tanggalMulai,
        namaBank: assignForm.namaBank,
        noRekening: assignForm.noRekening,
      };
      if (assignTarget.type === 'applicant') {
        await api.post(`/crew/assign-applicant/${assignTarget.id}`, payload);
      } else {
        await api.post(`/crew/${assignTarget.id}/assign`, payload);
      }
      setAssignTarget(null);
      setMsg('Crew berhasil ditempatkan di kapal');
      loadPool();
      loadCrew();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal menempatkan crew');
    } finally {
      setAssigning(false);
    }
  }

  function openOffBoard(c: Crew) {
    setOffBoardForm({ alasan: 'RELIEF', tanggal: '' });
    setOffBoardTarget(c);
    setError('');
  }

  async function handleOffBoard(e: React.FormEvent) {
    e.preventDefault();
    if (!offBoardTarget) return;
    setOffBoarding(true);
    setError('');
    try {
      await api.post(`/crew/${offBoardTarget.id}/offboard`, {
        alasan: offBoardForm.alasan,
        offBoardTanggal: offBoardForm.tanggal,
      });
      setOffBoardTarget(null);
      setMsg('Crew berhasil off board');
      loadCrew();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal off board');
    } finally {
      setOffBoarding(false);
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

  const activeCrew = crew.filter((c) => c.status !== 'OFF_BOARD');
  const filteredCrew = vesselFilter
    ? activeCrew.filter((c) => activePlacement(c)?.vessel?.id === vesselFilter)
    : activeCrew;
  const offBoardCrew = crew.filter((c) => c.status === 'OFF_BOARD');

  return (
    <div>
      <h2 className="text-2xl font-bold text-navy">Crew & Penempatan</h2>

      <div className="mt-4 flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setTab('pool')}
          className={`px-4 py-2 text-sm font-medium ${tab === 'pool' ? 'border-b-2 border-navy text-navy' : 'text-gray-500'}`}
        >
          Pool Kandidat
        </button>
        <button
          onClick={() => setTab('crew')}
          className={`px-4 py-2 text-sm font-medium ${tab === 'crew' ? 'border-b-2 border-navy text-navy' : 'text-gray-500'}`}
        >
          Crew
        </button>
        <button
          onClick={() => setTab('offboard')}
          className={`px-4 py-2 text-sm font-medium ${tab === 'offboard' ? 'border-b-2 border-navy text-navy' : 'text-gray-500'}`}
        >
          Off Board
        </button>
      </div>

      {msg && <div className="mt-3 rounded bg-positive/10 p-3 text-sm text-positive">{msg}</div>}
      {error && <div className="mt-3 rounded bg-negative/10 p-3 text-sm text-negative">{error}</div>}

      {tab === 'pool' && (
        <table className="mt-4 w-full border-collapse bg-white text-sm">
          <thead>
            <tr className="bg-navy-light text-left text-navy">
              <th className="px-3 py-2">No. Pendaftaran</th>
              <th className="px-3 py-2">Nama</th>
              <th className="px-3 py-2">Posisi</th>
              <th className="px-3 py-2">No HP</th>
              <th className="px-3 py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pool.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-gray-400">
                  Tidak ada kandidat. Ubah status pelamar jadi "Diterima" dulu di menu Rekrutmen.
                </td>
              </tr>
            )}
            {pool.map((p) => (
              <tr key={p.id} className="border-t border-gray-100">
                <td className="px-3 py-2 font-mono">{p.nomorPendaftaran}</td>
                <td className="px-3 py-2">{p.namaLengkap}</td>
                <td className="px-3 py-2">{p.posisiDilamar}</td>
                <td className="px-3 py-2">{p.noHp}</td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => openAssignApplicant(p)} className="rounded bg-navy px-3 py-1 text-xs font-semibold text-white">
                    Assign ke Kapal
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'crew' && (
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
            </select>
          </div>

          <table className="mt-4 w-full border-collapse bg-white text-sm">
            <thead>
              <tr className="bg-navy-light text-left text-navy">
                <th className="px-3 py-2">Nama</th>
                <th className="px-3 py-2">Jabatan</th>
                <th className="px-3 py-2">Kapal</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Masa Kerja</th>
                <th className="px-3 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredCrew.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-gray-400">Belum ada crew.</td>
                </tr>
              )}
              {filteredCrew.map((c) => {
                const active = activePlacement(c);
                return (
                  <tr key={c.id} className="border-t border-gray-100">
                    <td className="px-3 py-2">{c.applicant.namaLengkap}</td>
                    <td className="px-3 py-2">{active ? jabatanName(active.jabatanKode) : c.applicant.posisiDilamar}</td>
                    <td className="px-3 py-2">{active?.vessel?.namaUnit ?? '-'}</td>
                    <td className="px-3 py-2">{CREW_STATUS[c.status] ?? c.status}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{c.masaKerja ?? c.totalMasaKerja} hari</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      {c.status === 'ON_BOARD' ? (
                        <button onClick={() => openOffBoard(c)} className="text-negative hover:underline">Off Board</button>
                      ) : (
                        <button onClick={() => openAssignCrew(c)} className="text-positive hover:underline">Assign</button>
                      )}
                      <button onClick={() => openDetail(c)} className="ml-3 text-navy hover:underline">Detail</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'offboard' && (
        <table className="mt-4 w-full border-collapse bg-white text-sm">
          <thead>
            <tr className="bg-navy-light text-left text-navy">
              <th className="px-3 py-2">Nama</th>
              <th className="px-3 py-2">Posisi</th>
              <th className="px-3 py-2 text-right">Masa Kerja</th>
              <th className="px-3 py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {offBoardCrew.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-gray-400">Tidak ada crew off board.</td>
              </tr>
            )}
            {offBoardCrew.map((c) => (
              <tr key={c.id} className="border-t border-gray-100">
                <td className="px-3 py-2">{c.applicant.namaLengkap}</td>
                <td className="px-3 py-2">{c.applicant.posisiDilamar}</td>
                <td className="px-3 py-2 text-right tabular-nums">{c.masaKerja ?? c.totalMasaKerja} hari</td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <button onClick={() => openAssignCrew(c)} className="text-positive hover:underline">Assign</button>
                  <button onClick={() => openDetail(c)} className="ml-3 text-navy hover:underline">Detail</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal detail */}
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
              <div><span className="text-gray-500">Email:</span> {selected.applicant.email}</div>
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

      {/* Modal assign */}
      {assignTarget && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <form onSubmit={handleAssign} className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-navy">Assign ke Kapal</h3>
            <p className="mt-1 text-sm text-gray-500">{assignTarget.nama} · {assignTarget.posisi}</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs text-gray-500">Jabatan</label>
                <select required value={assignForm.jabatanKode} onChange={(e) => setAssignForm({ ...assignForm, jabatanKode: e.target.value })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2">
                  <option value="">Pilih jabatan</option>
                  {jabatan.map((j) => <option key={j.kode} value={j.kode}>{j.nama}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500">Kapal</label>
                <select required value={assignForm.vesselId} onChange={(e) => setAssignForm({ ...assignForm, vesselId: e.target.value })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2">
                  <option value="">Pilih kapal</option>
                  {kapal.map((k) => <option key={k.id} value={k.id}>{k.namaUnit}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500">Tanggal Mulai On Board</label>
                <input required type="date" value={assignForm.tanggalMulai} onChange={(e) => setAssignForm({ ...assignForm, tanggalMulai: e.target.value })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Nama Bank</label>
                <input value={assignForm.namaBank} onChange={(e) => setAssignForm({ ...assignForm, namaBank: e.target.value })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" placeholder="Contoh: BCA" />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Nomor Rekening</label>
                <input value={assignForm.noRekening} onChange={(e) => setAssignForm({ ...assignForm, noRekening: e.target.value })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" placeholder="Contoh: 1234567890" />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setAssignTarget(null)} className="rounded px-4 py-2 text-sm text-gray-500">Batal</button>
              <button type="submit" disabled={assigning} className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white">{assigning ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal off board */}
      {offBoardTarget && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <form onSubmit={handleOffBoard} className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-navy">Off Board</h3>
            <p className="mt-1 text-sm text-gray-500">{offBoardTarget.applicant.namaLengkap}</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs text-gray-500">Alasan</label>
                <select value={offBoardForm.alasan} onChange={(e) => setOffBoardForm({ ...offBoardForm, alasan: e.target.value })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2">
                  {Object.entries(ALASAN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500">Tanggal Off Board</label>
                <input required type="date" value={offBoardForm.tanggal} onChange={(e) => setOffBoardForm({ ...offBoardForm, tanggal: e.target.value })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setOffBoardTarget(null)} className="rounded px-4 py-2 text-sm text-gray-500">Batal</button>
              <button type="submit" disabled={offBoarding} className="rounded bg-negative px-4 py-2 text-sm font-semibold text-white">{offBoarding ? 'Menyimpan...' : 'Off Board'}</button>
            </div>
          </form>
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
    </div>
  );
}
