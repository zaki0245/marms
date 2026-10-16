// src/modules/finance/customer.service.ts
// [FUNGSI] Logika bisnis master Customer Finance.
// [ALASAN] Akses database customer (AR) terpusat di sini.

import { prisma } from '../../shared/prisma';
import { AppError } from '../../shared/AppError';
import type { CustomerInput } from './finance.model';

export function listCustomers() {
  return prisma.customer.findMany({ include: { banks: true }, orderBy: { nama: 'asc' } });
}

export function getCustomer(id: string) {
  return prisma.customer.findUnique({ where: { id }, include: { banks: true } });
}

export function createCustomer(input: CustomerInput) {
  return prisma.customer.create({
    data: {
      nama: input.nama,
      npwp: input.npwp || null,
      alamat: input.alamat || null,
      banks: { create: input.banks ?? [] },
    },
    include: { banks: true },
  });
}

export async function updateCustomer(id: string, input: CustomerInput) {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) throw new AppError(404, 'Customer tidak ditemukan');

  // [FUNGSI] Ganti nama/npwp, lalu hapus & buat ulang rekening bank.
  await prisma.customerBank.deleteMany({ where: { customerId: id } });
  return prisma.customer.update({
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

export async function deleteCustomer(id: string) {
  const used = await prisma.invoice.count({ where: { customerId: id } });
  if (used > 0) throw new AppError(409, 'Customer dipakai di invoice, tidak bisa dihapus');
  const usedPv = await prisma.pv.count({ where: { customerId: id } });
  if (usedPv > 0) throw new AppError(409, 'Customer dipakai di RV, tidak bisa dihapus');
  return prisma.customer.delete({ where: { id } });
}
