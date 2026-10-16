// src/modules/crew-placement/crew-placement.controller.ts
// [FUNGSI] Controller Kru & Penempatan: menangani request HTTP.
// [ALASAN] Memisahkan urusan HTTP dari logika bisnis.

import type { Request, Response } from 'express';
import * as service from './crew-placement.service';
import { assignSchema, bankSchema, offBoardSchema } from './crew-placement.model';

export async function assignApplicant(req: Request, res: Response) {
  const input = assignSchema.parse(req.body);
  const penempatan = await service.assignApplicantToVessel(req.params.applicantId, input);
  res.status(201).json(penempatan);
}

export async function assignCrew(req: Request, res: Response) {
  const input = assignSchema.parse(req.body);
  const penempatan = await service.assignCrewToVessel(req.params.id, input);
  res.status(201).json(penempatan);
}

export async function offBoard(req: Request, res: Response) {
  const input = offBoardSchema.parse(req.body);
  const crew = await service.offBoardCrew(req.params.id, input);
  res.json(crew);
}

export async function listCrew(_req: Request, res: Response) {
  res.json(await service.listCrew());
}

export async function getCrew(req: Request, res: Response) {
  const crew = await service.getCrew(req.params.id);
  if (!crew) {
    res.status(404).json({ error: 'Crew tidak ditemukan' });
    return;
  }
  res.json(crew);
}

export async function updateBank(req: Request, res: Response) {
  const input = bankSchema.parse(req.body);
  res.json(await service.updateBank(req.params.id, input));
}
