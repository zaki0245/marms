// src/modules/finance/finance.controller.ts
// [FUNGSI] Controller Finance (scaffold awal, belum ada fitur).
// [ALASAN] Penanda modul Finance siap diisi fitur nanti.

import type { Request, Response } from 'express';

export async function index(_req: Request, res: Response) {
  res.json({ ok: true, modul: 'Finance' });
}
