// src/modules/finance/pv.controller.ts
// [FUNGSI] Controller Payment Voucher (PV).
// [ALASAN] Memisahkan urusan HTTP dari logika bisnis.

import type { Request, Response } from 'express';
import * as service from './pv.service';
import { pvSchema } from './finance.model';

export async function list(_req: Request, res: Response) {
  res.json(await service.listPv());
}

export async function get(req: Request, res: Response) {
  const pv = await service.getPv(req.params.id);
  if (!pv) {
    res.status(404).json({ error: 'PV tidak ditemukan' });
    return;
  }
  res.json(pv);
}

export async function create(req: Request, res: Response) {
  const input = pvSchema.parse(req.body);
  res.status(201).json(await service.createPv(input));
}

export async function update(req: Request, res: Response) {
  const input = pvSchema.parse(req.body);
  res.json(await service.updatePv(req.params.id, input));
}

export async function remove(req: Request, res: Response) {
  await service.deletePv(req.params.id);
  res.json({ ok: true });
}
