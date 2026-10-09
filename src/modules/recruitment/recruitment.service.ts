// src/modules/recruitment/recruitment.service.ts
// [FUNGSI] Logika bisnis Rekrutmen: pendaftaran pelamar + nomor otomatis.
// [ALASAN] Akses database & aturan bisnis (duplikat, nomor) terpusat di sini.

import { prisma } from '../../shared/prisma';
import { AppError } from '../../shared/AppError';
import { ApplicantStatus, DocumentStatus } from '@prisma/client';
import { makeRateLimiter } from '../../shared/rateLimit';
import { UPLOAD_DIR, verifyFileSignature } from '../../shared/upload';
import fs from 'fs';
import path from 'path';
import { DOKUMEN_LIST, type DokumenInput, type PelamarInput } from './recruitment.model';

// [FUNGSI] Rate limiting pendaftaran per IP (in-memory).
// [ALASAN] Cegah spam upload dari endpoint publik.
const pelamarLimiter = makeRateLimiter({
  maxAttempts: 20,
  lockMs: 15 * 60 * 1000,
  message: 'Terlalu banyak percobaan pendaftaran. Coba lagi 15 menit.',
});

// [FUNGSI] Buat nomor pendaftaran otomatis: PLR-YYYY-NNNN (reset tiap tahun).
// [ALASAN] Nomor unik per tahun, sesuai aturan bisnis.
export async function generateNomorPendaftaran(): Promise<string> {
  const tahun = new Date().getFullYear();
  const prefix = `PLR-${tahun}-`;
  const last = await prisma.pelamar.findFirst({
    where: { nomorPendaftaran: { startsWith: prefix } },
    orderBy: { nomorPendaftaran: 'desc' },
    select: { nomorPendaftaran: true },
  });
  let next = 1;
  if (last) {
    const n = Number(last.nomorPendaftaran.slice(prefix.length));
    if (!Number.isNaN(n)) next = n + 1;
  }
  return `${prefix}${String(next).padStart(4, '0')}`;
}

// [FUNGSI] Simpan pendaftaran pelamar + 21 dokumen.
// [ALASAN] Satu transaksi agar data pelamar & dokumen selalu konsisten.
export async function createPelamar(
  input: PelamarInput,
  files: Record<string, Express.Multer.File[] | undefined>,
  expiryDates: Record<string, string>,
  clientIp?: string,
) {
  // [FUNGSI] Batasi jumlah pendaftaran per IP.
  if (clientIp) pelamarLimiter.check(clientIp);

  // [FUNGSI] Cek duplikat email ATAU no HP (tolak otomatis). Email opsional.
  const or: { email?: string; noHp?: string }[] = [];
  if (input.email) or.push({ email: input.email });
  or.push({ noHp: input.noHp });
  const exists = await prisma.pelamar.findFirst({
    where: { OR: or },
    select: { email: true, noHp: true },
  });
  if (exists) {
    if (input.email && exists.email === input.email) throw new AppError(409, 'Email sudah terdaftar');
    throw new AppError(409, 'No HP sudah terdaftar');
  }

  // [FUNGSI] Susun data dokumen hanya untuk yang benar-benar diunggah.
  // [ALASAN] Dokumen opsional; tanggal expired diisi pelamar (hanya dokumen ber-expired).
  const documents: { jenis: string; filePath: string; tanggalExpired: Date | null }[] = [];
  for (const d of DOKUMEN_LIST) {
    const file = files?.[`dokumen_${d.kode}`]?.[0];
    if (!file) continue;
    // [FUNGSI] Verifikasi isi file; hapus bila bukan PDF/JPG/PNG asli.
    if (!verifyFileSignature(path.join(UPLOAD_DIR, file.filename))) {
      fs.unlinkSync(path.join(UPLOAD_DIR, file.filename));
      throw new AppError(400, 'File tidak valid (bukan PDF/JPG/PNG)');
    }
    const tanggalExpired = d.expired && expiryDates[d.kode] ? new Date(expiryDates[d.kode]) : null;
    documents.push({ jenis: d.kode, filePath: `/uploads/${file.filename}`, tanggalExpired });
  }

  const nomorPendaftaran = await generateNomorPendaftaran();

  return prisma.pelamar.create({
    data: {
      nomorPendaftaran,
      namaLengkap: input.namaLengkap,
      tempatLahir: input.tempatLahir,
      tanggalLahir: new Date(input.tanggalLahir),
      jenisKelamin: input.jenisKelamin,
      noHp: input.noHp,
      email: input.email || null,
      alamat: input.alamat,
      kontakReferensi: input.kontakReferensi || null,
      posisiDilamar: input.posisiDilamar,
      pengalamanTahun: input.pengalamanTahun ? Number(input.pengalamanTahun) : null,
      kapalTerakhir: input.kapalTerakhir || null,
      jabatanTerakhir: input.jabatanTerakhir || null,
      documents: { create: documents },
    },
    include: { documents: true },
  });
}

// [FUNGSI] Daftar pelamar (opsional filter status), untuk panel admin.
export function listPelamar(status?: string) {
  return prisma.pelamar.findMany({
    where: status ? { status: status as ApplicantStatus } : undefined,
    include: { documents: true },
    orderBy: { createdAt: 'desc' },
  });
}

export function getPelamar(id: string) {
  return prisma.pelamar.findUnique({ where: { id }, include: { documents: true } });
}

// [FUNGSI] Ubah status seleksi pelamar.
export function updatePelamarStatus(id: string, status: ApplicantStatus) {
  return prisma.pelamar.update({ where: { id }, data: { status } });
}

// [FUNGSI] Perbarui data & status verifikasi sebuah dokumen.
export function updateDokumen(id: string, input: DokumenInput) {
  return prisma.dokumen.update({
    where: { id },
    data: {
      nomor: input.nomor || null,
      tanggalTerbit: input.tanggalTerbit ? new Date(input.tanggalTerbit) : null,
      tanggalExpired: input.tanggalExpired ? new Date(input.tanggalExpired) : null,
      status: input.status as DocumentStatus,
      catatan: input.catatan || null,
    },
  });
}

// [FUNGSI] Statistik ringkas untuk badge sidebar (jumlah pelamar baru).
export async function getStats() {
  const pelamarBaru = await prisma.pelamar.count({ where: { status: 'BARU' } });
  return { pelamarBaru };
}

// [FUNGSI] Daftar pelamar berstatus Diterima yang belum punya crew (pool kandidat).
export function listAcceptedApplicants() {
  return prisma.pelamar.findMany({
    where: { status: 'DITERIMA', crew: null },
    include: { documents: true },
    orderBy: { createdAt: 'asc' },
  });
}

// [FUNGSI] Ambil satu pelamar (public API untuk modul lain, mis. Kru).
export function getApplicant(id: string) {
  return prisma.pelamar.findUnique({ where: { id } });
}

// [FUNGSI] Ambil pelamar beserta dokumennya (untuk cek expired oleh modul lain).
export function getApplicantWithDocuments(id: string) {
  return prisma.pelamar.findUnique({ where: { id }, include: { documents: true } });
}

// [FUNGSI] Perbarui dokumen: ganti file (opsional) & perbarui tanggal expired.
export async function updateDokumenFile(
  id: string,
  input: { file?: Express.Multer.File; tanggalExpired?: string },
) {
  const dokumen = await prisma.dokumen.findUnique({ where: { id } });
  if (!dokumen) throw new AppError(404, 'Dokumen tidak ditemukan');

  const data: { filePath?: string; tanggalExpired?: Date | null } = {};
  if (input.file) {
    // [FUNGSI] Verifikasi isi file; hapus bila bukan PDF/JPG/PNG asli.
    if (!verifyFileSignature(path.join(UPLOAD_DIR, input.file.filename))) {
      fs.unlinkSync(path.join(UPLOAD_DIR, input.file.filename));
      throw new AppError(400, 'File tidak valid (bukan PDF/JPG/PNG)');
    }
    data.filePath = `/uploads/${input.file.filename}`;
  }
  if (input.tanggalExpired !== undefined) {
    data.tanggalExpired = input.tanggalExpired ? new Date(input.tanggalExpired) : null;
  }

  return prisma.dokumen.update({ where: { id }, data });
}
