// src/modules/auth/index.ts
// [FUNGSI] Public API modul Auth.
// [ALASAN] Aturan Modular Monolith: modul lain hanya import dari sini.

export { default as authRoutes } from './auth.routes';
