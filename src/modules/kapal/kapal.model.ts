// src/modules/kapal/kapal.model.ts
// [FUNGSI] Validasi input modul Kapal (zod).
// [ALASAN] Input dari pengguna wajib divalidasi sebelum diproses.

import { z } from 'zod';

// [FUNGSI] Validasi data kapal (unit TB + BG).
export const kapalSchema = z.object({
  namaUnit: z.string().min(1, 'Nama unit wajib diisi'),
  skema: z.enum(['MILIK', 'SEWA']).default('MILIK'),
  status: z.enum(['AKTIF', 'DOCKING']).default('AKTIF'),
  tbNama: z.string().min(1, 'Nama TB wajib diisi'),
  tbImo: z.string().optional().nullable(),
  tbGt: z.number().int().positive().optional().nullable(),
  tbTahun: z.number().int().positive().optional().nullable(),
  bgNama: z.string().min(1, 'Nama BG wajib diisi'),
  bgImo: z.string().optional().nullable(),
  bgGt: z.number().int().positive().optional().nullable(),
  bgTahun: z.number().int().positive().optional().nullable(),
});
export type KapalInput = z.infer<typeof kapalSchema>;
