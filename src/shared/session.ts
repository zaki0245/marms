// src/shared/session.ts
// [FUNGSI] Konfigurasi sesi login (express-session).
// [ALASAN] Sesi aman dengan cookie httpOnly & auto-logout 30 menit tidak aktif.

import session from 'express-session';

export const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET ?? 'dev-secret',
  resave: false,
  saveUninitialized: false,
  rolling: true, // [ALASAN] Perpanjang sesi setiap ada aktivitas (idle 30 menit).
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 60 * 1000, // 30 menit
  },
});
