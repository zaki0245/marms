// src/modules/finance/pv.service.ts
// [FUNGSI] Logika bisnis Payment Voucher (PV).
// [ALASAN] Satu PV bisa membayar banyak invoice; status invoice turun dari akumulasi nominal.

import { prisma } from '../../shared/prisma';
import { AppError } from '../../shared/AppError';
import { resolveVendorSnapshot, recomputeStatus } from './invoice.service';
import type { PvInput } from './finance.model';

export function listPv() {
  return prisma.pv.findMany({
    include: { items: { include: { invoice: true } } },
    orderBy: [{ tanggal: 'desc' }, { createdAt: 'desc' }],
  });
}

export function getPv(id: string) {
  return prisma.pv.findUnique({ where: { id }, include: { items: { include: { invoice: true } } } });
}

// [FUNGSI] Pastikan semua invoice item valid & milik vendor yang sama dengan PV.
async function validateItems(input: PvInput, vendorId: string) {
  const ids = input.items.map((it) => it.invoiceId);
  const invoices = await prisma.invoice.findMany({
    where: { id: { in: ids } },
    select: { id: true, vendorId: true },
  });
  if (invoices.length !== ids.length) throw new AppError(404, 'Salah satu invoice tidak ditemukan');
  for (const inv of invoices) {
    if (inv.vendorId !== vendorId) {
      throw new AppError(400, 'Semua invoice dalam satu PV harus dari vendor yang sama');
    }
  }
}

export async function createPv(input: PvInput) {
  const snap = await resolveVendorSnapshot(input.vendorId, input.bankAccountId);

  const exists = await prisma.pv.findUnique({ where: { pvNo: input.pvNo } });
  if (exists) throw new AppError(409, 'Nomor PV sudah ada (duplikat)');

  await validateItems(input, input.vendorId);

  const pv = await prisma.pv.create({
    data: {
      pvNo: input.pvNo,
      tanggal: new Date(input.tanggal),
      vendorId: input.vendorId,
      ...snap,
      chequeNo: input.chequeNo || 'Online Banking',
      issuedDate: input.issuedDate ? new Date(input.issuedDate) : null,
      bankCharge: input.bankCharge ?? null,
      balance: input.balance ?? null,
      keterangan: input.keterangan || null,
      items: { create: input.items.map((it) => ({ invoiceId: it.invoiceId, nominal: it.nominal, includeTax: it.includeTax ?? false })) },
    },
    include: { items: true },
  });

  await Promise.all(input.items.map((it) => recomputeStatus(it.invoiceId)));
  return pv;
}

export async function updatePv(id: string, input: PvInput) {
  const existing = await prisma.pv.findUnique({ where: { id }, include: { items: true } });
  if (!existing) throw new AppError(404, 'PV tidak ditemukan');

  const dup = await prisma.pv.findFirst({ where: { pvNo: input.pvNo, NOT: { id } } });
  if (dup) throw new AppError(409, 'Nomor PV sudah ada (duplikat)');

  await validateItems(input, input.vendorId);

  const snap = await resolveVendorSnapshot(input.vendorId, input.bankAccountId);

  await prisma.pvItem.deleteMany({ where: { pvId: id } });

  const pv = await prisma.pv.update({
    where: { id },
    data: {
      pvNo: input.pvNo,
      tanggal: new Date(input.tanggal),
      vendorId: input.vendorId,
      ...snap,
      chequeNo: input.chequeNo || 'Online Banking',
      issuedDate: input.issuedDate ? new Date(input.issuedDate) : null,
      bankCharge: input.bankCharge ?? null,
      balance: input.balance ?? null,
      keterangan: input.keterangan || null,
      items: { create: input.items.map((it) => ({ invoiceId: it.invoiceId, nominal: it.nominal, includeTax: it.includeTax ?? false })) },
    },
    include: { items: true },
  });

  const affected = new Set([
    ...existing.items.map((i) => i.invoiceId),
    ...input.items.map((i) => i.invoiceId),
  ]);
  await Promise.all([...affected].map((invoiceId) => recomputeStatus(invoiceId)));
  return pv;
}

export async function deletePv(id: string) {
  const existing = await prisma.pv.findUnique({ where: { id }, include: { items: { select: { invoiceId: true } } } });
  if (!existing) throw new AppError(404, 'PV tidak ditemukan');
  await prisma.pv.delete({ where: { id } });
  await Promise.all(existing.items.map((it) => recomputeStatus(it.invoiceId)));
  return { ok: true };
}
