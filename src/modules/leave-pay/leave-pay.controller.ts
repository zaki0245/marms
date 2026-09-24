// src/modules/leave-pay/leave-pay.controller.ts
// [FUNGSI] Controller Leave Pay: menangani request HTTP.
// [ALASAN] Memisahkan urusan HTTP dari logika bisnis.

import type { Request, Response } from 'express';
import * as service from './leave-pay.service';
import { disburseSchema } from './leave-pay.model';

export async function list(_req: Request, res: Response) {
  res.json(await service.listLeavePay());
}

export async function disburse(req: Request, res: Response) {
  const input = disburseSchema.parse(req.body);
  const result = await service.disburseLeavePay(req.params.crewId, input);
  res.status(201).json(result);
}

export async function riwayat(req: Request, res: Response) {
  res.json(await service.getRiwayat(req.params.crewId));
}
