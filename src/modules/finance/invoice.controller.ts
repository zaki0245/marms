// src/modules/finance/invoice.controller.ts
// [FUNGSI] Controller Invoice Finance.
// [ALASAN] Memisahkan urusan HTTP dari logika bisnis.

import type { Request, Response } from 'express';
import * as service from './invoice.service';
import { invoiceSchema } from './finance.model';

export async function list(req: Request, res: Response) {
  res.json(await service.listInvoices({
    status: req.query.status as string | undefined,
    jenis: req.query.jenis as string | undefined,
  }));
}

export async function get(req: Request, res: Response) {
  const inv = await service.getInvoice(req.params.id);
  if (!inv) {
    res.status(404).json({ error: 'Invoice tidak ditemukan' });
    return;
  }
  res.json(inv);
}

export async function create(req: Request, res: Response) {
  const input = invoiceSchema.parse(req.body);
  res.status(201).json(await service.createInvoice(input));
}

export async function update(req: Request, res: Response) {
  const input = invoiceSchema.parse(req.body);
  res.json(await service.updateInvoice(req.params.id, input));
}

export async function remove(req: Request, res: Response) {
  await service.deleteInvoice(req.params.id);
  res.json({ ok: true });
}
