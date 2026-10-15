// src/modules/finance/finance.model.ts
// [FUNGSI] Skema validasi modul Finance.
// [ALASAN] Input vendor, invoice, PV, dan konfigurasi divalidasi dengan zod.

import { z } from 'zod';

export const KATEGORI = ['FREIGHT', 'OPERATION', 'OTHERS'] as const;
export const TIPE = ['REGULAR', 'DP', 'PELUNASAN'] as const;
export const FAKTUR_STATUS = ['SUDAH_DITERIMA', 'BELUM_DITERIMA', 'TIDAK_ADA'] as const;

// [FUNGSI] Nilai uang: angka desimal (2 digit) dari frontend.
const uang = z.number();

export const vendorBankSchema = z.object({
  accountNo: z.string().min(1, 'Nomor rekening wajib diisi'),
  accountName: z.string().min(1, 'Nama pemilik rekening wajib diisi'),
  bank: z.string().min(1, 'Nama bank wajib diisi'),
});

export const vendorSchema = z.object({
  nama: z.string().min(1, 'Nama vendor wajib diisi'),
  npwp: z.string().optional(),
  alamat: z.string().optional(),
  banks: z.array(vendorBankSchema).optional().default([]),
});
export type VendorInput = z.infer<typeof vendorSchema>;

export const invoiceSchema = z.object({
  kategori: z.enum(KATEGORI).optional(),
  tipe: z.enum(TIPE).optional(),
  tanggal: z.string().min(1, 'Tanggal invoice wajib diisi'),
  bupot: z.string().optional().nullable(),
  vendorId: z.string().min(1, 'Vendor wajib diisi'),
  bankAccountId: z.string().optional().nullable(),
  inv: z.string().optional().nullable(),
  ref: z.string().optional().nullable(),
  keterangan: z.string().optional().nullable(),
  dpp: uang,
  ppn: uang.optional().nullable(),
  pphPasal: z.string().optional().nullable(),
  pph: uang.optional().nullable(),
  dueDate: z.string().optional().nullable(),
  masaPajakPPN: z.string().optional().nullable(),
  masaPajakPPH: z.string().optional().nullable(),
  statusFakturPajak: z.enum(FAKTUR_STATUS).optional(),
  parentInvoiceId: z.string().optional().nullable(),
  fakturPajak: z.array(z.object({ nomor: z.string().min(1) })).optional().default([]),
});
export type InvoiceInput = z.infer<typeof invoiceSchema>;

// [FUNGSI] Satu baris item PV: invoice + DPP yang dibayar + flag PPN/PPH.
export const pvItemSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice wajib dipilih'),
  nominal: uang,
  includeTax: z.boolean().optional(),
});

export const pvSchema = z.object({
  pvNo: z.string().min(1, 'Nomor PV wajib diisi'),
  tanggal: z.string().min(1, 'Tanggal wajib diisi'),
  vendorId: z.string().min(1, 'Vendor wajib diisi'),
  bankAccountId: z.string().optional().nullable(),
  chequeNo: z.string().optional().nullable(),
  issuedDate: z.string().optional().nullable(),
  bankCharge: uang.optional().nullable(),
  balance: uang.optional().nullable(),
  keterangan: z.string().optional().nullable(),
  items: z.array(pvItemSchema).min(1, 'Minimal satu invoice'),
});
export type PvInput = z.infer<typeof pvSchema>;

export const konfigurasiSchema = z.object({
  perusahaanNama: z.string().min(1, 'Nama perusahaan wajib diisi'),
  alamat1: z.string().optional(),
  alamat2: z.string().optional(),
  alamat3: z.string().optional(),
  alamat4: z.string().optional(),
  ttdPrepared: z.string().optional(),
  ttdVerified: z.string().optional(),
  ttdApproved: z.string().optional(),
});
export type KonfigurasiInput = z.infer<typeof konfigurasiSchema>;
