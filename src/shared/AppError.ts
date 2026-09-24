// src/shared/AppError.ts
// [FUNGSI] Error khusus dengan status HTTP tertentu.
// [ALASAN] Supaya service bisa melempar error bisnis (duplikat, dll.) dengan
//          kode status & pesan yang jelas, ditangani error handler global.

export class AppError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
