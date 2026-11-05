// src/modules/kapal/index.ts
// [FUNGSI] Public API modul Kapal (yang boleh dipakai modul lain).
// [ALASAN] Aturan Modular Monolith: modul lain HANYA boleh import dari sini.

export { default as kapalRoutes } from './kapal.routes';
