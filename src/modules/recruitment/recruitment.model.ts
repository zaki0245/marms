// src/modules/recruitment/recruitment.model.ts
// [FUNGSI] Skema validasi & daftar dokumen untuk modul Rekrutmen.
// [ALASAN] Input form publik divalidasi; daftar 9 dokumen jadi acuan upload.

import { z } from 'zod';

// [FUNGSI] Daftar dokumen beserta kode, label, dan penanda punya expired atau tidak.
export const DOKUMEN_LIST = [
  { kode: 'foto', label: 'Foto 4x6', expired: false },
  { kode: 'cv', label: 'CV', expired: false },
  { kode: 'ktp', label: 'KTP', expired: false },
  { kode: 'npwp', label: 'NPWP', expired: false },
  { kode: 'paspor', label: 'Paspor', expired: true },
  { kode: 'buku_pelaut', label: 'Buku Pelaut', expired: true },
  { kode: 'skck', label: 'SKCK', expired: true },
  { kode: 'mcu', label: 'MCU', expired: true },
  { kode: 'bpjs_kesehatan', label: 'BPJS Kesehatan', expired: false },
  { kode: 'bpjs_ketenagakerjaan', label: 'BPJS Ketenagakerjaan', expired: false },
  { kode: 'coc_ant_att', label: 'CoC/ANT/ATT', expired: true },
  { kode: 'bst', label: 'BST', expired: true },
  { kode: 'scrb', label: 'SCRB', expired: true },
  { kode: 'aff', label: 'AFF', expired: true },
  { kode: 'mfa', label: 'MFA', expired: true },
  { kode: 'mc', label: 'MC', expired: true },
  { kode: 'radar', label: 'RADAR', expired: true },
  { kode: 'arpa', label: 'ARPA', expired: true },
  { kode: 'goc_gmdss', label: 'GOC/GMDSS', expired: true },
  { kode: 'mooring_master', label: 'MOORING MASTER', expired: true },
  { kode: 'mutasi_off', label: 'MUTASI OFF', expired: false },
] as const;

// [FUNGSI] Validasi data pribadi & pengalaman pelamar (form publik).
export const pelamarSchema = z.object({
  namaLengkap: z.string().min(1, 'Nama lengkap wajib diisi'),
  tempatLahir: z.string().min(1, 'Tempat lahir wajib diisi'),
  tanggalLahir: z.string().min(1, 'Tanggal lahir wajib diisi'),
  jenisKelamin: z.enum(['LAKI_LAKI', 'PEREMPUAN']),
  noHp: z.string().min(6, 'No HP wajib diisi'),
  email: z.string().email('Format email tidak valid'),
  alamat: z.string().min(1, 'Alamat wajib diisi'),
  kontakReferensi: z.string().optional(),
  posisiDilamar: z.string().min(1, 'Posisi dilamar wajib diisi'),
  pengalamanTahun: z.string().optional(),
  kapalTerakhir: z.string().optional(),
  jabatanTerakhir: z.string().optional(),
});
export type PelamarInput = z.infer<typeof pelamarSchema>;

// [FUNGSI] Validasi perubahan status seleksi pelamar.
export const statusSchema = z.object({
  status: z.enum(['BARU', 'VERIFIKASI', 'INTERVIEW', 'DITERIMA', 'DITOLAK']),
});
export type StatusInput = z.infer<typeof statusSchema>;

// [FUNGSI] Validasi verifikasi dokumen (nomor, tanggal, status).
export const dokumenSchema = z.object({
  nomor: z.string().optional(),
  tanggalTerbit: z.string().optional(),
  tanggalExpired: z.string().optional(),
  status: z.enum(['PENDING', 'TERVERIFIKASI', 'DITOLAK']),
  catatan: z.string().optional(),
});
export type DokumenInput = z.infer<typeof dokumenSchema>;
