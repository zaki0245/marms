// src/modules/kapal/kapal.routes.ts
// [FUNGSI] Endpoint HTTP modul Kapal.
// [ALASAN] Route dipisah agar modul mandiri & mudah dibaca.

import { Router } from 'express';
import { asyncHandler } from '../../shared/asyncHandler';
import * as c from './kapal.controller';

const router = Router();

router.get('/', asyncHandler(c.listKapal));
router.post('/', asyncHandler(c.createKapal));
router.get('/:id', asyncHandler(c.getKapal));
router.put('/:id', asyncHandler(c.updateKapal));
router.delete('/:id', asyncHandler(c.deleteKapal));

export default router;
