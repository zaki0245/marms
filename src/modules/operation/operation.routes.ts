// src/modules/operation/operation.routes.ts
// [FUNGSI] Endpoint HTTP modul Operation.
// [ALASAN] Route dipisah agar modul mandiri & mudah dibaca.

import { Router } from 'express';
import { asyncHandler } from '../../shared/asyncHandler';
import { upload } from '../../shared/upload';
import * as c from './operation.controller';

const router = Router();

router.get('/dashboard', asyncHandler(c.dashboard));
router.get('/refs', asyncHandler(c.refs));

// [FUNGSI] Master agen pelabuhan (dipakai Agent POL/POD pada form shipment).
router.get('/agents', asyncHandler(c.listAgents));
router.post('/agents', asyncHandler(c.createAgent));
router.put('/agents/:id', asyncHandler(c.updateAgent));
router.delete('/agents/:id', asyncHandler(c.deleteAgent));

// [FUNGSI] Master unit kapal Operation (TB + BG + owner + contact master).
router.get('/kapal', asyncHandler(c.listOperationKapal));
router.post('/kapal', asyncHandler(c.createOperationKapal));
router.put('/kapal/:id', asyncHandler(c.updateOperationKapal));
router.delete('/kapal/:id', asyncHandler(c.deleteOperationKapal));

router.get('/shipments', asyncHandler(c.listShipments));
router.get('/shipments/:id', asyncHandler(c.getShipment));
router.post('/shipments', upload.array('documents', 20), asyncHandler(c.createShipment));
router.put('/shipments/:id', upload.array('documents', 20), asyncHandler(c.updateShipment));
router.delete('/shipments/:id/documents/:docId', asyncHandler(c.deleteDocument));
router.delete('/shipments/:id', asyncHandler(c.deleteShipment));

export default router;
