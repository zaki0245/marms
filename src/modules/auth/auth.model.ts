// src/modules/auth/auth.model.ts
// [FUNGSI] Skema validasi modul Auth.
// [ALASAN] Input login & ganti password divalidasi.

import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export const changePasswordSchema = z.object({
  passwordLama: z.string().min(1, 'Password lama wajib diisi'),
  passwordBaru: z.string().min(8, 'Password baru minimal 8 karakter'),
});

export const createAccountSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  role: z.enum(['SUPERADMIN', 'CREWING', 'FINANCE', 'OPERATION']),
});

export const updateAccountSchema = z.object({
  role: z.enum(['SUPERADMIN', 'CREWING', 'FINANCE', 'OPERATION']).optional(),
  active: z.boolean().optional(),
  password: z.string().min(8, 'Password minimal 8 karakter').optional(),
});
