// src/shared/prisma.ts
// [FUNGSI] Menyediakan satu koneksi Prisma yang dipakai bersama semua modul.
// [ALASAN] Menghindari banyak koneksi DB yang boros saat hot-reload di dev.

import { PrismaClient } from '@prisma/client';

// [FUNGSI] Simpan client di globalThis agar tidak dibuat ulang tiap reload.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
