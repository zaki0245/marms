// src/modules/reports/reports.routes.ts
// [FUNGSI] Mendefinisikan endpoint HTTP modul Laporan.
// [ALASAN] Route dipisah agar modul mandiri & mudah dibaca.

import { Router } from 'express';
import { asyncHandler } from '../../shared/asyncHandler';
import * as c from './reports.controller';

const router = Router();

router.get('/dashboard', asyncHandler(c.dashboard));
router.get('/crew-per-kapal', asyncHandler(c.crewPerKapal));
router.get('/dokumen-expired', asyncHandler(c.dokumenAkanExpired));
router.get('/masa-kerja', asyncHandler(c.masaKerja));

export default router;
