// src/modules/payroll/payroll.controller.ts
// [FUNGSI] Controller Payroll: menangani request HTTP.
// [ALASAN] Memisahkan urusan HTTP dari logika bisnis.

import type { Request, Response } from 'express';
import * as service from './payroll.service';
import { generateSchema } from './payroll.model';

export async function generate(req: Request, res: Response) {
  const input = generateSchema.parse(req.body);
  const payroll = await service.generatePayroll(input);
  res.status(201).json(payroll);
}

export async function list(_req: Request, res: Response) {
  res.json(await service.listPayroll());
}

export async function get(req: Request, res: Response) {
  const payroll = await service.getPayroll(req.params.id);
  if (!payroll) {
    res.status(404).json({ error: 'Payroll tidak ditemukan' });
    return;
  }
  res.json(payroll);
}

export async function finalize(req: Request, res: Response) {
  res.json(await service.finalizePayroll(req.params.id));
}

export async function markPaid(req: Request, res: Response) {
  res.json(await service.markPaid(req.params.id));
}

export async function remove(req: Request, res: Response) {
  await service.deletePayroll(req.params.id);
  res.status(204).end();
}
