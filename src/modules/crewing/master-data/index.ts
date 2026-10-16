// src/modules/master-data/index.ts
// [FUNGSI] Public API modul Master Data (yang boleh dipakai modul lain).
// [ALASAN] Aturan Modular Monolith: modul lain HANYA boleh import dari sini.

export { default as masterDataRoutes } from './master-data.routes';
