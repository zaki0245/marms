// client/src/pages/Finance/utils.ts
// [FUNGSI] Helper format angka uang (desimal 2 digit) untuk modul Finance.
// [ALASAN] Nilai Decimal dari API datang sebagai string; dibaca konsisten di banyak halaman.

export function num(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

export function formatUang(v: unknown): string {
  return 'Rp ' + num(v).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
