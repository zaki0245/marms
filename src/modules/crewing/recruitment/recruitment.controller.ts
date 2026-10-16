// src/modules/recruitment/recruitment.controller.ts
// [FUNGSI] Controller Rekrutmen: menangani request pendaftaran publik.
// [ALASAN] Memisahkan urusan HTTP dari logika bisnis.

import type { Request, Response } from 'express';
import * as service from './recruitment.service';
import { DOKUMEN_LIST, dokumenSchema, pelamarSchema, statusSchema } from './recruitment.model';

// [FUNGSI] Terima pendaftaran pelamar (multipart form + 21 file dokumen).
export async function createPelamar(req: Request, res: Response) {
  const input = pelamarSchema.parse(req.body);
  const files = (req.files ?? {}) as Record<string, Express.Multer.File[] | undefined>;
  // [FUNGSI] Ambil tanggal expired dari form (hanya untuk dokumen ber-expired).
  const expiryDates: Record<string, string> = {};
  for (const d of DOKUMEN_LIST) {
    const v = req.body[`tanggalExpired_${d.kode}`];
    if (v) expiryDates[d.kode] = v;
  }
  const pelamar = await service.createPelamar(input, files, expiryDates, req.ip);
  res.status(201).json(pelamar);
}

export async function listPelamar(req: Request, res: Response) {
  const status = req.query.status as string | undefined;
  res.json(await service.listPelamar(status));
}

export async function getPelamar(req: Request, res: Response) {
  const p = await service.getPelamar(req.params.id);
  if (!p) {
    res.status(404).json({ error: 'Pelamar tidak ditemukan' });
    return;
  }
  res.json(p);
}

export async function updateStatus(req: Request, res: Response) {
  const { status } = statusSchema.parse(req.body);
  res.json(await service.updatePelamarStatus(req.params.id, status));
}

export async function updateDokumen(req: Request, res: Response) {
  const input = dokumenSchema.parse(req.body);
  res.json(await service.updateDokumen(req.params.dokumenId, input));
}

export async function getStats(_req: Request, res: Response) {
  res.json(await service.getStats());
}

export async function listKandidat(_req: Request, res: Response) {
  res.json(await service.listAcceptedApplicants());
}

export async function updateDokumenFile(req: Request, res: Response) {
  const dokumen = await service.updateDokumenFile(req.params.dokumenId, {
    file: req.file,
    tanggalExpired: req.body.tanggalExpired,
  });
  res.json(dokumen);
}
