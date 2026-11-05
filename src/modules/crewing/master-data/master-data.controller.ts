// src/modules/master-data/master-data.controller.ts
// [FUNGSI] Controller: menerima request HTTP, memvalidasi input, memanggil service.
// [ALASAN] Pemisahan tanggung jawab: controller urus HTTP, service urus logika bisnis.

import type { Request, Response } from 'express';
import * as service from './master-data.service';
import { jabatanSchema, pengaturanSchema } from './master-data.model';

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
