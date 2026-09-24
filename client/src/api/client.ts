// client/src/api/client.ts
// [FUNGSI] Instance axios terpusat untuk memanggil API backend.
// [ALASAN] Semua request memakai base URL /api agar konsisten & mudah diganti.

import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
});

// [FUNGSI] Helper untuk format angka menjadi Rupiah.
// [ALASAN] Dipakai di banyak tabel gaji/uang.
export function formatRupiah(n: number): string {
  return 'Rp ' + n.toLocaleString('id-ID');
}
