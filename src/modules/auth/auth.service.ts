// src/modules/auth/auth.service.ts
// [FUNGSI] Logika autentikasi: login (rate limit), cek admin, ganti password.
// [ALASAN] Keamanan login terpusat di sini.

import bcrypt from 'bcryptjs';
import { prisma } from '../../shared/prisma';
import { AppError } from '../../shared/AppError';

// [FUNGSI] Rate limiting sederhana per email (in-memory).
const rateLimits = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

export async function login(email: string, password: string) {
  const now = Date.now();
  const rl = rateLimits.get(email);
  if (rl && rl.lockedUntil > now) {
    throw new AppError(429, 'Terlalu banyak percobaan. Coba lagi 15 menit.');
  }

  const admin = await prisma.admin.findUnique({ where: { email } });
  const valid = admin && (await bcrypt.compare(password, admin.passwordHash));
  if (!valid) {
    const count = (rl?.count ?? 0) + 1;
    if (count >= MAX_ATTEMPTS) {
      rateLimits.set(email, { count, lockedUntil: now + LOCK_MS });
      throw new AppError(429, 'Terlalu banyak percobaan. Coba lagi 15 menit.');
    }
    rateLimits.set(email, { count, lockedUntil: 0 });
    throw new AppError(401, 'Email atau password salah');
  }

  rateLimits.delete(email);
  return { id: admin.id, email: admin.email, mustChangePassword: admin.mustChangePassword };
}

export function getAdmin(id: string) {
  return prisma.admin.findUnique({
    where: { id },
    select: { id: true, email: true, mustChangePassword: true },
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
