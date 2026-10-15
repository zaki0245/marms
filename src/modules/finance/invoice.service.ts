// src/modules/finance/invoice.service.ts
// [FUNGSI] Logika bisnis Invoice Finance.
// [ALASAN] Nomor otomatis, cek duplikat, snapshot vendor, hitung total terpusat di sini.

import { prisma } from '../../shared/prisma';
import { AppError } from '../../shared/AppError';
import type { InvoiceInput } from './finance.model';
import type { Prisma } from '@prisma/client';

// [FUNGSI] Buat nomor invoice otomatis: INV-YYYY-NNNN (reset tiap tahun).
export async function generateNoInvoice(): Promise<string> {
  const tahun = new Date().getFullYear();
  const prefix = `INV-${tahun}-`;
  const last = await prisma.invoice.findFirst({
    where: { no: { startsWith: prefix } },
    orderBy: { no: 'desc' },
    select: { no: true },
  });
  let next = 1;
  if (last) {
    const n = Number(last.no.slice(prefix.length));
    if (!Number.isNaN(n)) next = n + 1;
  }
  return `${prefix}${String(next).padStart(4, '0')}`;
}

// [FUNGSI] Ambil snapshot vendor + satu rekening bank.
// [ALASAN] Dipakai bersama oleh Invoice & PV agar nilai vendor beku saat dibuat.
export async function resolveVendorSnapshot(vendorId: string, bankAccountId?: string | null) {
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, include: { banks: true } });
  if (!vendor) throw new AppError(404, 'Vendor tidak ditemukan');
  const bank = vendor.banks.find((b) => b.id === bankAccountId) ?? vendor.banks[0] ?? null;
  return {
    vendorName: vendor.nama,
    vendorNpwp: vendor.npwp ?? null,
    vendorAlamat: vendor.alamat ?? null,
    bankAccountNo: bank?.accountNo ?? null,
    bankAccountName: bank?.accountName ?? null,
    bank: bank?.bank ?? null,
  };
}

// [FUNGSI] Susun data Invoice dari input (dipakai create & update).
async function buildData(input: InvoiceInput): Promise<Omit<Prisma.InvoiceUncheckedCreateInput, 'no'>> {
  const snap = await resolveVendorSnapshot(input.vendorId, input.bankAccountId);
  // [FUNGSI] Invoice DP tidak membawa PPN/PPH; PPN/PPH hanya di Pelunasan/final.
  const isDp = (input.tipe ?? 'REGULAR') === 'DP';
  const ppn = isDp ? null : input.ppn ?? null;
  const pph = isDp ? null : input.pph ?? null;
  const total = (input.dpp ?? 0) + (ppn ?? 0) - (pph ?? 0);
  return {
    kategori: input.kategori ?? 'OTHERS',
    tipe: input.tipe ?? 'REGULAR',
    tanggal: new Date(input.tanggal),
    bupot: input.bupot || null,
    vendorId: input.vendorId,
    bankAccountId: input.bankAccountId || null,
    ...snap,
    inv: input.inv?.trim() || null,
    ref: input.ref || null,
    keterangan: input.keterangan || null,
    dpp: input.dpp ?? 0,
    ppn,
    pphPasal: input.pphPasal || null,
    pph,
    total,
    dueDate: input.dueDate ? new Date(input.dueDate) : null,
    masaPajakPPN: input.masaPajakPPN || null,
    masaPajakPPH: input.masaPajakPPH || null,
    statusFakturPajak: input.statusFakturPajak ?? 'BELUM_DITERIMA',
    parentInvoiceId: input.parentInvoiceId || null,
    // [FUNGSI] Belum lengkap = bupot belum diisi (boleh dilengkapi nanti).
    incomplete: !input.bupot,
    fakturPajak: { create: input.fakturPajak ?? [] },
  };
}

export function listInvoices(params: { q?: string; status?: string } = {}) {
  const statuses = params.status
    ? params.status.split(',').filter((s) => s && s !== 'SEMUA')
    : [];
  return prisma.invoice.findMany({
    where: {
      ...(statuses.length ? { statusPembayaran: { in: statuses as any } } : {}),
    },
    include: {
      fakturPajak: true,
      pvItems: { select: { id: true, invoiceId: true, nominal: true } },
      vendor: { select: { id: true, nama: true } },
    },
    orderBy: { no: 'desc' },
  });
}

export function getInvoice(id: string) {
  return prisma.invoice.findUnique({
    where: { id },
    include: {
      fakturPajak: true,
      pvItems: true,
      vendor: { include: { banks: true } },
      parent: true,
      children: true,
    },
  });
}

export async function createInvoice(input: InvoiceInput) {
  const inv = input.inv?.trim() || null;
  if (inv) {
    const exists = await prisma.invoice.findFirst({ where: { vendorId: input.vendorId, inv } });
    if (exists) throw new AppError(409, 'Vendor + nomor invoice sudah ada (duplikat)');
  }

  const no = await generateNoInvoice();
  const data = await buildData(input);
  return prisma.invoice.create({ data: { ...data, no }, include: { fakturPajak: true } });
}

export async function updateInvoice(id: string, input: InvoiceInput) {
  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Invoice tidak ditemukan');

  const inv = input.inv?.trim() || null;
  if (inv) {
    const exists = await prisma.invoice.findFirst({
      where: { vendorId: input.vendorId, inv, NOT: { id } },
    });
    if (exists) throw new AppError(409, 'Vendor + nomor invoice sudah ada (duplikat)');
  }

  const data = await buildData(input);
  await prisma.fakturPajak.deleteMany({ where: { invoiceId: id } });
  return prisma.invoice.update({
    where: { id },
    data,
    include: { fakturPajak: true },
  });
}

// [FUNGSI] Hitung ulang status pembayaran invoice dari akumulasi DPP + pajak PV.
// [ALASAN] Status BELUM_BAYAR/SEBAGIAN/LUNAS jadi otomatis (bukan manual).
export async function recomputeStatus(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { pvItems: { select: { nominal: true, includeTax: true } } },
  });
  if (!invoice) return;
  const taxDelta = Number(invoice.ppn ?? 0) - Number(invoice.pph ?? 0);
  const paid = invoice.pvItems.reduce(
    (s, it) => s + Number(it.nominal) + (it.includeTax ? taxDelta : 0),
    0,
  );
  const total = Number(invoice.total);
  let status: 'BELUM_BAYAR' | 'SEBAGIAN' | 'LUNAS' = 'BELUM_BAYAR';
  if (paid > 0 && paid < total) status = 'SEBAGIAN';
  else if (paid >= total) status = 'LUNAS';
  await prisma.invoice.update({ where: { id: invoiceId }, data: { statusPembayaran: status } });
}

// [FUNGSI] Hapus invoice; tolak bila jadi induk DP/Pelunasan atau sudah dibayar.
export async function deleteInvoice(id: string) {
  const existing = await prisma.invoice.findUnique({
    where: { id },
    include: { children: { select: { id: true } }, pvItems: { select: { id: true } } },
  });
  if (!existing) throw new AppError(404, 'Invoice tidak ditemukan');
  if (existing.children.length > 0) {
    throw new AppError(409, 'Invoice punya invoice DP/Pelunasan, tidak bisa dihapus');
  }
  if (existing.pvItems.length > 0) {
    throw new AppError(409, 'Invoice sudah dibayar (ada PV), tidak bisa dihapus');
  }
  return prisma.invoice.delete({ where: { id } });
}
