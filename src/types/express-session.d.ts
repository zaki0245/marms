// src/types/express-session.d.ts
// [FUNGSI] Menambah tipe adminId pada session Express.
// [ALASAN] Supaya req.session.adminId dikenali TypeScript.

import 'express-session';

declare module 'express-session' {
  interface SessionData {
    adminId?: string;
  }
}
