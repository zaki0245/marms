// src/app.ts
// [FUNGSI] Titik masuk backend: membuat server Express, memuat middleware,
//          menyediakan endpoint /health, dan mendaftarkan route tiap modul.
// [ALASAN] Satu pintu masuk memudahkan pengaturan middleware & urutan route.

import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { ZodError } from 'zod';
import { AppError } from './shared/AppError';
import { UPLOAD_DIR } from './shared/upload';
import { masterDataRoutes } from './modules/master-data';
import { recruitmentRoutes } from './modules/recruitment';
import { crewPlacementRoutes } from './modules/crew-placement';
import { payrollRoutes } from './modules/payroll';
import { reportsRoutes } from './modules/reports';
import { authRoutes } from './modules/auth';
import { leavePayRoutes } from './modules/leave-pay';
import { sessionMiddleware } from './shared/session';

const app = express();

// [FUNGSI] Middleware dasar: izinkan CORS & parsing body JSON.
// [ALASAN] Frontend (React) butuh akses API; JSON untuk kirim/terima data.
app.use(cors());
app.use(express.json());

// [FUNGSI] Middleware sesi login.
app.use(sessionMiddleware);

// [FUNGSI] Route autentikasi (login/logout/me/ganti password) — sebelum proteksi.
app.use('/api/auth', authRoutes);

// [FUNGSI] Lindungi semua endpoint /api kecuali whitelist publik.
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  const isPublic =
    (req.method === 'POST' && req.path === '/recruitment/pelamar') ||
    (req.method === 'GET' && req.path === '/master-data/jabatan');
  if (isPublic || req.session?.adminId) return next();
  res.status(401).json({ error: 'Belum login' });
});

// [FUNGSI] Endpoint /health untuk dicek Docker (HEALTHCHECK).
// [ALASAN] Docker menandai container sehat bila endpoint ini menjawab 200.
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// [FUNGSI] Daftarkan route tiap modul di bawah prefix /api.
// [ALASAN] Semua endpoint API terpusat di sini agar mudah dilacak.
app.use('/api/master-data', masterDataRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/crew', crewPlacementRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/leave-pay', leavePayRoutes);

// [FUNGSI] Sajikan hasil build frontend (client/dist) sebagai file statis.
// [ALASAN] Satu server (satu URL, satu proses) menyajikan UI + API sekaligus.
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

// [FUNGSI] Sajikan file dokumen pelamar dari folder uploads.
// [ALASAN] Link dokumen (path /uploads/...) bisa dibuka di browser.
app.use('/uploads', express.static(UPLOAD_DIR));

// [FUNGSI] SPA fallback: semua route non-/api dikembalikan ke index.html.
// [ALASAN] React Router menangani navigasi halaman di sisi browser.
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'));
});

// [FUNGSI] Handler 404: kembalikan JSON bila route API tidak ditemukan.
app.use((_req, res) => {
  res.status(404).json({ error: 'Route tidak ditemukan' });
});

// [FUNGSI] Error handler global: ubah error jadi respons JSON yang jelas.
// [ALASAN] Semua error dari route berkumpul di sini agar pesan konsisten.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Data tidak valid', details: err.issues.map((i) => i.message) });
    return;
  }
  const e = err as { name?: string; code?: string };
  if (e?.name === 'MulterError') {
    res.status(400).json({
      error: e?.code === 'LIMIT_FILE_SIZE' ? 'File terlalu besar (maks 5 MB)' : 'Kesalahan upload file',
    });
    return;
  }
  if (e?.code === 'P2002') {
    res.status(409).json({ error: 'Data sudah ada (duplikat)' });
    return;
  }
  if (e?.code === 'P2025') {
    res.status(404).json({ error: 'Data tidak ditemukan' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Terjadi kesalahan pada server' });
});

const port = Number(process.env.PORT ?? 3000);

// [FUNGSI] Jalankan server di port yang ditentukan.
app.listen(port, () => {
  console.log(`MARMS API berjalan di http://localhost:${port}`);
});
