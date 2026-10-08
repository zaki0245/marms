// src/shared/authorization.ts
// [FUNGSI] Middleware cek login + role + status aktif.
// [ALASAN] Proteksi akses terpusat: role & status aktif diambil dari database tiap
//          request agar perubahan role/nonaktif langsung berlaku tanpa login ulang.

import type { NextFunction, Request, Response } from 'express';
import { prisma } from './prisma';
import type { Role } from '@prisma/client';

// [FUNGSI] Ambil admin aktif dari sesi (cek login & status).
// [ALASAN] Dipakai guard di app.ts & endpoint khusus SUPERADMIN.
export async function getCurrentAdmin(req: Request) {
  const id = req.session?.adminId;
  if (!id) return null;
  return prisma.admin.findUnique({ where: { id }, select: { id: true, role: true, active: true } });
}

// [FUNGSI] Middleware pembatas role.
// [ALASAN] Menolak 401 bila belum login/nonaktif, 403 bila role tidak diizinkan.
export function requireRole(...roles: Role[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const admin = await getCurrentAdmin(req);
    if (!admin || !admin.active) {
      res.status(401).json({ error: 'Belum login' });
      return;
    }
    if (!roles.includes(admin.role)) {
      res.status(403).json({ error: 'Akses ditolak' });
      return;
    }
    next();
  };
}
