// src/modules/finance/customer.controller.ts
// [FUNGSI] Controller master Customer Finance.
// [ALASAN] Memisahkan urusan HTTP dari logika bisnis.

import type { Request, Response } from 'express';
import * as service from './customer.service';
import { customerSchema } from './finance.model';

export async function list(_req: Request, res: Response) {
  res.json(await service.listCustomers());
}

export async function get(req: Request, res: Response) {
  const c = await service.getCustomer(req.params.id);
  if (!c) {
    res.status(404).json({ error: 'Customer tidak ditemukan' });
    return;
  }
  res.json(c);
}

export async function create(req: Request, res: Response) {
  const input = customerSchema.parse(req.body);
  res.status(201).json(await service.createCustomer(input));
}

export async function update(req: Request, res: Response) {
  const input = customerSchema.parse(req.body);
  res.json(await service.updateCustomer(req.params.id, input));
}

export async function remove(req: Request, res: Response) {
  await service.deleteCustomer(req.params.id);
  res.json({ ok: true });
}
