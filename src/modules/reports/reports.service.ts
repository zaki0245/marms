// src/modules/reports/reports.service.ts
// [FUNGSI] Logika Laporan: statistik dashboard & laporan agregat.
// [ALASAN] Modul baca-saja yang merangkum data lintas modul (pengecualian
//          aturan akses tabel karena sifatnya agregasi/reporting).

import { prisma } from '../../shared/prisma';
import { liveMasaKerja } from '../../shared/masaKerja';

export async function getDashboard() {
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 86400000);
  const bulan = now.getMonth() + 1;
  const tahun = now.getFullYear();

  const [pelamarBaru, crewOnBoard, dokumenExpired30, crews] = await Promise.all([
    prisma.pelamar.count({ where: { status: 'BARU' } }),
    prisma.crew.count({ where: { status: 'ON_BOARD' } }),
    prisma.dokumen.count({ where: { tanggalExpired: { gte: now, lte: in30 } } }),
    prisma.crew.findMany({ include: { placements: { include: { segments: true } } } }),
  ]);
  // [FUNGSI] Siap dinilai = masih ada leave pay yang belum dicairkan.
  const crewSiapLeavePay = crews.filter(
    (c) => Math.floor(liveMasaKerja(c) / 180) > c.jumlahLeavePay,
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
    dokumenExpired30,
    crewSiapLeavePay,
    statusPayroll,
    totalBiaya: totalBiaya._sum.total ?? 0,
    bulan,
    tahun,
  };
}

// [FUNGSI] Crew yang sedang On Board beserta kapalnya.
export async function getCrewPerKapal() {
  return prisma.penempatan.findMany({
    where: { status: 'AKTIF' },
    include: { crew: { include: { applicant: true } }, vessel: true },
    orderBy: { tanggalMulai: 'asc' },
  });
}

// [FUNGSI] Dokumen yang akan expired dalam 30 hari ke depan.
export async function getDokumenAkanExpired() {
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 86400000);
  return prisma.dokumen.findMany({
    where: { tanggalExpired: { gte: now, lte: in30 } },
    include: { applicant: { include: { crew: true } } },
    orderBy: { tanggalExpired: 'asc' },
  });
}

// [FUNGSI] Daftar masa kerja kumulatif semua crew (live).
export async function getMasaKerja() {
  const crews = await prisma.crew.findMany({
    include: { applicant: true, placements: { include: { segments: true } } },
    orderBy: { totalMasaKerja: 'desc' },
  });
  return crews.map((c) => ({ ...c, masaKerja: liveMasaKerja(c) }));
}
