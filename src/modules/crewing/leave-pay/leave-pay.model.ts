// src/modules/leave-pay/leave-pay.model.ts
// [FUNGSI] Skema validasi modul Leave Pay.
// [ALASAN] Input pencairan divalidasi.

import { z } from 'zod';

export const disburseSchema = z.object({
  nominal: z.number().int().positive('Nominal wajib diisi'),
  tanggalPencairan: z.string().min(1, 'Tanggal pencairan wajib diisi'),
  catatanPerforma: z.string().optional(),
});
export type DisburseInput = z.infer<typeof disburseSchema>;
