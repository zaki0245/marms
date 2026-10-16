// src/modules/finance/laporan.controller.ts
// [FUNGSI] Controller Laporan Finance.
// [ALASAN] Memisahkan urusan HTTP dari logika bisnis.

import type { Request, Response } from 'express';
import * as service from './laporan.service';

export async function dashboard(_req: Request, res: Response) {
  res.json(await service.dashboard());
}

export async function rekap(req: Request, res: Response) {
  res.json(await service.rekap(req.query.jenis as string | undefined));
}
