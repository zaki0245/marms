// src/modules/finance/pv.service.ts
// [FUNGSI] Logika bisnis Voucher (PV untuk AP & RV untuk AR).
// [ALASAN] Satu voucher bisa membayar banyak invoice; status invoice turun dari akumulasi nominal.

import { prisma } from '../../shared/prisma';
import { AppError } from '../../shared/AppError';
import { resolveVendorSnapshot, resolveCustomerSnapshot, recomputeStatus } from './invoice.service';
import type { PvInput } from './finance.model';

export function listPv(jenis?: string) {
  return prisma.pv.findMany({
    where: jenis && jenis !== 'SEMUA' ? { jenis: jenis as any } : {},
    include: { items: { include: { invoice: true } } },
    orderBy: [{ tanggal: 'desc' }, { createdAt: 'desc' }],
  });
}

export function getPv(id: string) {
  return prisma.pv.findUnique({ where: { id }, include: { items: { include: { invoice: true } } } });
}

// [FUNGSI] Pastikan semua item valid, satu jenis, & milik counterparty yang sama.
async function validateItems(input: PvInput, jenis: string, counterpartyId: string) {
  const ids = input.items.map((it) => it.invoiceId);
  const invoices = await prisma.invoice.findMany({
    where: { id: { in: ids } },
    select: { id: true, jenis: true, vendorId: true, customerId: true },
  });
  if (invoices.length !== ids.length) throw new AppError(404, 'Salah satu invoice tidak ditemukan');
  const expectedJenis = jenis === 'RV' ? 'AR' : 'AP';
  for (const inv of invoices) {
    if (inv.jenis !== expectedJenis) {
      throw new AppError(400, jenis === 'RV' ? 'RV hanya boleh berisi invoice AR' : 'PV hanya boleh berisi invoice AP');
    }
    const belongs = jenis === 'RV' ? inv.customerId === counterpartyId : inv.vendorId === counterpartyId;
    if (!belongs) {
      throw new AppError(400, 'Semua invoice dalam satu voucher harus dari counterparty yang sama');
    }
  }
}

// [FUNGSI] Susun data counterparty sesuai jenis voucher (RV=customer, PV=vendor).
async function buildCounterparty(input: PvInput, jenis: string) {
  const counterpartyId = jenis === 'RV' ? input.customerId : input.vendorId;
  if (!counterpartyId) {
    throw new AppError(400, jenis === 'RV' ? 'Customer wajib diisi' : 'Vendor wajib diisi');
  }
  const snap = jenis === 'RV'
    ? await resolveCustomerSnapshot(counterpartyId, input.bankAccountId)
    : await resolveVendorSnapshot(counterpartyId, input.bankAccountId);
  const ids = jenis === 'RV'
    ? { vendorId: null, vendorName: null, vendorNpwp: null, vendorAlamat: null, customerId: counterpartyId }
    : { vendorId: counterpartyId, customerId: null, customerName: null, customerNpwp: null, customerAlamat: null };
  return { ...ids, ...snap };
}

export async function createPv(input: PvInput) {
  const jenis = input.jenis ?? 'PV';
  const cp = await buildCounterparty(input, jenis);

  const exists = await prisma.pv.findUnique({ where: { pvNo: input.pvNo } });
  if (exists) throw new AppError(409, 'Nomor sudah ada (duplikat)');

  await validateItems(input, jenis, jenis === 'RV' ? input.customerId! : input.vendorId!);

  const pv = await prisma.pv.create({
    data: {
      jenis,
      pvNo: input.pvNo,
      tanggal: new Date(input.tanggal),
      ...cp,
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
  if (!existing) throw new AppError(404, 'Voucher tidak ditemukan');

  const jenis = input.jenis ?? 'PV';
  const cp = await buildCounterparty(input, jenis);

  const dup = await prisma.pv.findFirst({ where: { pvNo: input.pvNo, NOT: { id } } });
  if (dup) throw new AppError(409, 'Nomor sudah ada (duplikat)');

  await validateItems(input, jenis, jenis === 'RV' ? input.customerId! : input.vendorId!);

  await prisma.pvItem.deleteMany({ where: { pvId: id } });

  const pv = await prisma.pv.update({
    where: { id },
    data: {
      jenis,
      pvNo: input.pvNo,
      tanggal: new Date(input.tanggal),
      ...cp,
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
  if (!existing) throw new AppError(404, 'Voucher tidak ditemukan');
  await prisma.pv.delete({ where: { id } });
  await Promise.all(existing.items.map((it) => recomputeStatus(it.invoiceId)));
  return { ok: true };
}
