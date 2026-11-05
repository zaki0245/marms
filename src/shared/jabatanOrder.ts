// src/shared/jabatanOrder.ts
// [FUNGSI] Sumber kebenaran urutan jabatan kapal untuk pengurutan tampilan crew.
// [ALASAN] Urutan jabatan bukan alfabetis; harus mengikuti hierarki organisasi kapal.
//          Jika beberapa crew punya jabatan sama, urutkan berdasarkan nama (A-Z).

export const JABATAN_ORDER = [
  'MSTR',    // Master
  'MUAL1',   // Mualim 1
  'MUAL2',   // Mualim 2
  'KKM',     // KKM
  'MAS2',    // Masinis 2
  'MAS3',    // Masinis 3
  'JMUDI',   // Juru Mudi
  'JMINYAK', // Juru Minyak
] as const;

const JABATAN_RANK = new Map<string, number>(
  JABATAN_ORDER.map((kode, i) => [kode, i]),
);

// [FUNGSI] Peringkat jabatan; jabatan di luar daftar diletakkan paling akhir.
export function jabatanRank(kode?: string | null): number {
  if (!kode) return Number.MAX_SAFE_INTEGER;
  return JABATAN_RANK.get(kode) ?? Number.MAX_SAFE_INTEGER;
}

// [FUNGSI] Bandingkan dua crew: jabatan dulu, lalu nama (case-insensitive).
export function compareJabatan(
  a: { jabatanKode?: string | null; nama?: string | null },
  b: { jabatanKode?: string | null; nama?: string | null },
): number {
  const ra = jabatanRank(a.jabatanKode);
  const rb = jabatanRank(b.jabatanKode);
  if (ra !== rb) return ra - rb;
  return (a.nama ?? '').localeCompare(b.nama ?? '', 'id', { sensitivity: 'base' });
}

// [FUNGSI] Urutkan array crew memakai comparator jabatan+nama (tidak mengubah input).
export function sortByJabatan<T>(
  list: T[],
  getKode: (item: T) => string | null | undefined,
  getNama: (item: T) => string | null | undefined,
): T[] {
  return [...list].sort((a, b) =>
    compareJabatan(
      { jabatanKode: getKode(a), nama: getNama(a) },
      { jabatanKode: getKode(b), nama: getNama(b) },
    ),
  );
}
