// src/app.ts
// [FUNGSI] Titik masuk backend: membuat server Express, memuat middleware,
//          menyediakan endpoint /health, dan mendaftarkan route tiap modul.
// [ALASAN] Satu pintu masuk memudahkan pengaturan middleware & urutan route.

import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { ZodError } from 'zod';
import { AppError } from './shared/AppError';
import { UPLOAD_DIR } from './shared/upload';
import { getCurrentAdmin } from './shared/authorization';
import { masterDataRoutes } from './modules/master-data';
import { recruitmentRoutes } from './modules/recruitment';
import { crewPlacementRoutes } from './modules/crew-placement';
import { payrollRoutes } from './modules/payroll';
import { reportsRoutes } from './modules/reports';
import { authRoutes } from './modules/auth';
import { leavePayRoutes } from './modules/leave-pay';
import { financeRoutes } from './modules/finance';
import { sessionMiddleware } from './shared/session';

const app = express();

// [FUNGSI] Percayai 1 hop proxy (Railway/nginx/Caddy) untuk IP & protokol asli.
// [ALASAN] Tanpa ini req.ip menjadi IP proxy, sehingga rate limit per-IP tidak
//          berguna dan deteksi HTTPS keliru.
app.set('trust proxy', 1);

// [FUNGSI] Header keamanan dasar (nosniff, X-Frame-Options, dsb.).
// [ALASAN] Melindungi app & file upload dari interpretasi konten berbahaya.
app.use(helmet());

// [FUNGSI] Middleware dasar: izinkan CORS & parsing body JSON.
// [ALASAN] Frontend (React) butuh akses API; JSON untuk kirim/terima data.
// [ALASAN] Origin dibatasi (bukan wildcard) + credentials untuk cookie sesi.
app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173', credentials: true }));
app.use(express.json());

// [FUNGSI] Middleware sesi login.
app.use(sessionMiddleware);

// [FUNGSI] Route autentikasi (login/logout/me/ganti password) — sebelum proteksi.
app.use('/api/auth', authRoutes);

// [FUNGSI] Lindungi semua endpoint /api kecuali whitelist publik, dan batasi per role.
// [ALASAN] Payung bisnis: modul Crewing hanya untuk CREWING/SUPERADMIN, Finance hanya
//          untuk FINANCE/SUPERADMIN. Role & status aktif dicek dari database.
app.use('/api', async (req: Request, res: Response, next: NextFunction) => {
  const isPublic =
    (req.method === 'POST' && req.path === '/recruitment/pelamar') ||
    (req.method === 'GET' && req.path === '/master-data/jabatan');
  if (isPublic) return next();

  try {
    const admin = await getCurrentAdmin(req);
    if (!admin || !admin.active) {
      res.status(401).json({ error: 'Belum login' });
      return;
    }
    // [FUNGSI] Tentukan role yang diizinkan berdasarkan prefix path.
    const isFinance = req.path.startsWith('/finance');
    const allowed = isFinance ? ['FINANCE', 'SUPERADMIN'] : ['CREWING', 'SUPERADMIN'];
    if (!allowed.includes(admin.role)) {
      res.status(403).json({ error: 'Akses ditolak' });
      return;
    }
    next();
  } catch (err) {
    next(err);
  }
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
app.use('/api/finance', financeRoutes);

// [FUNGSI] Sajikan hasil build frontend (client/dist) sebagai file statis.
// [ALASAN] Satu server (satu URL, satu proses) menyajikan UI + API sekaligus.
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

// [FUNGSI] Sajikan file dokumen pelamar (hanya untuk admin login).
// [ALASAN] Dokumen penting tidak boleh dibuka publik; akses dibatasi sesi + validasi nama file.
app.get('/uploads/:filename', (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.adminId) {
    res.status(401).json({ error: 'Belum login' });
    return;
  }
  // [FUNGSI] Pastikan nama file sesuai pola UUID + ekstensi yang diizinkan.
  // [ALASAN] Regex mencegah path traversal & akses file di luar folder uploads.
  if (!/^[0-9a-f-]{36}\.(pdf|jpe?g|png)$/i.test(req.params.filename)) {
    res.status(404).json({ error: 'Dokumen tidak ditemukan' });
    return;
  }
  res.sendFile(path.join(UPLOAD_DIR, req.params.filename), (err) => {
    if (err) next();
  });
});

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
