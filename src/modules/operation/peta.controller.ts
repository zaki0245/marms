// src/modules/operation/peta.controller.ts
// [FUNGSI] Sajikan gambar peta posisi kapal untuk tautan pendek di WhatsApp.
// [ALASAN] API key Geoapify tetap di server; link yang dibagikan ke customer tidak memuat key.

import type { Request, Response } from 'express';
import { AppError } from '../../shared/AppError';
import * as service from './operation.service';

// [FUNGSI] Ukuran gambar peta statis yang ditautkan di laporan.
const LEBAR = 600;
const TINGGI = 300;

// [FUNGSI] Batasi permintaan peta per IP per menit.
// [ALASAN] Endpoint publik; cegah kuota Geoapify tersedot oleh pemakaian berulang.
const BATAS_PER_MENIT = 120;
const hitungan = new Map<string, { count: number; mulai: number }>();

function batasi(ip: string) {
  const now = Date.now();
  const h = hitungan.get(ip);
  if (!h || now - h.mulai > 60_000) {
    hitungan.set(ip, { count: 1, mulai: now });
    return;
  }
  h.count += 1;
  if (h.count > BATAS_PER_MENIT) {
    throw new AppError(429, 'Terlalu banyak permintaan peta');
  }
}

export async function gambarPeta(req: Request, res: Response) {
  batasi(req.ip ?? 'unknown');

  const key = process.env.GEOAPIFY_API_KEY || process.env.VITE_GEOAPIFY_API_KEY || '';
  if (!key) {
    res.status(503).json({ error: 'Peta belum dikonfigurasi' });
    return;
  }

  const posisi = await service.getPosisiByKode(req.params.kode);
  if (!posisi || posisi.latitude == null || posisi.longitude == null) {
    res.status(404).json({ error: 'Posisi kapal tidak ditemukan' });
    return;
  }

  const zoom = Math.min(20, Math.max(1, Math.round(Number(req.query.zoom) || 5)));
  const titik = `lonlat:${posisi.longitude},${posisi.latitude}`;
  const url =
    `https://maps.geoapify.com/v1/staticmap?style=osm-carto&width=${LEBAR}&height=${TINGGI}` +
    `&center=${titik}&zoom=${zoom}&marker=${titik};color:%23e11d48;size:large&apiKey=${key}`;

  const upstream = await fetch(url);
  if (!upstream.ok) {
    throw new AppError(502, 'Gagal mengambil gambar peta');
  }

  res.set('Content-Type', upstream.headers.get('content-type') ?? 'image/jpeg');
  res.set('Cache-Control', 'public, max-age=300');
  res.send(Buffer.from(await upstream.arrayBuffer()));
}
