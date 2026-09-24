// src/modules/master-data/master-data.model.ts
// [FUNGSI] Skema validasi (zod) & tipe data untuk input Master Data.
// [ALASAN] Input dari pengguna wajib divalidasi sebelum diproses
//          (never trust user input), agar data konsisten & aman.

import { z } from 'zod';

// [FUNGSI] Validasi data jabatan.
export const jabatanSchema = z.object({
  kode: z.string().min(1, 'Kode wajib diisi').max(20),
  nama: z.string().min(1, 'Nama wajib diisi').max(100),
  gajiPokok: z.number().int().positive('Gaji pokok harus angka positif'),
});
export type JabatanInput = z.infer<typeof jabatanSchema>;

// [FUNGSI] Validasi pengaturan umum (uang makan per bulan).
export const pengaturanSchema = z.object({
  uangMakanPerBulan: z.number().int().positive('Uang makan harus angka positif'),
});
export type PengaturanInput = z.infer<typeof pengaturanSchema>;

// [FUNGSI] Validasi data kapal (unit TB + BG).
export const kapalSchema = z.object({
  namaUnit: z.string().min(1, 'Nama unit wajib diisi'),
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
