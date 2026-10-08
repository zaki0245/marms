// src/modules/finance/index.ts
// [FUNGSI] Public API modul Finance.
// [ALASAN] Aturan Modular Monolith: modul lain hanya import dari sini.

export { default as financeRoutes } from './finance.routes';
