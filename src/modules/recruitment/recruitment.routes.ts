// src/modules/recruitment/recruitment.routes.ts
// [FUNGSI] Mendefinisikan endpoint HTTP modul Rekrutmen.
// [ALASAN] Route dipisah agar modul mandiri & mudah dibaca.

import { Router } from 'express';
import { asyncHandler } from '../../shared/asyncHandler';
import { upload } from '../../shared/upload';
import { DOKUMEN_LIST } from './recruitment.model';
import * as c from './recruitment.controller';

const router = Router();

// [FUNGSI] Daftar field upload (satu field per jenis dokumen, max 1 file).
const dokumenFields = DOKUMEN_LIST.map((d) => ({ name: `dokumen_${d.kode}`, maxCount: 1 }));

// Pendaftaran pelamar (publik, multipart).
router.post('/pelamar', upload.fields(dokumenFields), asyncHandler(c.createPelamar));

// Admin: daftar & detail pelamar, ubah status, verifikasi dokumen, statistik.
router.get('/pelamar', asyncHandler(c.listPelamar));
router.get('/pelamar/:id', asyncHandler(c.getPelamar));
router.patch('/pelamar/:id/status', asyncHandler(c.updateStatus));
router.patch('/pelamar/dokumen/:dokumenId', asyncHandler(c.updateDokumen));
router.post('/dokumen/:dokumenId/update', upload.single('file'), asyncHandler(c.updateDokumenFile));
router.get('/stats', asyncHandler(c.getStats));
router.get('/kandidat', asyncHandler(c.listKandidat));

export default router;
