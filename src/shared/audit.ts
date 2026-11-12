// src/shared/audit.ts
// [FUNGSI] Catat aksi sensitif ke tabel AuditLog beserta email pelaku.
// [ALASAN] Jejak tetap ada walau akun pelaku kemudian dihapus.

import { prisma } from './prisma';

export async function catatAudit(adminId: string | undefined, aksi: string, detail?: string) {
  if (!adminId) return;
  const admin = await prisma.admin.findUnique({ where: { id: adminId }, select: { email: true } });
  await prisma.auditLog.create({
    data: { adminId, adminEmail: admin?.email ?? null, aksi, detail: detail ?? null },
  });
}
