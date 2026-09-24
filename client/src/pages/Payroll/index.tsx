// client/src/pages/Payroll/index.tsx
// [FUNGSI] Halaman Payroll & Uang Makan: dua tab (Payroll / Uang Makan) dalam satu submodul.
// [ALASAN] Menghitung gaji prorata dan uang makan prorata secara terpisah namun satu menu.

import { useEffect, useState } from 'react';
import { api, formatRupiah } from '../../api/client';
import { exportExcel, exportPdf } from '../../utils/export';

interface Vessel {
  id: string;
  namaUnit: string;
}

interface PayrollDetail {
  id: string;
  jabatanKode: string;
  jabatanNama: string;
  periodeKerja: string;
  hariAktif: number;
  gajiPokokSnapshot: number;
  gajiProrata: number;
  uangMakanSnapshot: number;
  uangMakanProrata: number;
  total: number;
  namaBank?: string | null;
  noRekening?: string | null;
  crew?: { applicant: { namaLengkap: string } };
}

interface Payroll {
  id: string;
  vesselId: string;
  bulan: number;
  tahun: number;
  jumlahHari: number;
  jenis: string;
  status: string;
  tanggalFinalisasi?: string | null;
  tanggalPembayaran?: string | null;
  vessel?: Vessel;
  _count?: { details: number };
  details?: PayrollDetail[];
}

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draf',
  FINAL: 'Final',
  DIBAYAR: 'Dibayar',
};

function statusBadge(s: string) {
  const base = 'rounded px-2 py-0.5 text-xs font-medium';
  if (s === 'DIBAYAR') return `${base} bg-positive/10 text-positive`;
  if (s === 'FINAL') return `${base} bg-navy/10 text-navy`;
  return `${base} bg-amber-100 text-amber-700`;
}

export default function Payroll() {
  const [jenis, setJenis] = useState<'GAJI' | 'UANG_MAKAN'>('GAJI');
  const isGaji = jenis === 'GAJI';
  const [items, setItems] = useState<Payroll[]>([]);
  const [kapal, setKapal] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGen, setShowGen] = useState(false);
  const [genForm, setGenForm] = useState({ vesselId: '', bulan: 1, tahun: new Date().getFullYear() });
  const [generating, setGenerating] = useState(false);
  const [selected, setSelected] = useState<Payroll | null>(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      const { data } = await api.get<Payroll[]>('/payroll');
      setItems(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    api.get<Vessel[]>('/master-data/kapal').then(({ data }) => setKapal(data)).catch(() => undefined);
  }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    setError('');
    setMsg('');
    try {
      await api.post('/payroll', {
        vesselId: genForm.vesselId,
        bulan: Number(genForm.bulan),
        tahun: Number(genForm.tahun),
        jenis,
      });
      setShowGen(false);
      setMsg('Draft berhasil dibuat');
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal generate');
    } finally {
      setGenerating(false);
    }
  }

  async function openDetail(p: Payroll) {
    try {
      const { data } = await api.get<Payroll>(`/payroll/${p.id}`);
      setSelected(data);
    } catch {
      // ignore
    }
  }

  async function finalize(id: string) {
    setError('');
    if (!window.confirm('Finalisasi? Nilai akan dikunci (snapshot).')) return;
    try {
      await api.post(`/payroll/${id}/finalize`);
      setMsg('Berhasil difinalisasi');
      load();
      setSelected(null);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal finalisasi');
    }
  }

  async function markPaid(id: string) {
    setError('');
    if (!window.confirm('Tandai sudah dibayar?')) return;
    try {
      await api.post(`/payroll/${id}/mark-paid`);
      setMsg('Ditandai dibayar');
      load();
      setSelected(null);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal menandai dibayar');
    }
  }

  async function remove(id: string) {
    setError('');
    if (!window.confirm('Hapus draft ini?')) return;
    try {
      await api.delete(`/payroll/${id}`);
      setMsg('Draft dihapus');
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal menghapus');
    }
  }

  const filtered = items.filter((p) => p.jenis === jenis);
  const totalKeseluruhan = (selected?.details ?? []).reduce((s, d) => s + d.total, 0);

  // [FUNGSI] Susun data untuk export Excel/PDF.
  function buildExportSheet() {
    const vessel = selected?.vessel?.namaUnit ?? 'Payroll';
    const periode = selected ? `${BULAN[selected.bulan - 1]} ${selected.tahun}` : '';
    const columns = isGaji
      ? ['Nama', 'Jabatan', 'Nama Bank', 'No Rekening', 'Periode', 'Hari', 'Gaji Pokok', 'Gaji Prorata', 'Total']
      : ['Nama', 'Jabatan', 'Nama Bank', 'No Rekening', 'Periode', 'Hari', 'U. Makan/bln', 'U. Makan Prorata', 'Total'];
    const rows = (selected?.details ?? []).map((d) =>
      isGaji
        ? [d.crew?.applicant.namaLengkap ?? '', d.jabatanNama, d.namaBank ?? '', d.noRekening ?? '', d.periodeKerja, d.hariAktif, formatRupiah(d.gajiPokokSnapshot), formatRupiah(d.gajiProrata), formatRupiah(d.total)]
        : [d.crew?.applicant.namaLengkap ?? '', d.jabatanNama, d.namaBank ?? '', d.noRekening ?? '', d.periodeKerja, d.hariAktif, formatRupiah(d.uangMakanSnapshot), formatRupiah(d.uangMakanProrata), formatRupiah(d.total)],
    );
    const safe = (t: string) => t.replace(/\s+/g, '-');
    return {
      title: `${isGaji ? 'Payroll Gaji' : 'Uang Makan'} — ${vessel}`,
      subtitle: selected ? `${periode} · ${selected.jumlahHari} hari` : '',
      filename: `${safe(vessel)}-${safe(periode)}-${isGaji ? 'gaji' : 'uang-makan'}`,
      columns,
      rows,
      totalLabel: 'Total Keseluruhan',
      totalValue: formatRupiah(totalKeseluruhan),
    };
  }

  function handleExportExcel() {
    exportExcel(buildExportSheet());
  }

  function handleExportPdf() {
    exportPdf(buildExportSheet());
  }

  const tabCls = (t: 'GAJI' | 'UANG_MAKAN') =>
    `px-4 py-2 text-sm font-medium ${jenis === t ? 'border-b-2 border-navy text-navy' : 'text-gray-500'}`;

  return (
    <div>
      <h2 className="text-2xl font-bold text-navy">Payroll & Uang Makan</h2>

      <div className="mt-4 flex gap-1 border-b border-gray-200">
        <button onClick={() => setJenis('GAJI')} className={tabCls('GAJI')}>Payroll</button>
        <button onClick={() => setJenis('UANG_MAKAN')} className={tabCls('UANG_MAKAN')}>Uang Makan</button>
      </div>

      <div className="mt-4 flex justify-end">
        <button onClick={() => { setGenForm({ vesselId: '', bulan: 1, tahun: new Date().getFullYear() }); setError(''); setShowGen(true); }} className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white">
          + Buat {isGaji ? 'Gaji' : 'Uang Makan'}
        </button>
      </div>

      {msg && <div className="mt-3 rounded bg-positive/10 p-3 text-sm text-positive">{msg}</div>}
      {error && <div className="mt-3 rounded bg-negative/10 p-3 text-sm text-negative">{error}</div>}

      {loading ? (
        <p className="mt-6 text-gray-500">Memuat...</p>
      ) : (
        <table className="mt-4 w-full border-collapse bg-white text-sm">
          <thead>
            <tr className="bg-navy-light text-left text-navy">
              <th className="px-3 py-2">Kapal</th>
              <th className="px-3 py-2">Periode</th>
              <th className="px-3 py-2 text-right">Hari</th>
              <th className="px-3 py-2 text-right">Crew</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">Belum ada data.</td></tr>
            )}
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-gray-100">
                <td className="px-3 py-2">{p.vessel?.namaUnit ?? '-'}</td>
                <td className="px-3 py-2">{BULAN[p.bulan - 1]} {p.tahun}</td>
                <td className="px-3 py-2 text-right tabular-nums">{p.jumlahHari}</td>
                <td className="px-3 py-2 text-right tabular-nums">{p._count?.details ?? 0}</td>
                <td className="px-3 py-2"><span className={statusBadge(p.status)}>{STATUS_LABEL[p.status]}</span></td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <button onClick={() => openDetail(p)} className="text-navy hover:underline">Detail</button>
                  {p.status === 'DRAFT' && (
                    <>
                      <button onClick={() => finalize(p.id)} className="ml-3 text-positive hover:underline">Final</button>
                      <button onClick={() => remove(p.id)} className="ml-3 text-negative hover:underline">Hapus</button>
                    </>
                  )}
                  {p.status === 'FINAL' && (
                    <button onClick={() => markPaid(p.id)} className="ml-3 text-positive hover:underline">Tandai Dibayar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal generate */}
      {showGen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <form onSubmit={handleGenerate} className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-navy">Buat {isGaji ? 'Gaji' : 'Uang Makan'}</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs text-gray-500">Kapal</label>
                <select required value={genForm.vesselId} onChange={(e) => setGenForm({ ...genForm, vesselId: e.target.value })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2">
                  <option value="">Pilih kapal</option>
                  {kapal.map((k) => <option key={k.id} value={k.id}>{k.namaUnit}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500">Bulan</label>
                  <select value={genForm.bulan} onChange={(e) => setGenForm({ ...genForm, bulan: Number(e.target.value) })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2">
                    {BULAN.map((b, i) => <option key={b} value={i + 1}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Tahun</label>
                  <input type="number" value={genForm.tahun} onChange={(e) => setGenForm({ ...genForm, tahun: Number(e.target.value) })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setShowGen(false)} className="rounded px-4 py-2 text-sm text-gray-500">Batal</button>
              <button type="submit" disabled={generating} className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white">{generating ? 'Membuat...' : 'Buat'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal detail */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="w-full max-w-4xl rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-navy">{selected.vessel?.namaUnit} — {BULAN[selected.bulan - 1]} {selected.tahun}</h3>
                <p className="text-sm text-gray-500">{selected.jumlahHari} hari · <span className={statusBadge(selected.status)}>{STATUS_LABEL[selected.status]}</span></p>
              </div>
              <button onClick={() => setSelected(null)} className="rounded px-3 py-1 text-sm text-gray-500 hover:bg-gray-100">Tutup</button>
            </div>

            <table className="mt-4 w-full border-collapse text-sm">
              <thead>
                <tr className="bg-navy-light text-left text-navy">
                  <th className="px-3 py-2">Nama</th>
                  <th className="px-3 py-2">Jabatan</th>
                  <th className="px-3 py-2">Nama Bank</th>
                  <th className="px-3 py-2">No Rekening</th>
                  <th className="px-3 py-2">Periode</th>
                  <th className="px-3 py-2 text-right">Hari</th>
                  {isGaji ? (
                    <>
                      <th className="px-3 py-2 text-right">Gaji Pokok</th>
                      <th className="px-3 py-2 text-right">Gaji Prorata</th>
                    </>
                  ) : (
                    <>
                      <th className="px-3 py-2 text-right">U.Makan/bln</th>
                      <th className="px-3 py-2 text-right">U.Makan Prorata</th>
                    </>
                  )}
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {(selected.details ?? []).length === 0 && (
                  <tr><td colSpan={9} className="px-3 py-6 text-center text-gray-400">Tidak ada crew aktif bulan ini.</td></tr>
                )}
                {(selected.details ?? []).map((d) => (
                  <tr key={d.id} className="border-t border-gray-100">
                    <td className="px-3 py-2">{d.crew?.applicant.namaLengkap}</td>
                    <td className="px-3 py-2">{d.jabatanNama}</td>
                    <td className="px-3 py-2">{d.namaBank ?? '-'}</td>
                    <td className="px-3 py-2">{d.noRekening ?? '-'}</td>
                    <td className="px-3 py-2 font-mono">{d.periodeKerja}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{d.hariAktif}</td>
                    {isGaji ? (
                      <>
                        <td className="px-3 py-2 text-right tabular-nums">{formatRupiah(d.gajiPokokSnapshot)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatRupiah(d.gajiProrata)}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-2 text-right tabular-nums">{formatRupiah(d.uangMakanSnapshot)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatRupiah(d.uangMakanProrata)}</td>
                      </>
                    )}
                    <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatRupiah(d.total)}</td>
                  </tr>
                ))}
              </tbody>
              {selected.details && selected.details.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-navy bg-navy-light font-bold text-navy">
                    <td colSpan={8} className="px-3 py-2 text-right">Total Keseluruhan</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatRupiah(totalKeseluruhan)}</td>
                  </tr>
                </tfoot>
              )}
            </table>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={handleExportExcel} className="rounded border border-navy px-4 py-2 text-sm font-semibold text-navy">Export Excel</button>
              <button onClick={handleExportPdf} className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white">Export PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
