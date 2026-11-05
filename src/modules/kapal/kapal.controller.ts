// src/modules/kapal/kapal.controller.ts
// [FUNGSI] Controller modul Kapal: HTTP handler.
// [ALASAN] Pemisahan tanggung jawab: controller urus HTTP, service urus logika.

import type { Request, Response } from 'express';
import * as service from './kapal.service';
import { kapalSchema } from './kapal.model';

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
