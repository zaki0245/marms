// src/modules/auth/auth.routes.ts
// [FUNGSI] Mendefinisikan endpoint HTTP modul Auth.
// [ALASAN] Route dipisah agar modul mandiri & mudah dibaca.

import { Router } from 'express';
import { asyncHandler } from '../../shared/asyncHandler';
import * as c from './auth.controller';

const router = Router();

router.post('/login', asyncHandler(c.login));
router.post('/logout', asyncHandler(c.logout));
router.get('/me', asyncHandler(c.me));
router.post('/change-password', asyncHandler(c.changePassword));

export default router;
