// src/modules/crew-placement/crew-placement.routes.ts
// [FUNGSI] Mendefinisikan endpoint HTTP modul Kru & Penempatan.
// [ALASAN] Route dipisah agar modul mandiri & mudah dibaca.

import { Router } from 'express';
import { asyncHandler } from '../../shared/asyncHandler';
import * as c from './crew-placement.controller';

const router = Router();

router.post('/assign-applicant/:applicantId', asyncHandler(c.assignApplicant));
router.post('/:id/assign', asyncHandler(c.assignCrew));
router.post('/:id/offboard', asyncHandler(c.offBoard));
router.patch('/:id/bank', asyncHandler(c.updateBank));
router.get('/', asyncHandler(c.listCrew));
router.get('/:id', asyncHandler(c.getCrew));

export default router;
