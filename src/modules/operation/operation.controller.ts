// src/modules/operation/operation.controller.ts
// [FUNGSI] Controller modul Operation: HTTP handler shipment + dokumen.
// [ALASAN] Controller urus HTTP (multipart, file, status code), service urus data.

import fs from 'fs';
import type { Request, Response } from 'express';
import { AppError } from '../../shared/AppError';
import { UPLOAD_DIR, verifyFileSignature } from '../../shared/upload';
import { agentSchema, shipmentSchema } from './operation.model';
import * as service from './operation.service';

// [FUNGSI] Ambil teks dari body multipart; kosong jadi null.
function str(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t === '' ? null : t;
}

// [FUNGSI] Ambil angka dari body multipart; kosong jadi null.
function num(v: unknown): number | null {
  const s = str(v);
  if (s === null) return null;
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
}

// [FUNGSI] Ambil tanggal dari body multipart (ISO string).
function tgl(v: unknown): Date | null {
  const s = str(v);
  if (s === null) return null;
  return new Date(s);
}

// [FUNGSI] Ubah body multipart (semua string) menjadi objek yang divalidasi zod.
// [ALASAN] Form memakai FormData karena ada upload dokumen, sehingga tipe perlu dikonversi.
function parseBody(body: Record<string, unknown>) {
  return shipmentSchema.parse({
    tb: str(body.tb) ?? '',
    bg: str(body.bg) ?? '',
    ownerOperator: str(body.ownerOperator),
    shipper: str(body.shipper),
    commodities: str(body.commodities),
    contactMaster: str(body.contactMaster),
    laycan: str(body.laycan),
    pol: str(body.pol) ?? '',
    agentPol: str(body.agentPol),
    agentPolId: str(body.agentPolId),
    picPol: str(body.picPol),
    contactAgentPol: str(body.contactAgentPol),
    pod: str(body.pod),
    agentPod: str(body.agentPod),
    agentPodId: str(body.agentPodId),
    picPod: str(body.picPod),
    contactAgentPod: str(body.contactAgentPod),
    taPol: tgl(body.taPol),
    tbPol: tgl(body.tbPol),
    slPol: tgl(body.slPol),
    clPol: tgl(body.clPol),
    coPol: tgl(body.coPol),
    tdPol: tgl(body.tdPol),
    dsPol: tgl(body.dsPol),
    taPod: tgl(body.taPod),
    tbPod: tgl(body.tbPod),
    sdPod: tgl(body.sdPod),
    cdPod: tgl(body.cdPod),
    coPod: tgl(body.coPod),
    tdPod: tgl(body.tdPod),
    dsPod: tgl(body.dsPod),
    laytimeAllowed: num(body.laytimeAllowed),
    dsrPol: num(body.dsrPol),
    dsrPod: num(body.dsrPod),
    position: str(body.position),
    remarks: str(body.remarks),
    status: str(body.status) ?? 'PLANNED',
    latitude: num(body.latitude),
    longitude: num(body.longitude),
  });
}

// [FUNGSI] Hapus file fisik; hanya nama file yang aman.
function hapusFile(nama: string) {
  if (!/^[0-9a-f-]{36}\.(pdf|jpe?g|png)$/i.test(nama)) return;
  try {
    fs.unlinkSync(`${UPLOAD_DIR}/${nama}`);
  } catch {
    // [ALASAN] File mungkin sudah tidak ada; abaikan.
  }
}

// [FUNGSI] Pastikan semua file benar-benar PDF/JPG/PNG; hapus semua bila ada yang palsu.
function validasiDokumen(files?: Express.Multer.File[]) {
  if (!files?.length) return;
  if (files.some((f) => !verifyFileSignature(f.path))) {
    files.forEach((f) => hapusFile(f.filename));
    throw new AppError(400, 'File tidak valid');
  }
}

// [FUNGSI] Ubah file multer menjadi data dokumen (nama asli + nama file simpan).
function dokumenDari(files?: Express.Multer.File[]) {
  return (files ?? []).map((f) => ({ nama: f.originalname.slice(0, 255), file: f.filename }));
}

export async function listShipments(_req: Request, res: Response) {
  res.json(await service.listShipments());
}

export async function dashboard(_req: Request, res: Response) {
  res.json(await service.listOngoing());
}

export async function getShipment(req: Request, res: Response) {
  const shipment = await service.getShipment(req.params.id);
  if (!shipment) {
    res.status(404).json({ error: 'Shipment tidak ditemukan' });
    return;
  }
  res.json(shipment);
}

export async function createShipment(req: Request, res: Response) {
  const files = req.files as Express.Multer.File[] | undefined;
  validasiDokumen(files);
  let input;
  try {
    input = parseBody(req.body);
  } catch (err) {
    files?.forEach((f) => hapusFile(f.filename));
    throw err;
  }
  res.status(201).json(await service.createShipment(input, dokumenDari(files)));
}

export async function updateShipment(req: Request, res: Response) {
  const files = req.files as Express.Multer.File[] | undefined;
  validasiDokumen(files);
  const existing = await service.getShipment(req.params.id);
  if (!existing) {
    files?.forEach((f) => hapusFile(f.filename));
    res.status(404).json({ error: 'Shipment tidak ditemukan' });
    return;
  }
  let input;
  try {
    input = parseBody(req.body);
  } catch (err) {
    files?.forEach((f) => hapusFile(f.filename));
    throw err;
  }
  res.json(await service.updateShipment(req.params.id, input, dokumenDari(files)));
}

export async function deleteDocument(req: Request, res: Response) {
  const doc = await service.deleteDocument(req.params.id, req.params.docId);
  if (!doc) {
    res.status(404).json({ error: 'Dokumen tidak ditemukan' });
    return;
  }
  hapusFile(doc.file);
  res.status(204).end();
}

export async function deleteShipment(req: Request, res: Response) {
  const existing = await service.getShipment(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Shipment tidak ditemukan' });
    return;
  }
  await service.deleteShipment(req.params.id);
  existing.documents.forEach((d) => hapusFile(d.file));
  res.status(204).end();
}

// ================== MASTER AGEN ==================

export async function listAgents(req: Request, res: Response) {
  const tipe = req.query.tipe === 'POL' || req.query.tipe === 'POD' ? req.query.tipe : undefined;
  res.json(await service.listAgents(tipe));
}

export async function createAgent(req: Request, res: Response) {
  const input = agentSchema.parse(req.body);
  res.status(201).json(await service.createAgent(input));
}

export async function updateAgent(req: Request, res: Response) {
  const existing = await service.getAgent(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Agen tidak ditemukan' });
    return;
  }
  const input = agentSchema.parse(req.body);
  res.json(await service.updateAgent(req.params.id, input));
}

export async function deleteAgent(req: Request, res: Response) {
  const existing = await service.getAgent(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Agen tidak ditemukan' });
    return;
  }
  await service.deleteAgent(req.params.id);
  res.status(204).end();
}

// [FUNGSI] Nilai unik field voyage untuk saran input (memori).
export async function refs(_req: Request, res: Response) {
  res.json(await service.listRefs());
}
