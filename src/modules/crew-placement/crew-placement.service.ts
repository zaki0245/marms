// src/modules/crew-placement/crew-placement.service.ts
// [FUNGSI] Logika bisnis Kru & Penempatan: assign (on board), off board, masa kerja.
// [ALASAN] Akses database modul ini terpusat di sini; akses modul lain lewat public API.

import { prisma } from '../../shared/prisma';
import { AppError } from '../../shared/AppError';
import { getApplicantWithDocuments } from '../recruitment';
import { liveMasaKerja } from '../../shared/masaKerja';
import type { AssignInput, BankInput, OffBoardInput } from './crew-placement.model';

// [FUNGSI] Buat nomor kontrak otomatis: CTK-YYYY-NNNN.
async function generateNomorKontrak(): Promise<string> {
  const tahun = new Date().getFullYear();
  const prefix = `CTK-${tahun}-`;
  const last = await prisma.kontrak.findFirst({
    where: { nomorKontrak: { startsWith: prefix } },
    orderBy: { nomorKontrak: 'desc' },
    select: { nomorKontrak: true },
  });
  let next = 1;
  if (last) {
    const n = Number(last.nomorKontrak.slice(prefix.length));
    if (!Number.isNaN(n)) next = n + 1;
  }
  return `${prefix}${String(next).padStart(4, '0')}`;
}

// [FUNGSI] Pastikan tidak ada dokumen expired sebelum penempatan.
// [ALASAN] Aturan bisnis: dokumen expired memblokir penempatan baru.
function assertNoExpiredDocuments(documents: { jenis: string; tanggalExpired: Date | null }[]) {
  const today = new Date();
  const expired = documents.filter((d) => d.tanggalExpired && d.tanggalExpired < today);
  if (expired.length > 0) {
    throw new AppError(
      400,
      'Penempatan ditolak: ada dokumen expired (' + expired.map((d) => d.jenis).join(', ') + ')',
    );
  }
}

// [FUNGSI] Buat kontrak + penempatan + segmen, lalu set status On Board.
async function placeCrewOnVessel(crewId: string, input: AssignInput) {
  const nomorKontrak = await generateNomorKontrak();
  const kontrak = await prisma.kontrak.create({
    data: {
      nomorKontrak,
      crewId,
      jabatanKode: input.jabatanKode,
      tanggalMulai: new Date(input.tanggalMulai),
      status: 'AKTIF',
    },
  });
  const penempatan = await prisma.penempatan.create({
    data: {
      crewId,
      kontrakId: kontrak.id,
      vesselId: input.vesselId,
      jabatanKode: input.jabatanKode,
      tanggalMulai: new Date(input.tanggalMulai),
      status: 'AKTIF',
    },
  });
  // [FUNGSI] Buat segmen on board (periode naik kapal).
  await prisma.segmen.create({
    data: { placementId: penempatan.id, onBoardTanggal: new Date(input.tanggalMulai), onBoardPelabuhan: '' },
  });
  await prisma.crew.update({ where: { id: crewId }, data: { status: 'ON_BOARD' } });

  return prisma.penempatan.findUnique({
    where: { id: penempatan.id },
    include: { vessel: true, kontrak: true },
  });
}

// [FUNGSI] Assign kandidat (pelamar Diterima) langsung ke kapal.
// [ALASAN] Membuat crew bila belum ada, lalu menempatkannya.
export async function assignApplicantToVessel(applicantId: string, input: AssignInput) {
  const pelamar = await getApplicantWithDocuments(applicantId);
  if (!pelamar) throw new AppError(404, 'Pelamar tidak ditemukan');
  if (pelamar.status !== 'DITERIMA') throw new AppError(400, 'Pelamar belum berstatus Diterima');
  assertNoExpiredDocuments(pelamar.documents);

  let crew = await prisma.crew.findUnique({ where: { applicantId } });
  if (!crew) {
    crew = await prisma.crew.create({
      data: {
        applicantId,
        tanggalBergabung: new Date(),
        status: 'AVAILABLE',
        totalMasaKerja: 0,
        jumlahLeavePay: 0,
        namaBank: input.namaBank || null,
        noRekening: input.noRekening || null,
      },
    });
  } else {
    await prisma.crew.update({
      where: { id: crew.id },
      data: { namaBank: input.namaBank || null, noRekening: input.noRekening || null },
    });
  }
  if (crew.status === 'ON_BOARD') throw new AppError(400, 'Kandidat sudah On Board');

  return placeCrewOnVessel(crew.id, input);
}

// [FUNGSI] Assign ulang crew (Available/Off Board) ke kapal.
export async function assignCrewToVessel(crewId: string, input: AssignInput) {
  const crew = await prisma.crew.findUnique({ where: { id: crewId } });
  if (!crew) throw new AppError(404, 'Crew tidak ditemukan');
  if (crew.status === 'ON_BOARD') throw new AppError(400, 'Crew sudah On Board');

  const pelamar = await getApplicantWithDocuments(crew.applicantId);
  assertNoExpiredDocuments(pelamar?.documents ?? []);

  // [FUNGSI] Perbarui info bank saat assign ulang.
  await prisma.crew.update({
    where: { id: crewId },
    data: { namaBank: input.namaBank || null, noRekening: input.noRekening || null },
  });

  return placeCrewOnVessel(crew.id, input);
}

// [FUNGSI] Off board crew: tutup segmen aktif, hitung masa kerja, set Off Board.
export async function offBoardCrew(crewId: string, input: OffBoardInput) {
  const crew = await prisma.crew.findUnique({
    where: { id: crewId },
    include: { placements: { include: { segments: true } } },
  });
  if (!crew) throw new AppError(404, 'Crew tidak ditemukan');
  if (crew.status !== 'ON_BOARD') throw new AppError(400, 'Crew tidak sedang On Board');

  const activeSegmen = crew.placements.flatMap((p) => p.segments).find((s) => !s.offBoardTanggal);
  if (!activeSegmen) throw new AppError(400, 'Segmen aktif tidak ditemukan');

  const offBoardTanggal = new Date(input.offBoardTanggal);
  if (offBoardTanggal < activeSegmen.onBoardTanggal) {
    throw new AppError(400, 'Tanggal off board tidak boleh sebelum tanggal on board');
  }

  // [FUNGSI] Hitung masa kerja segmen ini (inklusif: hari on board & off board dihitung).
  const durasi = Math.round((offBoardTanggal.getTime() - activeSegmen.onBoardTanggal.getTime()) / 86400000) + 1;

  await prisma.segmen.update({
    where: { id: activeSegmen.id },
    data: {
      offBoardTanggal,
      offBoardPelabuhan: input.offBoardPelabuhan || '',
      alasanOffBoard: input.alasan,
      durasi,
    },
  });

  const activePlacement = crew.placements.find((p) => p.segments.some((s) => s.id === activeSegmen.id));
  if (activePlacement) {
    await prisma.penempatan.update({
      where: { id: activePlacement.id },
      data: { status: 'SELESAI', tanggalSelesai: offBoardTanggal },
    });
  }

  // [FUNGSI] Tambahkan durasi ke masa kerja kumulatif, lalu set Off Board.
  await prisma.crew.update({
    where: { id: crewId },
    data: { status: 'OFF_BOARD', totalMasaKerja: crew.totalMasaKerja + durasi },
  });

  return prisma.crew.findUnique({
    where: { id: crewId },
    include: { applicant: true, placements: { include: { vessel: true, segments: true } } },
  });
}

// [FUNGSI] Daftar crew beserta penempatan & kapalnya (untuk filter & status).
export async function listCrew() {
  const crews = await prisma.crew.findMany({
    include: {
      applicant: true,
      placements: { include: { vessel: true, segments: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return crews.map((c) => ({ ...c, masaKerja: liveMasaKerja(c) }));
}

export async function getCrew(id: string) {
  const crew = await prisma.crew.findUnique({
    where: { id },
    include: {
      applicant: { include: { documents: true } },
      contracts: true,
      placements: { include: { vessel: true, segments: true } },
      seaServiceRecords: true,
    },
  });
  if (!crew) return null;
  return { ...crew, masaKerja: liveMasaKerja(crew) };
}

// [FUNGSI] Perbarui info bank (nama bank & nomor rekening) sebuah crew.
export async function updateBank(crewId: string, input: BankInput) {
  const crew = await prisma.crew.findUnique({ where: { id: crewId } });
  if (!crew) throw new AppError(404, 'Crew tidak ditemukan');
  return prisma.crew.update({
    where: { id: crewId },
    data: { namaBank: input.namaBank || null, noRekening: input.noRekening || null },
  });
}
