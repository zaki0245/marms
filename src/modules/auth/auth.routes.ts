// src/modules/auth/auth.routes.ts
// [FUNGSI] Mendefinisikan endpoint HTTP modul Auth.
// [ALASAN] Route dipisah agar modul mandiri & mudah dibaca.

import { Router } from 'express';
import { asyncHandler } from '../../shared/asyncHandler';
import { requireRole } from '../../shared/authorization';
import * as c from './auth.controller';

const router = Router();

router.post('/login', asyncHandler(c.login));
router.post('/logout', asyncHandler(c.logout));
router.get('/me', asyncHandler(c.me));
router.post('/change-password', asyncHandler(c.changePassword));

// [FUNGSI] Manajemen akun — khusus SUPERADMIN.
router.get('/accounts', requireRole('SUPERADMIN'), asyncHandler(c.listAccounts));
router.post('/accounts', requireRole('SUPERADMIN'), asyncHandler(c.createAccount));
router.patch('/accounts/:id', requireRole('SUPERADMIN'), asyncHandler(c.updateAccount));

export default router;
