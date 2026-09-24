// src/modules/payroll/payroll.routes.ts
// [FUNGSI] Mendefinisikan endpoint HTTP modul Payroll.
// [ALASAN] Route dipisah agar modul mandiri & mudah dibaca.

import { Router } from 'express';
import { asyncHandler } from '../../shared/asyncHandler';
import * as c from './payroll.controller';

const router = Router();

router.post('/', asyncHandler(c.generate));
router.get('/', asyncHandler(c.list));
router.get('/:id', asyncHandler(c.get));
router.post('/:id/finalize', asyncHandler(c.finalize));
router.post('/:id/mark-paid', asyncHandler(c.markPaid));
router.delete('/:id', asyncHandler(c.remove));

export default router;
