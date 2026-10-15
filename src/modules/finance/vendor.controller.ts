// src/modules/finance/vendor.controller.ts
// [FUNGSI] Controller master Vendor Finance.
// [ALASAN] Memisahkan urusan HTTP dari logika bisnis.

import type { Request, Response } from 'express';
import * as service from './vendor.service';
import { vendorSchema } from './finance.model';

export async function list(_req: Request, res: Response) {
  res.json(await service.listVendors());
}

export async function get(req: Request, res: Response) {
  const v = await service.getVendor(req.params.id);
  if (!v) {
    res.status(404).json({ error: 'Vendor tidak ditemukan' });
    return;
  }
  res.json(v);
}

export async function create(req: Request, res: Response) {
  const input = vendorSchema.parse(req.body);
  res.status(201).json(await service.createVendor(input));
}

export async function update(req: Request, res: Response) {
  const input = vendorSchema.parse(req.body);
  res.json(await service.updateVendor(req.params.id, input));
}

export async function remove(req: Request, res: Response) {
  await service.deleteVendor(req.params.id);
  res.json({ ok: true });
}
