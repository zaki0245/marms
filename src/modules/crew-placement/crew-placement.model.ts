// src/modules/crew-placement/crew-placement.model.ts
// [FUNGSI] Skema validasi modul Kru & Penempatan.
// [ALASAN] Input pengguna divalidasi sebelum diproses.

import { z } from 'zod';

// [FUNGSI] Validasi input assign (on board) crew/kandidat ke kapal.
export const assignSchema = z.object({
  jabatanKode: z.string().min(1, 'Jabatan wajib dipilih'),
  tanggalMulai: z.string().min(1, 'Tanggal mulai wajib diisi'),
  vesselId: z.string().min(1, 'Kapal wajib dipilih'),
  namaBank: z.string().optional(),
  noRekening: z.string().optional(),
});
export type AssignInput = z.infer<typeof assignSchema>;

export const bankSchema = z.object({
  namaBank: z.string().optional(),
  noRekening: z.string().optional(),
});
export type BankInput = z.infer<typeof bankSchema>;

// [FUNGSI] Validasi input off board (turun kapal).
export const offBoardSchema = z.object({
  alasan: z.enum(['RELIEF', 'END_OF_CONTRACT']),
  offBoardTanggal: z.string().min(1, 'Tanggal off board wajib diisi'),
  offBoardPelabuhan: z.string().optional(),
});
export type OffBoardInput = z.infer<typeof offBoardSchema>;
