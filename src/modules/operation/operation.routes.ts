// src/modules/operation/operation.routes.ts
// [FUNGSI] Endpoint HTTP modul Operation.
// [ALASAN] Route dipisah agar modul mandiri & mudah dibaca.

import { Router } from 'express';
import { asyncHandler } from '../../shared/asyncHandler';
import { upload } from '../../shared/upload';
import * as c from './operation.controller';

const router = Router();

router.get('/dashboard', asyncHandler(c.dashboard));
router.get('/shipments', asyncHandler(c.listShipments));
router.get('/shipments/:id', asyncHandler(c.getShipment));
router.post('/shipments', upload.array('documents', 20), asyncHandler(c.createShipment));
router.put('/shipments/:id', upload.array('documents', 20), asyncHandler(c.updateShipment));
router.delete('/shipments/:id/documents/:docId', asyncHandler(c.deleteDocument));
router.delete('/shipments/:id', asyncHandler(c.deleteShipment));

export default router;
