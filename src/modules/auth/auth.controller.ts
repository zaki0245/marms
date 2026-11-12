// src/modules/auth/auth.controller.ts
// [FUNGSI] Controller Auth: login, logout, cek user, ganti password, kelola akun.
// [ALASAN] Memisahkan urusan HTTP dari logika bisnis.

import type { Request, Response } from 'express';
import { catatAudit } from '../../shared/audit';
import { getCurrentAdmin } from '../../shared/authorization';
import * as service from './auth.service';
import { changePasswordSchema, createAccountSchema, loginSchema, updateAccountSchema } from './auth.model';

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const { sessionVersion, ...admin } = await service.login(input.email, input.password, req.ip ?? 'unknown');

  // [FUNGSI] Buat ID sesi baru setelah login berhasil.
  // [ALASAN] Mencegah session fixation: ID lama yang mungkin diketahui penyerang tidak berlaku.
  await new Promise<void>((resolve, reject) => {
    req.session.regenerate((err) => (err ? reject(err) : resolve()));
  });

  req.session.adminId = admin.id;
  req.session.sessionVersion = sessionVersion;
  res.json(admin);
}

export async function logout(req: Request, res: Response) {
  req.session.destroy(() => undefined);
  res.json({ ok: true });
}

export async function me(req: Request, res: Response) {
  const admin = await getCurrentAdmin(req);
  if (!admin) {
    res.status(401).json({ error: 'Belum login' });
    return;
  }
  res.json(await service.getAdmin(admin.id));
}

export async function changePassword(req: Request, res: Response) {
  const admin = await getCurrentAdmin(req);
  if (!admin) {
    res.status(401).json({ error: 'Belum login' });
    return;
  }
  const input = changePasswordSchema.parse(req.body);
  const sessionVersion = await service.changePassword(admin.id, input.passwordLama, input.passwordBaru);
  req.session.sessionVersion = sessionVersion;
  void catatAudit(admin.id, 'GANTI_PASSWORD', 'Mengganti password sendiri').catch(() => undefined);
  res.json({ ok: true });
}

export async function listAccounts(_req: Request, res: Response) {
  res.json(await service.listAccounts());
}

export async function createAccount(req: Request, res: Response) {
  const input = createAccountSchema.parse(req.body);
  const account = await service.createAccount(input);
  void catatAudit(req.session.adminId, 'BUAT_AKUN', account.email).catch(() => undefined);
  res.status(201).json(account);
}

export async function updateAccount(req: Request, res: Response) {
  const input = updateAccountSchema.parse(req.body);
  const account = await service.updateAccount(req.params.id, input);
  const aksi = input.password ? 'RESET_PASSWORD' : 'UBAH_AKUN';
  void catatAudit(req.session.adminId, aksi, account.email).catch(() => undefined);
  res.json(account);
}

export async function deleteAccount(req: Request, res: Response) {
  if (!req.session.adminId) {
    res.status(401).json({ error: 'Belum login' });
    return;
  }
  const deleted = await service.deleteAccount(req.params.id, req.session.adminId);
  void catatAudit(req.session.adminId, 'HAPUS_AKUN', deleted.email).catch(() => undefined);
  res.status(204).end();
}

export async function listAuditLog(_req: Request, res: Response) {
  res.json(await service.listAuditLog());
}
