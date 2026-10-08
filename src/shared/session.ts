// src/shared/session.ts
// [FUNGSI] Konfigurasi sesi login (express-session).
// [ALASAN] Sesi aman dengan cookie httpOnly & auto-logout 30 menit tidak aktif.

import session from 'express-session';

const isProduction = process.env.NODE_ENV === 'production';

// [FUNGSI] Wajibkan SESSION_SECRET di produksi.
// [ALASAN] Secret default bisa dipalsukan; di produksi harus selalu diganti.
const secret = process.env.SESSION_SECRET;
if (!secret) {
  if (isProduction) throw new Error('SESSION_SECRET wajib diisi di produksi');
}

// [FUNGSI] Cookie "secure" dikendalikan eksplisit via COOKIE_SECURE.
// [ALASAN] Aplikasi dijalankan di belakang proxy HTTPS (mis. Railway); menyalakan
//          secure otomatis dari NODE_ENV membuat login gagal saat masih HTTP.
const secureCookie = process.env.COOKIE_SECURE === 'true';

export const sessionMiddleware = session({
  secret: secret ?? 'dev-secret',
  resave: false,
  saveUninitialized: false,
  rolling: true, // [ALASAN] Perpanjang sesi setiap ada aktivitas (idle 30 menit).
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: secureCookie, // [ALASAN] Aktif hanya saat benar-benar di belakang HTTPS.
    maxAge: 30 * 60 * 1000, // 30 menit
  },
});
