// src/modules/operation/index.ts
// [FUNGSI] Public API modul Operation (yang boleh dipakai modul lain).
// [ALASAN] Aturan Modular Monolith: modul lain HANYA boleh import dari sini.

export { default as operationRoutes } from './operation.routes';
export { default as petaRoutes } from './peta.routes';
