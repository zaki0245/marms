// src/modules/finance/vendor.service.ts
// [FUNGSI] Logika bisnis master Vendor Finance.
// [ALASAN] Akses database vendor terpusat di sini.

import { prisma } from '../../shared/prisma';
import { AppError } from '../../shared/AppError';
import type { VendorInput } from './finance.model';

export function listVendors() {
  return prisma.vendor.findMany({ include: { banks: true }, orderBy: { nama: 'asc' } });
}

export function getVendor(id: string) {
  return prisma.vendor.findUnique({ where: { id }, include: { banks: true } });
}

export function createVendor(input: VendorInput) {
  return prisma.vendor.create({
    data: {
      nama: input.nama,
      npwp: input.npwp || null,
      alamat: input.alamat || null,
      banks: { create: input.banks ?? [] },
    },
    include: { banks: true },
  });
}

export async function updateVendor(id: string, input: VendorInput) {
  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor) throw new AppError(404, 'Vendor tidak ditemukan');

  // [FUNGSI] Ganti nama/npwp, lalu hapus & buat ulang rekening bank.
  await prisma.vendorBank.deleteMany({ where: { vendorId: id } });
  return prisma.vendor.update({
    where: { id },
    data: {
      nama: input.nama,
      npwp: input.npwp || null,
      alamat: input.alamat || null,
      banks: { create: input.banks ?? [] },
    },
    include: { banks: true },
  });
}

export async function deleteVendor(id: string) {
  const used = await prisma.invoice.count({ where: { vendorId: id } });
  if (used > 0) throw new AppError(409, 'Vendor dipakai di invoice, tidak bisa dihapus');
  const usedPv = await prisma.pv.count({ where: { vendorId: id } });
  if (usedPv > 0) throw new AppError(409, 'Vendor dipakai di PV, tidak bisa dihapus');
  return prisma.vendor.delete({ where: { id } });
}
