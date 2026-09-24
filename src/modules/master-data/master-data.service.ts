// src/modules/master-data/master-data.service.ts
// [FUNGSI] Logika bisnis Master Data: jabatan, pengaturan, kapal.
// [ALASAN] Semua akses database modul ini terpusat di sini (tidak bocor ke modul lain).

import { prisma } from '../../shared/prisma';
import type { JabatanInput, KapalInput, PengaturanInput } from './master-data.model';

// ================== JABATAN ==================

export function listJabatan() {
  return prisma.jabatan.findMany({ orderBy: { kode: 'asc' } });
}

export function createJabatan(input: JabatanInput) {
  return prisma.jabatan.create({ data: input });
}

export function updateJabatan(kode: string, input: JabatanInput) {
  return prisma.jabatan.update({ where: { kode }, data: input });
}

export function deleteJabatan(kode: string) {
  return prisma.jabatan.delete({ where: { kode } });
}

// ================== PENGATURAN ==================

// [FUNGSI] Baca semua pengaturan, kembalikan dalam bentuk objek mudah pakai.
export async function getPengaturan() {
  const rows = await prisma.pengaturan.findMany();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    uangMakanPerBulan: Number(map['UANG_MAKAN_PER_BULAN'] ?? 0),
  };
}

export async function updatePengaturan(input: PengaturanInput) {
  await prisma.pengaturan.upsert({
    where: { key: 'UANG_MAKAN_PER_BULAN' },
    update: { value: String(input.uangMakanPerBulan) },
    create: { key: 'UANG_MAKAN_PER_BULAN', value: String(input.uangMakanPerBulan) },
  });
  return getPengaturan();
}

// ================== KAPAL ==================

export function listKapal() {
  return prisma.kapal.findMany({ orderBy: { namaUnit: 'asc' } });
}

export function getKapal(id: string) {
  return prisma.kapal.findUnique({ where: { id } });
}

export function createKapal(input: KapalInput) {
  return prisma.kapal.create({ data: input });
}

export function updateKapal(id: string, input: KapalInput) {
  return prisma.kapal.update({ where: { id }, data: input });
}

export function deleteKapal(id: string) {
  return prisma.kapal.delete({ where: { id } });
}
