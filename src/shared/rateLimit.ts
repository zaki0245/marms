// src/shared/rateLimit.ts
// [FUNGSI] Rate limiter sederhana per key (in-memory).
// [ALASAN] Cegah brute-force login & spam upload; logika Map terpusat agar dipakai ulang.

import { AppError } from './AppError';

// [FUNGSI] Buat limiter dengan jumlah percobaan & jendela lock.
// [ALASAN] Satu helper dipakai modul auth (login) & rekrutmen (pendaftaran).
export function makeRateLimiter(options: { maxAttempts: number; lockMs: number; message: string }) {
  const attempts = new Map<string, { count: number; lockedUntil: number }>();

  return {
    // [FUNGSI] Cek & catat satu percobaan; lempar bila terkunci.
    check(key: string) {
      const now = Date.now();
      const entry = attempts.get(key);
      if (entry && entry.lockedUntil > now) {
        throw new AppError(429, options.message);
      }
      const count = (entry?.count ?? 0) + 1;
      if (count >= options.maxAttempts) {
        attempts.set(key, { count, lockedUntil: now + options.lockMs });
      } else {
        attempts.set(key, { count, lockedUntil: 0 });
      }
    },
    // [FUNGSI] Reset percobaan setelah sukses.
    reset(key: string) {
      attempts.delete(key);
    },
  };
}
