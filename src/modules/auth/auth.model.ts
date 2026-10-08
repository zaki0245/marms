// src/modules/auth/auth.model.ts
// [FUNGSI] Skema validasi modul Auth.
// [ALASAN] Input login & ganti password divalidasi.

import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export const changePasswordSchema = z.object({
  passwordLama: z.string().optional(),
  passwordBaru: z.string().min(6, 'Password baru minimal 6 karakter'),
});

export const createAccountSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role: z.enum(['SUPERADMIN', 'CREWING', 'FINANCE']),
});

export const updateAccountSchema = z.object({
  role: z.enum(['SUPERADMIN', 'CREWING', 'FINANCE']).optional(),
  active: z.boolean().optional(),
});
