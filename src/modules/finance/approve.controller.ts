// src/modules/finance/approve.controller.ts
// [FUNGSI] Controller publik untuk approval invoice (via tautan email).
// [ALASAN] Approver tidak login; akses diamankan oleh token acak di tautan.

import type { Request, Response } from 'express';
import { getInvoiceByToken, approveInvoice } from './invoice.service';

export async function get(req: Request, res: Response) {
  res.json(await getInvoiceByToken(req.params.token));
}

export async function approve(req: Request, res: Response) {
  res.json(await approveInvoice(req.params.token));
}
