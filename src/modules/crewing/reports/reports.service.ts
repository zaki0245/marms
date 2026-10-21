// src/modules/reports/reports.service.ts
// [FUNGSI] Logika Laporan: statistik dashboard & laporan agregat.
// [ALASAN] Modul baca-saja yang merangkum data lintas modul (pengecualian
//          aturan akses tabel karena sifatnya agregasi/reporting).

import { prisma } from '../../../shared/prisma';
import { liveMasaKerja, berhakLeavePay } from '../../../shared/masaKerja';

export async function getDashboard() {
  const now = new Date();
  const bulan = now.getMonth() + 1;
  const tahun = now.getFullYear();

  const [pelamarBaru, crewOnBoard, crews] = await Promise.all([
    prisma.pelamar.count({ where: { status: 'BARU' } }),
    prisma.crew.count({ where: { status: 'ON_BOARD' } }),
    prisma.crew.findMany({ include: { placements: { include: { segments: true } } } }),
  ]);
  // [FUNGSI] Siap dinilai = masih ada leave pay yang belum dicairkan.
  const crewSiapLeavePay = crews.filter(
    (c) => berhakLeavePay(liveMasaKerja(c)) > c.jumlahLeavePay,
  ).length;

  const payrollsBulanIni = await prisma.payroll.findMany({
    where: { bulan, tahun },
    select: { status: true },
  });
  const statusPayroll = { DRAFT: 0, FINAL: 0, DIBAYAR: 0 };
  for (const p of payrollsBulanIni) {
    statusPayroll[p.status as keyof typeof statusPayroll] += 1;
  }

  const totalBiaya = await prisma.payrollDetail.aggregate({
    _sum: { total: true },
    where: { payroll: { bulan, tahun } },
  });

  return {
    pelamarBaru,
    crewOnBoard,
    crewSiapLeavePay,
    statusPayroll,
    totalBiaya: totalBiaya._sum.total ?? 0,
    bulan,
    tahun,
  };
}

// [FUNGSI] Semua crew beserta kapalnya & masa kerja live.
export async function getCrewPerKapal() {
  const crews = await prisma.crew.findMany({
    include: {
      applicant: true,
      placements: { include: { vessel: true, segments: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return crews.map((c) => ({ ...c, masaKerja: liveMasaKerja(c) }));
}
