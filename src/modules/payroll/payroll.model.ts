// src/modules/payroll/payroll.model.ts
// [FUNGSI] Skema validasi modul Payroll.
// [ALASAN] Input pengguna divalidasi sebelum diproses.

import { z } from 'zod';

// [FUNGSI] Validasi input generate payroll (kapal + bulan + tahun).
export const generateSchema = z.object({
  vesselId: z.string().min(1, 'Kapal wajib dipilih'),
  bulan: z.number().int().min(1).max(12),
  tahun: z.number().int().min(2000).max(2100),
  jenis: z.enum(['GAJI', 'UANG_MAKAN']).default('GAJI'),
});
export type GenerateInput = z.infer<typeof generateSchema>;
