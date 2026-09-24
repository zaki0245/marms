// src/modules/master-data/master-data.routes.ts
// [FUNGSI] Mendefinisikan endpoint HTTP modul Master Data.
// [ALASAN] Route dipisah agar modul mandiri & mudah dibaca.

import { Router } from 'express';
import { asyncHandler } from '../../shared/asyncHandler';
import * as c from './master-data.controller';

const router = Router();

// Jabatan
router.get('/jabatan', asyncHandler(c.listJabatan));
router.post('/jabatan', asyncHandler(c.createJabatan));
router.put('/jabatan/:kode', asyncHandler(c.updateJabatan));
router.delete('/jabatan/:kode', asyncHandler(c.deleteJabatan));

// Pengaturan umum
router.get('/pengaturan', asyncHandler(c.getPengaturan));
router.put('/pengaturan', asyncHandler(c.updatePengaturan));

// Kapal
router.get('/kapal', asyncHandler(c.listKapal));
router.post('/kapal', asyncHandler(c.createKapal));
router.get('/kapal/:id', asyncHandler(c.getKapal));
router.put('/kapal/:id', asyncHandler(c.updateKapal));
router.delete('/kapal/:id', asyncHandler(c.deleteKapal));

export default router;
