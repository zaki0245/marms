// src/modules/auth/auth.service.ts
// [FUNGSI] Logika autentikasi: login (rate limit), cek admin, ganti password.
// [ALASAN] Keamanan login terpusat di sini.

import bcrypt from 'bcryptjs';
import { prisma } from '../../shared/prisma';
import { AppError } from '../../shared/AppError';
import { makeRateLimiter } from '../../shared/rateLimit';
import type { Role } from '@prisma/client';

// [FUNGSI] Rate limiting per email (in-memory).
const loginLimiter = makeRateLimiter({
  maxAttempts: 5,
  lockMs: 15 * 60 * 1000,
  message: 'Terlalu banyak percobaan. Coba lagi 15 menit.',
});

export async function login(email: string, password: string) {
  loginLimiter.check(email);

  const admin = await prisma.admin.findUnique({ where: { email } });
  const valid = admin && admin.active && (await bcrypt.compare(password, admin.passwordHash));
  if (!valid) {
    throw new AppError(401, 'Email atau password salah');
  }

  loginLimiter.reset(email);
  return { id: admin.id, email: admin.email, role: admin.role, mustChangePassword: admin.mustChangePassword };
}

export function getAdmin(id: string) {
  return prisma.admin.findUnique({
    where: { id },
    select: { id: true, email: true, role: true, mustChangePassword: true },
  });
}

// [FUNGSI] Daftar semua akun admin (untuk SUPERADMIN).
export function listAccounts() {
  return prisma.admin.findMany({
    select: { id: true, email: true, role: true, active: true, mustChangePassword: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
}

// [FUNGSI] Buat akun admin baru dengan role tertentu.
export async function createAccount(input: { email: string; password: string; role: Role }) {
  const passwordHash = await bcrypt.hash(input.password, 10);
  return prisma.admin.create({
    data: { email: input.email, passwordHash, role: input.role, mustChangePassword: true },
    select: { id: true, email: true, role: true, active: true, mustChangePassword: true },
  });
}

// [FUNGSI] Ubah role / status aktif sebuah akun.
export function updateAccount(id: string, input: { role?: Role; active?: boolean }) {
  return prisma.admin.update({
    where: { id },
    data: { ...(input.role ? { role: input.role } : {}), ...(input.active !== undefined ? { active: input.active } : {}) },
    select: { id: true, email: true, role: true, active: true, mustChangePassword: true },
  });
}

export async function changePassword(id: string, passwordLama: string | undefined, passwordBaru: string) {
  const admin = await prisma.admin.findUnique({ where: { id } });
  if (!admin) throw new AppError(404, 'Admin tidak ditemukan');

  // [FUNGSI] Saat login pertama (mustChangePassword), tidak perlu password lama.
  if (!admin.mustChangePassword) {
    if (!passwordLama || !(await bcrypt.compare(passwordLama, admin.passwordHash))) {
      throw new AppError(400, 'Password lama salah');
    }
  }

  const passwordHash = await bcrypt.hash(passwordBaru, 10);
  await prisma.admin.update({
    where: { id },
    data: { passwordHash, mustChangePassword: false },
  });
}
