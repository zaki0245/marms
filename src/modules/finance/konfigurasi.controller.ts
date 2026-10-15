// src/modules/finance/konfigurasi.controller.ts
// [FUNGSI] Controller konfigurasi Finance.
// [ALASAN] Memisahkan urusan HTTP dari logika bisnis.

import type { Request, Response } from 'express';
import * as service from './konfigurasi.service';
import { konfigurasiSchema } from './finance.model';

export async function get(_req: Request, res: Response) {
  res.json(await service.getKonfigurasi());
}

export async function update(req: Request, res: Response) {
  const input = konfigurasiSchema.parse(req.body);
  res.json(await service.updateKonfigurasi(input));
}
