// src/modules/reports/reports.controller.ts
// [FUNGSI] Controller Laporan: menangani request HTTP.
// [ALASAN] Memisahkan urusan HTTP dari logika bisnis.

import type { Request, Response } from 'express';
import * as service from './reports.service';

export async function dashboard(_req: Request, res: Response) {
  res.json(await service.getDashboard());
}

export async function crewPerKapal(_req: Request, res: Response) {
  res.json(await service.getCrewPerKapal());
}

export async function dokumenAkanExpired(_req: Request, res: Response) {
  res.json(await service.getDokumenAkanExpired());
}

export async function masaKerja(_req: Request, res: Response) {
  res.json(await service.getMasaKerja());
}
