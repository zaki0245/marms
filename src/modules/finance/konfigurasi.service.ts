// src/modules/finance/konfigurasi.service.ts
// [FUNGSI] Baca/tulis konfigurasi Finance (nama & alamat perusahaan, penandatangan).
// [ALASAN] Nilai disimpan di tabel Pengaturan (key/value) agar tidak hardcode.

import { prisma } from '../../shared/prisma';
import type { KonfigurasiInput } from './finance.model';

// [FUNGSI] Kunci Pengaturan untuk konfigurasi Finance.
const KEYS = {
  nama: 'FIN_NAMA_PERUSAHAAN',
  alamat1: 'FIN_ALAMAT_1',
  alamat2: 'FIN_ALAMAT_2',
  alamat3: 'FIN_ALAMAT_3',
  alamat4: 'FIN_ALAMAT_4',
  ttdPrepared: 'FIN_TTD_PREPARED',
  ttdVerified: 'FIN_TTD_VERIFIED',
  ttdApproved: 'FIN_TTD_APPROVED',
  approvalEmail: 'FIN_APPROVAL_EMAIL',
  approvalCc: 'FIN_APPROVAL_CC',
} as const;

export async function getKonfigurasi() {
  const rows = await prisma.pengaturan.findMany({
    where: { key: { in: Object.values(KEYS) } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    perusahaanNama: map[KEYS.nama] ?? 'PT. MARITIM ARMADA RAYA',
    alamat1: map[KEYS.alamat1] ?? 'Graha MIR Lt. 3',
    alamat2: map[KEYS.alamat2] ?? 'Jl. Pemuda No.9 RT 001 RW 003',
    alamat3: map[KEYS.alamat3] ?? 'Rawamangun - Pulo Gadung',
    alamat4: map[KEYS.alamat4] ?? 'Jakarta Timur, 13220',
    ttdPrepared: map[KEYS.ttdPrepared] ?? '',
    ttdVerified: map[KEYS.ttdVerified] ?? '',
    ttdApproved: map[KEYS.ttdApproved] ?? '',
    approvalEmail: map[KEYS.approvalEmail] ?? '',
    approvalCc: map[KEYS.approvalCc] ?? '',
  };
}

export async function updateKonfigurasi(input: KonfigurasiInput) {
  const data: Record<string, string> = {
    [KEYS.nama]: input.perusahaanNama,
    [KEYS.alamat1]: input.alamat1 ?? '',
    [KEYS.alamat2]: input.alamat2 ?? '',
    [KEYS.alamat3]: input.alamat3 ?? '',
    [KEYS.alamat4]: input.alamat4 ?? '',
    [KEYS.ttdPrepared]: input.ttdPrepared ?? '',
    [KEYS.ttdVerified]: input.ttdVerified ?? '',
    [KEYS.ttdApproved]: input.ttdApproved ?? '',
    [KEYS.approvalEmail]: input.approvalEmail ?? '',
    [KEYS.approvalCc]: input.approvalCc ?? '',
  };
  for (const [key, value] of Object.entries(data)) {
    await prisma.pengaturan.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  return getKonfigurasi();
}
