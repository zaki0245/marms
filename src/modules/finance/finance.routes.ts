// src/modules/finance/finance.routes.ts
// [FUNGSI] Mendefinisikan endpoint HTTP modul Finance (vendor, invoice, PV, konfigurasi).
// [ALASAN] Semua sub-route Finance dirakit di sini.

import { Router } from 'express';
import { asyncHandler } from '../../shared/asyncHandler';
import * as vendor from './vendor.controller';
import * as customer from './customer.controller';
import * as invoice from './invoice.controller';
import * as pv from './pv.controller';
import * as laporan from './laporan.controller';
import * as konfigurasi from './konfigurasi.controller';

const router = Router();

// Vendor
router.get('/vendor', asyncHandler(vendor.list));
router.post('/vendor', asyncHandler(vendor.create));
router.get('/vendor/:id', asyncHandler(vendor.get));
router.put('/vendor/:id', asyncHandler(vendor.update));
router.delete('/vendor/:id', asyncHandler(vendor.remove));

// Customer
router.get('/customer', asyncHandler(customer.list));
router.post('/customer', asyncHandler(customer.create));
router.get('/customer/:id', asyncHandler(customer.get));
router.put('/customer/:id', asyncHandler(customer.update));
router.delete('/customer/:id', asyncHandler(customer.remove));

// Invoice
router.get('/invoice', asyncHandler(invoice.list));
router.post('/invoice', asyncHandler(invoice.create));
router.get('/invoice/:id', asyncHandler(invoice.get));
router.put('/invoice/:id', asyncHandler(invoice.update));
router.delete('/invoice/:id', asyncHandler(invoice.remove));

// Payment Voucher (PV)
router.get('/pv', asyncHandler(pv.list));
router.post('/pv', asyncHandler(pv.create));
router.get('/pv/:id', asyncHandler(pv.get));
router.put('/pv/:id', asyncHandler(pv.update));
router.delete('/pv/:id', asyncHandler(pv.remove));

// Konfigurasi
router.get('/konfigurasi', asyncHandler(konfigurasi.get));
router.put('/konfigurasi', asyncHandler(konfigurasi.update));

// Laporan
router.get('/laporan/dashboard', asyncHandler(laporan.dashboard));
router.get('/laporan/rekap', asyncHandler(laporan.rekap));

export default router;
