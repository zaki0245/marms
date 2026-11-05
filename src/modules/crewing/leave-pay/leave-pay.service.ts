// src/modules/leave-pay/leave-pay.service.ts
// [FUNGSI] Logika Leave Pay: daftar kelayakan, pencairan, riwayat.
// [ALASAN] Leave pay tiap 180 hari masa kerja kumulatif setelah 180 hari pertama.

import { prisma } from '../../../shared/prisma';
import { AppError } from '../../../shared/AppError';
import { liveMasaKerja, berhakLeavePay } from '../../../shared/masaKerja';
import { sortByJabatan } from '../../../shared/jabatanOrder';
import type { DisburseInput, UpdateDisbursementInput } from './leave-pay.model';

// [FUNGSI] Daftar kelayakan leave pay semua crew.
export async function listLeavePay() {
  const crews = await prisma.crew.findMany({
    include: { applicant: true, placements: { include: { segments: true } } },
    orderBy: { createdAt: 'desc' },
  });
  const rows = crews.map((c) => {
    const masaKerja = liveMasaKerja(c);
    const berhak = berhakLeavePay(masaKerja);
    const activePlacement = c.placements.find((p) => p.status === 'AKTIF');
    return {
      crewId: c.id,
      nama: c.applicant.namaLengkap,
      posisi: c.applicant.posisiDilamar,
      jabatanKode: activePlacement?.jabatanKode ?? c.applicant.posisiDilamar,
      status: c.status,
      masaKerja,
      berhak,
      dibayar: c.jumlahLeavePay,
      sisa: berhak - c.jumlahLeavePay,
    };
  });
  // [FUNGSI] Urutkan sesuai hierarki jabatan, lalu nama.
  return sortByJabatan(
    rows,
    (r) => r.jabatanKode,
    (r) => r.nama,
  );
}

// [FUNGSI] Cairkan leave pay: catat pencairan & tambah jumlah yang sudah dibayar.
export async function disburseLeavePay(crewId: string, input: DisburseInput) {
  const crew = await prisma.crew.findUnique({
    where: { id: crewId },
    include: { placements: { include: { segments: true } } },
  });
  if (!crew) throw new AppError(404, 'Crew tidak ditemukan');

  const masaKerja = liveMasaKerja(crew);
  const berhak = berhakLeavePay(masaKerja);
  if (crew.jumlahLeavePay >= berhak) {
    throw new AppError(400, 'Tidak ada leave pay yang bisa dicairkan');
  }

  const pencairanKe = crew.jumlahLeavePay + 1;
  const disbursement = await prisma.leavePayDisbursement.create({
    data: {
      crewId,
      nominal: input.nominal,
      tanggalPencairan: new Date(input.tanggalPencairan),
      pencairanKe,
      masaKerjaSnapshot: masaKerja,
      catatanPerforma: input.catatanPerforma || null,
    },
  });

  await prisma.crew.update({
    where: { id: crewId },
    data: { jumlahLeavePay: { increment: 1 } },
  });

  return disbursement;
}

// [FUNGSI] Edit pencairan: hanya nominal & tanggal.
// [ALASAN] Urutan pencairan & counter jumlahLeavePay tidak berubah.
export async function updateDisbursement(id: string, input: UpdateDisbursementInput) {
  return prisma.leavePayDisbursement.update({
    where: { id },
    data: {
      nominal: input.nominal,
      tanggalPencairan: new Date(input.tanggalPencairan),
    },
  });
}

export function getRiwayat(crewId: string) {
  return prisma.leavePayDisbursement.findMany({
    where: { crewId },
    orderBy: { pencairanKe: 'asc' },
  });
}
