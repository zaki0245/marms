// src/shared/prorata.ts
// [FUNGSI] Hitung prorata gaji/uang makan & pembulatan round half up.
// [ALASAN] Logika uang dipusatkan agar konsisten & mudah diuji (test).

export function roundRupiah(n: number): number {
  return Math.round(n);
}

export function prorata(nilai: number, jumlahHari: number, hariAktif: number): number {
  return roundRupiah((nilai / jumlahHari) * hariAktif);
}
