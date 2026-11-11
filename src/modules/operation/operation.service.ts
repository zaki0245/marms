// src/modules/operation/operation.service.ts
// [FUNGSI] Logika bisnis modul Operation: shipment, dokumen, data peta.
// [ALASAN] Semua akses database shipment terpusat di sini.

import { prisma } from '../../shared/prisma';
import { hitungLaytime } from './laytime';
import type { ShipmentInput } from './operation.model';

// [FUNGSI] Selalu sertakan dokumen pada detail shipment.
const DOKUMEN = { documents: { orderBy: { createdAt: 'asc' as const } } };

export interface DokumenInput {
  nama: string;
  file: string;
}

// [FUNGSI] Buat nomor shipment otomatis: SHP-YYYY-NNNN (reset tiap tahun).
// [ALASAN] Nomor unik & mudah dirujuk saat komunikasi dengan customer.
export async function generateKode(): Promise<string> {
  const tahun = new Date().getFullYear();
  const prefix = `SHP-${tahun}-`;
  const last = await prisma.shipment.findFirst({
    where: { kode: { startsWith: prefix } },
    orderBy: { kode: 'desc' },
    select: { kode: true },
  });
  let next = 1;
  if (last) {
    const n = Number(last.kode.slice(prefix.length));
    if (!Number.isNaN(n)) next = n + 1;
  }
  return `${prefix}${String(next).padStart(4, '0')}`;
}

export function listShipments() {
  return prisma.shipment.findMany({ orderBy: { updatedAt: 'desc' }, include: DOKUMEN });
}

export function getShipment(id: string) {
  return prisma.shipment.findUnique({ where: { id }, include: DOKUMEN });
}

// [FUNGSI] Payload ringan untuk peta: hanya voyage yang sedang berjalan.
export function listOngoing() {
  return prisma.shipment.findMany({
    where: { status: 'ON_GOING' },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      kode: true,
      tb: true,
      bg: true,
      pol: true,
      pod: true,
      position: true,
      remarks: true,
      latitude: true,
      longitude: true,
      updatedAt: true,
    },
  });
}

export async function createShipment(input: ShipmentInput, dokumen: DokumenInput[] = []) {
  const laytime = hitungLaytime(input);
  return prisma.shipment.create({
    data: {
      ...input,
      ...laytime,
      kode: await generateKode(),
      documents: dokumen.length ? { create: dokumen } : undefined,
    },
    include: DOKUMEN,
  });
}

export function updateShipment(id: string, input: ShipmentInput, dokumen: DokumenInput[] = []) {
  const laytime = hitungLaytime(input);
  return prisma.shipment.update({
    where: { id },
    data: {
      ...input,
      ...laytime,
      ...(dokumen.length ? { documents: { create: dokumen } } : {}),
    },
    include: DOKUMEN,
  });
}

// [FUNGSI] Hapus satu dokumen milik shipment; return record untuk hapus file fisik.
export async function deleteDocument(shipmentId: string, docId: string) {
  const doc = await prisma.shipmentDocument.findFirst({
    where: { id: docId, shipmentId },
  });
  if (!doc) return null;
  await prisma.shipmentDocument.delete({ where: { id: doc.id } });
  return doc;
}

export function deleteShipment(id: string) {
  return prisma.shipment.delete({ where: { id } });
}
