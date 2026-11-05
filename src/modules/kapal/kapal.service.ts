// src/modules/kapal/kapal.service.ts
// [FUNGSI] Logika bisnis modul Kapal.
// [ALASAN] Semua akses database kapal terpusat di sini (top-level module).

import { prisma } from '../../shared/prisma';
import type { KapalInput } from './kapal.model';

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
