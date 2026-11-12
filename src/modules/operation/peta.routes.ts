// src/modules/operation/peta.routes.ts
// [FUNGSI] Route publik gambar peta posisi kapal (tautan pendek dari laporan WA).
// [ALASAN] Customer membuka tautan tanpa login; API key Geoapify tidak ikut terkirim.

import { Router } from 'express';
import { asyncHandler } from '../../shared/asyncHandler';
import * as c from './peta.controller';

const router = Router();

router.get('/:kode', asyncHandler(c.gambarPeta));

export default router;
