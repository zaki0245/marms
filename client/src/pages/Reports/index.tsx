// client/src/pages/Reports/index.tsx
// [FUNGSI] Halaman Laporan: crew per kapal, dokumen akan expired, masa kerja, leave pay.
// [ALASAN] Admin melihat rangkuman operasional & kelayakan leave pay dari sini.

import { useEffect, useState } from 'react';
import { api, formatRupiah } from '../../api/client';
import { DOKUMEN_LABEL } from '../../constants';

interface PlacementCrew {
  id: string;
  jabatanKode: string;
  tanggalMulai: string;
  vessel?: { id: string; namaUnit: string };
  crew?: { applicant: { namaLengkap: string; posisiDilamar: string } };
}

interface DokumenExpired {
  id: string;
  jenis: string;
  tanggalExpired: string;
  applicant?: { namaLengkap: string };
}

interface CrewMasaKerja {
  id: string;
  status: string;
  totalMasaKerja: number;
  masaKerja?: number;
  applicant: { namaLengkap: string; posisiDilamar: string };
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

export default function Reports() {
  const [tab, setTab] = useState<'kapal' | 'dokumen' | 'masa' | 'leavepay'>('kapal');
  const [crewPerKapal, setCrewPerKapal] = useState<PlacementCrew[]>([]);
  const [dokumen, setDokumen] = useState<DokumenExpired[]>([]);
  const [masa, setMasa] = useState<CrewMasaKerja[]>([]);
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

  async function loadLeavePay() {
    api.get<LeavePayItem[]>('/leave-pay').then(({ data }) => setLeavePay(data)).catch(() => undefined);
  }

  useEffect(() => {
    api.get<PlacementCrew[]>('/reports/crew-per-kapal').then(({ data }) => setCrewPerKapal(data)).catch(() => undefined);
    api.get<DokumenExpired[]>('/reports/dokumen-expired').then(({ data }) => setDokumen(data)).catch(() => undefined);
    api.get<CrewMasaKerja[]>('/reports/masa-kerja').then(({ data }) => setMasa(data)).catch(() => undefined);
    loadLeavePay();
    setLoading(false);
  }, []);

  const grouped = crewPerKapal.reduce((acc, p) => {
    const key = p.vessel?.id ?? 'unknown';
    if (!acc[key]) acc[key] = { vessel: p.vessel, crews: [] };
    acc[key].crews.push(p);
    return acc;
  }, {} as Record<string, { vessel?: { id: string; namaUnit: string }; crews: PlacementCrew[] }>);

  const tabCls = (t: typeof tab) =>
    `px-4 py-2 text-sm font-medium ${tab === t ? 'border-b-2 border-navy text-navy' : 'text-gray-500'}`;

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

  return (
    <div>
      <h2 className="text-2xl font-bold text-navy">Laporan</h2>

      <div className="mt-4 flex gap-1 border-b border-gray-200">
        <button onClick={() => setTab('kapal')} className={tabCls('kapal')}>Crew per Kapal</button>
        <button onClick={() => setTab('dokumen')} className={tabCls('dokumen')}>Dokumen Akan Expired</button>
        <button onClick={() => setTab('masa')} className={tabCls('masa')}>Masa Kerja</button>
        <button onClick={() => setTab('leavepay')} className={tabCls('leavepay')}>Leave Pay</button>
      </div>

      {msg && <div className="mt-3 rounded bg-positive/10 p-3 text-sm text-positive">{msg}</div>}
      {error && <div className="mt-3 rounded bg-negative/10 p-3 text-sm text-negative">{error}</div>}

      {tab === 'kapal' && (
        <div className="mt-4 space-y-4">
          {Object.values(grouped).length === 0 && (
            <p className="text-sm text-gray-400">Tidak ada crew On Board.</p>
          )}
          {Object.values(grouped).map((g) => (
            <div key={g.vessel?.id ?? 'unknown'} className="overflow-hidden rounded-lg bg-white shadow-sm">
              <div className="border-b border-gray-100 px-4 py-3 font-semibold text-navy">{g.vessel?.namaUnit ?? '-'}</div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="px-4 py-2 font-medium">Nama</th>
                    <th className="px-4 py-2 font-medium">Posisi</th>
                    <th className="px-4 py-2 font-medium">Naik Sejak</th>
                  </tr>
                </thead>
                <tbody>
                  {g.crews.map((p) => (
                    <tr key={p.id} className="border-t border-gray-100">
                      <td className="px-4 py-2">{p.crew?.applicant.namaLengkap}</td>
                      <td className="px-4 py-2">{p.crew?.applicant.posisiDilamar}</td>
                      <td className="px-4 py-2">{p.tanggalMulai?.slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {tab === 'dokumen' && (
        <table className="mt-4 w-full border-collapse bg-white text-sm">
          <thead>
            <tr className="bg-navy-light text-left text-navy">
              <th className="px-3 py-2">Nama</th>
              <th className="px-3 py-2">Dokumen</th>
              <th className="px-3 py-2">Expired</th>
            </tr>
          </thead>
          <tbody>
            {dokumen.length === 0 && (
              <tr><td colSpan={3} className="px-3 py-6 text-center text-gray-400">Tidak ada dokumen akan expired 30 hari ke depan.</td></tr>
            )}
            {dokumen.map((d) => (
              <tr key={d.id} className="border-t border-gray-100">
                <td className="px-3 py-2">{d.applicant?.namaLengkap}</td>
                <td className="px-3 py-2">{DOKUMEN_LABEL[d.jenis] ?? d.jenis}</td>
                <td className="px-3 py-2">{d.tanggalExpired.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'masa' && (
        <table className="mt-4 w-full border-collapse bg-white text-sm">
          <thead>
            <tr className="bg-navy-light text-left text-navy">
              <th className="px-3 py-2">Nama</th>
              <th className="px-3 py-2">Posisi</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Masa Kerja</th>
            </tr>
          </thead>
          <tbody>
            {masa.length === 0 && (
              <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-400">Belum ada crew.</td></tr>
            )}
            {masa.map((c) => (
              <tr key={c.id} className="border-t border-gray-100">
                <td className="px-3 py-2">{c.applicant.namaLengkap}</td>
                <td className="px-3 py-2">{c.applicant.posisiDilamar}</td>
                <td className="px-3 py-2">{CREW_STATUS[c.status] ?? c.status}</td>
                <td className="px-3 py-2 text-right tabular-nums">{c.masaKerja ?? c.totalMasaKerja} hari</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'leavepay' && (
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
            {leavePay.map((c) => (
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
