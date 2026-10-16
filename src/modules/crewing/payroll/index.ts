// src/modules/payroll/index.ts
// [FUNGSI] Public API modul Payroll.
// [ALASAN] Aturan Modular Monolith: modul lain hanya import dari sini.

export { default as payrollRoutes } from './payroll.routes';
