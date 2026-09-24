// src/modules/leave-pay/leave-pay.routes.ts
// [FUNGSI] Mendefinisikan endpoint HTTP modul Leave Pay.
// [ALASAN] Route dipisah agar modul mandiri & mudah dibaca.

import { Router } from 'express';
import { asyncHandler } from '../../shared/asyncHandler';
import * as c from './leave-pay.controller';

const router = Router();

router.get('/', asyncHandler(c.list));
router.get('/:crewId/riwayat', asyncHandler(c.riwayat));
router.post('/:crewId/disburse', asyncHandler(c.disburse));

export default router;
