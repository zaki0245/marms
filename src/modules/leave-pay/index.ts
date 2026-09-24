// src/modules/leave-pay/index.ts
// [FUNGSI] Public API modul Leave Pay.
// [ALASAN] Aturan Modular Monolith: modul lain hanya import dari sini.

export { default as leavePayRoutes } from './leave-pay.routes';
