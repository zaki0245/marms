// src/modules/finance/finance.routes.ts
// [FUNGSI] Mendefinisikan endpoint HTTP modul Finance.
// [ALASAN] Route dipisah agar modul mandiri & mudah dibaca.

import { Router } from 'express';
import { asyncHandler } from '../../shared/asyncHandler';
import * as c from './finance.controller';

const router = Router();

router.get('/', asyncHandler(c.index));

export default router;
