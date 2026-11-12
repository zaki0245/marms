// src/modules/auth/auth.service.ts
// [FUNGSI] Logika autentikasi: login (rate limit), cek admin, ganti password.
// [ALASAN] Keamanan login terpusat di sini.

import bcrypt from 'bcryptjs';
import { prisma } from '../../shared/prisma';
import { AppError } from '../../shared/AppError';
import { makeRateLimiter } from '../../shared/rateLimit';
import type { Role } from '@prisma/client';

// [FUNGSI] Hash palsu agar email tidak dikenal tetap menjalankan bcrypt.
// [ALASAN] Menyamakan waktu respons login dan mencegah enumerasi email.
const DUMMY_HASH = '$2a$10$PnCNtzWeCUluqiVE2dgwAecUH0FybPTvw/7O0CW97VAvVfe9pnSaW';

// [FUNGSI] Rate limiting per email & per IP (in-memory).
const loginLimiter = makeRateLimiter({
  maxAttempts: 5,
  lockMs: 15 * 60 * 1000,
  message: 'Terlalu banyak percobaan. Coba lagi 15 menit.',
});
const ipLimiter = makeRateLimiter({
  maxAttempts: 30,
  lockMs: 15 * 60 * 1000,
  message: 'Terlalu banyak percobaan login. Coba lagi 15 menit.',
});

export async function login(email: string, password: string, ip: string) {
  ipLimiter.check(ip);
  loginLimiter.check(email);

  const admin = await prisma.admin.findUnique({ where: { email } });
  const cocok = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);
  const valid = !!admin && admin.active && cocok;
  if (!valid) {
    throw new AppError(401, 'Email atau password salah');
  }

  loginLimiter.reset(email);
  ipLimiter.reset(ip);
  return { id: admin.id, email: admin.email, role: admin.role, sessionVersion: admin.sessionVersion };
}

export function getAdmin(id: string) {
  return prisma.admin.findUnique({
    where: { id },
    select: { id: true, email: true, role: true },
  });
}

// [FUNGSI] Daftar semua akun admin (untuk SUPERADMIN).
export function listAccounts() {
  return prisma.admin.findMany({
    select: { id: true, email: true, role: true, active: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
}

// [FUNGSI] Buat akun admin baru dengan role tertentu.
export async function createAccount(input: { email: string; password: string; role: Role }) {
  const passwordHash = await bcrypt.hash(input.password, 10);
  return prisma.admin.create({
    data: { email: input.email, passwordHash, role: input.role },
    select: { id: true, email: true, role: true, active: true },
  });
}

// [FUNGSI] Ubah role, status aktif, dan/atau password sebuah akun.
// [ALASAN] Setiap perubahan sensitif menaikkan sessionVersion agar sesi lama langsung invalid.
export async function updateAccount(id: string, input: { role?: Role; active?: boolean; password?: string }) {
  const passwordHash = input.password ? await bcrypt.hash(input.password, 10) : undefined;
  const putusSesi = !!passwordHash || input.role !== undefined || input.active === false;
  return prisma.admin.update({
    where: { id },
    data: {
      ...(input.role ? { role: input.role } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
      ...(passwordHash ? { passwordHash } : {}),
      ...(putusSesi ? { sessionVersion: { increment: 1 } } : {}),
    },
    select: { id: true, email: true, role: true, active: true },
  });
}

// [FUNGSI] Hapus akun lain; akun yang sedang dipakai tidak boleh dihapus.
// [ALASAN] Mencegah SUPERADMIN mengunci dirinya sendiri.
export async function deleteAccount(id: string, currentId: string) {
  if (id === currentId) throw new AppError(400, 'Tidak bisa menghapus akun sendiri');
  const admin = await prisma.admin.findUnique({ where: { id } });
  if (!admin) throw new AppError(404, 'Akun tidak ditemukan');
  await prisma.admin.delete({ where: { id } });
  return admin;
}

export async function changePassword(id: string, passwordLama: string, passwordBaru: string) {
  const admin = await prisma.admin.findUnique({ where: { id } });
  if (!admin) throw new AppError(404, 'Admin tidak ditemukan');

  if (!(await bcrypt.compare(passwordLama, admin.passwordHash))) {
    throw new AppError(400, 'Password lama salah');
  }

  const passwordHash = await bcrypt.hash(passwordBaru, 10);
  const updated = await prisma.admin.update({
    where: { id },
    data: { passwordHash, sessionVersion: { increment: 1 } },
    select: { sessionVersion: true },
  });
  return updated.sessionVersion;
}

// [FUNGSI] Ambil riwayat audit terbaru untuk SUPERADMIN.
export function listAuditLog() {
  return prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
}
