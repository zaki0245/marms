// src/modules/auth/auth.controller.ts
// [FUNGSI] Controller Auth: login, logout, cek user, ganti password.
// [ALASAN] Memisahkan urusan HTTP dari logika bisnis.

import type { Request, Response } from 'express';
import * as service from './auth.service';
import { changePasswordSchema, loginSchema } from './auth.model';

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const admin = await service.login(input.email, input.password);
  req.session.adminId = admin.id;
  res.json(admin);
}

export async function logout(req: Request, res: Response) {
  req.session.destroy(() => undefined);
  res.json({ ok: true });
}

export async function me(req: Request, res: Response) {
  if (!req.session.adminId) {
    res.status(401).json({ error: 'Belum login' });
    return;
  }
  res.json(await service.getAdmin(req.session.adminId));
}

export async function changePassword(req: Request, res: Response) {
  if (!req.session.adminId) {
    res.status(401).json({ error: 'Belum login' });
    return;
  }
  const input = changePasswordSchema.parse(req.body);
  await service.changePassword(req.session.adminId, input.passwordLama, input.passwordBaru);
  res.json({ ok: true });
}
