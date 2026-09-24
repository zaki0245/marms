// client/src/pages/Dashboard.tsx
// [FUNGSI] Halaman Dashboard admin: angka ringkasan (tanpa grafik).
// [ALASAN] Menampilkan kondisi operasional secara sekilas.

import { useEffect, useState } from 'react';
import { api, formatRupiah } from '../api/client';

interface DashboardData {
  pelamarBaru: number;
  crewOnBoard: number;
  dokumenExpired30: number;
  crewSiapLeavePay: number;
  statusPayroll: { DRAFT: number; FINAL: number; DIBAYAR: number };
  totalBiaya: number;
  bulan: number;
  tahun: number;
}

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-navy">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<DashboardData>('/reports/dashboard')
      .then(({ data }) => setData(data))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">Memuat...</p>;
  if (!data) return <p className="text-negative">Gagal memuat dashboard.</p>;

  const sp = data.statusPayroll;

  return (
    <div>
      <h2 className="text-2xl font-bold text-navy">Dashboard</h2>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card label="Pelamar Baru" value={data.pelamarBaru} />
        <Card label="Crew On Board" value={data.crewOnBoard} />
        <Card label="Dokumen Akan Expired (30 hari)" value={data.dokumenExpired30} />
        <Card label="Crew Siap Dinilai Leave Pay" value={data.crewSiapLeavePay} />
        <Card
          label={`Total Biaya Crew ${BULAN[data.bulan - 1]} ${data.tahun}`}
          value={formatRupiah(data.totalBiaya)}
        />
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Payroll Bulan Ini</p>
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Draft</span><span className="font-semibold text-navy">{sp.DRAFT}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Final</span><span className="font-semibold text-navy">{sp.FINAL}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Dibayar</span><span className="font-semibold text-positive">{sp.DIBAYAR}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
