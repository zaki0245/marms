// src/shared/upload.ts
// [FUNGSI] Konfigurasi multer untuk upload dokumen pelamar.
// [ALASAN] Semua aturan upload (folder, nama file acak, batas 5MB, format) terpusat di sini.

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import type { Request } from 'express';
import { AppError } from './AppError';

// [FUNGSI] Tentukan lokasi folder uploads (di root project).
// [ALASAN] File dokumen disimpan di sini (Docker volume).
export const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

// [FUNGSI] Pastikan folder uploads ada (dibuat jika belum).
// [ALASAN] Tanpa folder, multer gagal menulis file.
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  // [FUNGSI] Beri nama file acak (UUID) + ekstensi asli.
  // [ALASAN] Nama asli disembunyikan agar tidak mudah ditebak (keamanan).
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

// [FUNGSI] Filter format file: hanya PDF/JPG/PNG.
// [ALASAN] Mencegah upload file berbahaya (mis. .exe).
function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new AppError(400, 'Format file harus PDF/JPG/PNG'));
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // [ALASAN] Maksimal 5 MB per file.
});

// [FUNGSI] Verifikasi magic bytes (isi file), bukan cuma ekstensi.
// [ALASAN] File .exe yang di-rename jadi .pdf lolos filter ekstensi; cek isi menolaknya.
export function verifyFileSignature(filePath: string): boolean {
  const fd = fs.openSync(filePath, 'r');
  try {
    const buf = Buffer.alloc(8);
    const read = fs.readSync(fd, buf, 0, 8, 0);
    const head = buf.subarray(0, read);
    if (head.length >= 4 && head.subarray(0, 4).toString('latin1') === '%PDF') return true;
    if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return true;
    if (head.length >= 8 && head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return true;
    return false;
  } finally {
    fs.closeSync(fd);
  }
}
