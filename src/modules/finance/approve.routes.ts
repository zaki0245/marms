// src/modules/finance/approve.routes.ts
// [FUNGSI] Route publik approval voucher (di-mount sebelum proteksi auth).
// [ALASAN] Approver membuka tautan dari email tanpa login.

import { Router } from 'express';
import { asyncHandler } from '../../shared/asyncHandler';
import * as approve from './approve.controller';

const router = Router();

router.get('/:token', asyncHandler(approve.get));
router.post('/:token', asyncHandler(approve.approve));

export default router;
