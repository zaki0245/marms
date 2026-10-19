// client/src/pages/public/Approve.tsx
// [FUNGSI] Halaman publik approval invoice (dibuka dari tautan email).
// [ALASAN] Approver tidak login; tautan membawa token unik untuk identifikasi invoice.

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/client';

interface ApproveInfo {
  no: string;
  jenis: string;
  kategori: string;
  tipe: string;
  tanggal: string;
  bupot: string | null;
  vendorName: string | null;
  vendorNpwp: string | null;
  vendorAlamat: string | null;
  bank: string | null;
  bankAccountNo: string | null;
  bankAccountName: string | null;
  inv: string | null;
  ref: string | null;
  keterangan: string | null;
  dpp: number;
  ppn: number | null;
  pphPasal: string | null;
  pph: number | null;
  total: number;
  dueDate: string | null;
  masaPajakPPN: string | null;
  masaPajakPPH: string | null;
  statusFakturPajak: string;
  fakturPajak: string[];
  approvalStatus: string;
  approvedAt: string | null;
}

const KATEGORI: Record<string, string> = { FREIGHT: 'Freight', OPERATION: 'Operation', OTHERS: 'Others' };
const TIPE: Record<string, string> = { REGULAR: 'Regular', DP: 'DP', PELUNASAN: 'Pelunasan' };
const FAKTUR: Record<string, string> = { SUDAH_DITERIMA: 'Sudah diterima', BELUM_DITERIMA: 'Belum diterima', TIDAK_ADA: 'Tidak ada' };

function formatRp(n: unknown): string {
  return 'Rp ' + Number(n || 0).toLocaleString('id-ID');
}

function formatDate(v: string | null): string {
  if (!v) return '-';
  return new Date(v).toLocaleDateString('id-ID');
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-gray-100 py-2 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}

export default function Approve() {
  const { token } = useParams();
  const [info, setInfo] = useState<ApproveInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.get<ApproveInfo>(`/approve/${token}`)
      .then(({ data }) => setInfo(data))
      .catch(() => setError('Tautan approval tidak valid atau sudah kadaluarsa.'))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleApprove() {
    if (!token) return;
    setError('');
    try {
      await api.post(`/approve/${token}`);
      setInfo((i) => (i ? { ...i, approvalStatus: 'SUDAH_DIAPPROVE' } : i));
      setDone(true);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal menyetujui');
    }
  }

  const alreadyApproved = info?.approvalStatus === 'SUDAH_DIAPPROVE';

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-navy px-6 py-4 text-white">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between">
          <span className="text-lg font-bold tracking-wide">MARMS</span>
          <span className="hidden text-sm text-white/70 sm:block">Approval Invoice</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 py-10">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-navy">Approval Invoice</h1>

          {loading && <p className="mt-4 text-gray-500">Memuat...</p>}
          {error && <div className="mt-4 rounded bg-negative/10 p-3 text-sm text-negative">{error}</div>}

          {!loading && info && (
            <>
              <div className="mt-4 space-y-1">
                <Row label="No Invoice" value={info.no} />
                <Row label="Jenis" value={info.jenis} />
                <Row label="Kategori" value={KATEGORI[info.kategori] ?? info.kategori} />
                <Row label="Tipe" value={TIPE[info.tipe] ?? info.tipe} />
                <Row label="Tanggal" value={formatDate(info.tanggal)} />
                <Row label="Bupot" value={info.bupot ?? '-'} />
                <Row label="Vendor" value={info.vendorName ?? '-'} />
                <Row label="NPWP Vendor" value={info.vendorNpwp ?? '-'} />
                <Row label="Alamat Vendor" value={info.vendorAlamat ?? '-'} />
                <Row label="Bank" value={info.bank ?? '-'} />
                <Row label="No Rekening" value={info.bankAccountNo ?? '-'} />
                <Row label="Atas Nama" value={info.bankAccountName ?? '-'} />
                <Row label="Nomor Invoice (vendor)" value={info.inv ?? '-'} />
                <Row label="REF" value={info.ref ?? '-'} />
                <Row label="Keterangan" value={info.keterangan ?? '-'} />
                <Row label="DPP" value={formatRp(info.dpp)} />
                <Row label="PPN" value={formatRp(info.ppn)} />
                <Row label="PPh Pasal" value={info.pphPasal ?? '-'} />
                <Row label="PPh" value={formatRp(info.pph)} />
                <Row label="Total" value={formatRp(info.total)} />
                <Row label="Jatuh Tempo" value={formatDate(info.dueDate)} />
                <Row label="Masa Pajak PPN" value={info.masaPajakPPN ?? '-'} />
                <Row label="Masa Pajak PPH" value={info.masaPajakPPH ?? '-'} />
                <Row label="Status Faktur Pajak" value={FAKTUR[info.statusFakturPajak] ?? info.statusFakturPajak} />
                <Row label="Nomor Faktur Pajak" value={info.fakturPajak.length ? info.fakturPajak.join(', ') : '-'} />
                <Row
                  label="Status Approval"
                  value={alreadyApproved ? 'Sudah di Approve' : 'Belum di Approve'}
                />
              </div>

              {done && (
                <div className="mt-4 rounded bg-positive/10 p-3 text-sm text-positive">
                  Invoice {info.no} berhasil disetujui. Terima kasih.
                </div>
              )}

              {!alreadyApproved && !done && (
                <button
                  onClick={handleApprove}
                  className="mt-6 w-full rounded bg-navy px-4 py-3 text-sm font-semibold text-white hover:opacity-95"
                >
                  Setujui (Approve)
                </button>
              )}

              {alreadyApproved && !done && (
                <p className="mt-6 rounded bg-gray-50 p-3 text-sm text-gray-600">
                  Invoice ini sudah disetujui sebelumnya.
                </p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
