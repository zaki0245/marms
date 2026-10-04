// src/modules/payroll/payroll.service.ts
// [FUNGSI] Logika bisnis Payroll: generate prorata, snapshot, status.
// [ALASAN] Perhitungan gaji & uang makan prorata terpusat di sini.

import { prisma } from '../../shared/prisma';
import { AppError } from '../../shared/AppError';
import { prorata } from '../../shared/prorata';
import type { GenerateInput } from './payroll.model';

const DAY = 86400000;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

// [FUNGSI] Buat draft payroll untuk kapal + bulan tertentu.
export async function generatePayroll(input: GenerateInput) {
  const { vesselId, bulan, tahun, jenis } = input;

  const vessel = await prisma.kapal.findUnique({ where: { id: vesselId } });
  if (!vessel) throw new AppError(404, 'Kapal tidak ditemukan');

  const existing = await prisma.payroll.findUnique({
    where: { vesselId_bulan_tahun_jenis: { vesselId, bulan, tahun, jenis } },
  });
  if (existing) throw new AppError(409, 'Payroll untuk kapal & bulan ini sudah ada');

  const jumlahHari = new Date(tahun, bulan, 0).getDate();
  // [FUNGSI] Batas bulan dalam UTC: awal bulan & awal bulan berikutnya (eksklusif).
  const monthStart = new Date(Date.UTC(tahun, bulan - 1, 1));
  const monthEndExclusive = new Date(Date.UTC(tahun, bulan, 1));

  // [FUNGSI] Ambil segmen yang tumpang-tindih dengan bulan ini di kapal tersebut.
  const segmens = await prisma.segmen.findMany({
    where: {
      placement: { vesselId },
      onBoardTanggal: { lt: monthEndExclusive },
      OR: [{ offBoardTanggal: null }, { offBoardTanggal: { gte: monthStart } }],
    },
    include: {
      placement: { include: { crew: { include: { applicant: true } } } },
    },
  });

  const jabatanList = await prisma.jabatan.findMany();
  const jabatanMap = new Map(jabatanList.map((j) => [j.kode, j]));
  const pengaturan = await prisma.pengaturan.findUnique({ where: { key: 'UANG_MAKAN_PER_BULAN' } });
  const uangMakan = Number(pengaturan?.value ?? 0);

  const details: {
    crewId: string;
    jabatanKode: string;
    jabatanNama: string;
    segmentId: string;
    periodeKerja: string;
    hariAktif: number;
    gajiPokokSnapshot: number;
    gajiProrata: number;
    uangMakanSnapshot: number;
    uangMakanProrata: number;
    total: number;
    namaBank: string | null;
    noRekening: string | null;
  }[] = [];

  for (const segmen of segmens) {
    const onBoard = segmen.onBoardTanggal;
    const offBoardExclusive = segmen.offBoardTanggal
      ? new Date(segmen.offBoardTanggal.getTime() + DAY)
      : monthEndExclusive;

    const start = onBoard > monthStart ? onBoard : monthStart;
    const endExclusive = offBoardExclusive < monthEndExclusive ? offBoardExclusive : monthEndExclusive;
    const hariAktif = Math.round((endExclusive.getTime() - start.getTime()) / DAY);
    if (hariAktif <= 0) continue;

    const jabatanKode = segmen.placement.jabatanKode;
    const jabatan = jabatanMap.get(jabatanKode);
    const gajiPokok = jabatan?.gajiPokok ?? 0;
    const jabatanNama = jabatan?.nama ?? jabatanKode;

    // [FUNGSI] Hitung prorata sesuai jenis (GAJI atau UANG_MAKAN).
    const gajiProrata = jenis === 'GAJI' ? prorata(gajiPokok, jumlahHari, hariAktif) : 0;
    const uangMakanProrata = jenis === 'UANG_MAKAN' ? prorata(uangMakan, jumlahHari, hariAktif) : 0;

    const lastDay = new Date(endExclusive.getTime() - DAY);
    const periodeKerja = `${pad(start.getUTCDate())}-${pad(lastDay.getUTCDate())}`;

    details.push({
      crewId: segmen.placement.crewId,
      jabatanKode,
      jabatanNama,
      segmentId: segmen.id,
      periodeKerja,
      hariAktif,
      gajiPokokSnapshot: jenis === 'GAJI' ? gajiPokok : 0,
      gajiProrata,
      uangMakanSnapshot: jenis === 'UANG_MAKAN' ? uangMakan : 0,
      uangMakanProrata,
      total: gajiProrata + uangMakanProrata,
      namaBank: segmen.placement.crew.namaBank ?? null,
      noRekening: segmen.placement.crew.noRekening ?? null,
    });
  }

  // [FUNGSI] Simpan payroll + detail. Nilai gaji/u.makan tersimpan (snapshot)
  //          sehingga perubahan master di kemudian hari tidak mengubah rekap ini.
  return prisma.payroll.create({
    data: {
      vesselId,
      bulan,
      tahun,
      jumlahHari,
      jenis,
      status: 'DRAFT',
      details: { create: details },
    },
    include: { vessel: true, details: true },
  });
}

export function listPayroll() {
  return prisma.payroll.findMany({
    include: { vessel: true, _count: { select: { details: true } } },
    orderBy: [{ tahun: 'desc' }, { bulan: 'desc' }],
  });
}

export function getPayroll(id: string) {
  return prisma.payroll.findUnique({
    where: { id },
    include: {
      vessel: true,
      details: { include: { crew: { include: { applicant: true } } } },
    },
  });
}

// [FUNGSI] Finalisasi payroll: kunci status menjadi Final (nilai sudah tersnapshot).
export async function finalizePayroll(id: string) {
  const payroll = await prisma.payroll.findUnique({ where: { id } });
  if (!payroll) throw new AppError(404, 'Payroll tidak ditemukan');
  if (payroll.status !== 'DRAFT') throw new AppError(400, 'Hanya payroll Draft yang bisa difinalisasi');
  return prisma.payroll.update({
    where: { id },
    data: { status: 'FINAL', tanggalFinalisasi: new Date() },
  });
}

// [FUNGSI] Tandai payroll sudah dibayar (status Final -> Dibayar).
export async function markPaid(id: string) {
  const payroll = await prisma.payroll.findUnique({ where: { id } });
  if (!payroll) throw new AppError(404, 'Payroll tidak ditemukan');
  if (payroll.status !== 'FINAL') throw new AppError(400, 'Hanya payroll Final yang bisa ditandai dibayar');
  return prisma.payroll.update({
    where: { id },
    data: { status: 'DIBAYAR', tanggalPembayaran: new Date() },
  });
}

// [FUNGSI] Hapus payroll (hanya status Draft).
export async function deletePayroll(id: string) {
  const payroll = await prisma.payroll.findUnique({ where: { id } });
  if (!payroll) throw new AppError(404, 'Payroll tidak ditemukan');
  if (payroll.status !== 'DRAFT') throw new AppError(400, 'Hanya payroll Draft yang bisa dihapus');
  await prisma.payroll.delete({ where: { id } });
}
