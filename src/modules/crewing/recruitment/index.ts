// src/modules/recruitment/index.ts
// [FUNGSI] Public API modul Rekrutmen.
// [ALASAN] Aturan Modular Monolith: modul lain hanya import dari sini.

export { default as recruitmentRoutes } from './recruitment.routes';
export { getApplicant, getApplicantWithDocuments } from './recruitment.service';
