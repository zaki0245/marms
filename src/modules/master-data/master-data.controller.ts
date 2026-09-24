// src/modules/master-data/master-data.controller.ts
// [FUNGSI] Controller: menerima request HTTP, memvalidasi input, memanggil service.
// [ALASAN] Pemisahan tanggung jawab: controller urus HTTP, service urus logika bisnis.

import type { Request, Response } from 'express';
import * as service from './master-data.service';
import { jabatanSchema, kapalSchema, pengaturanSchema } from './master-data.model';

// ================== JABATAN ==================

export async function listJabatan(_req: Request, res: Response) {
  res.json(await service.listJabatan());
}

export async function createJabatan(req: Request, res: Response) {
  const input = jabatanSchema.parse(req.body);
  res.status(201).json(await service.createJabatan(input));
}

export async function updateJabatan(req: Request, res: Response) {
  const input = jabatanSchema.parse(req.body);
  res.json(await service.updateJabatan(req.params.kode, input));
}

export async function deleteJabatan(req: Request, res: Response) {
  await service.deleteJabatan(req.params.kode);
  res.status(204).end();
}

// ================== PENGATURAN ==================

export async function getPengaturan(_req: Request, res: Response) {
  res.json(await service.getPengaturan());
}

export async function updatePengaturan(req: Request, res: Response) {
  const input = pengaturanSchema.parse(req.body);
  res.json(await service.updatePengaturan(input));
}

// ================== KAPAL ==================

export async function listKapal(_req: Request, res: Response) {
  res.json(await service.listKapal());
}

export async function getKapal(req: Request, res: Response) {
  const kapal = await service.getKapal(req.params.id);
  if (!kapal) {
    res.status(404).json({ error: 'Kapal tidak ditemukan' });
    return;
  }
  res.json(kapal);
}

export async function createKapal(req: Request, res: Response) {
  const input = kapalSchema.parse(req.body);
  res.status(201).json(await service.createKapal(input));
}

export async function updateKapal(req: Request, res: Response) {
  const input = kapalSchema.parse(req.body);
  res.json(await service.updateKapal(req.params.id, input));
}

export async function deleteKapal(req: Request, res: Response) {
  await service.deleteKapal(req.params.id);
  res.status(204).end();
}
