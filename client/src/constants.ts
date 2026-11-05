// client/src/constants.ts
// [FUNGSI] Konstanta bersama: daftar dokumen & labelnya.
// [ALASAN] Satu sumber kebenaran agar form publik & panel admin konsisten.

export const DOKUMEN = [
  { kode: 'foto', label: 'Foto 4x6', expired: false },
  { kode: 'cv', label: 'CV', expired: false },
  { kode: 'ktp', label: 'KTP', expired: false },
  { kode: 'npwp', label: 'NPWP', expired: false },
  { kode: 'paspor', label: 'Paspor', expired: true },
  { kode: 'buku_pelaut', label: 'Buku Pelaut', expired: true },
  { kode: 'skck', label: 'SKCK', expired: true },
  { kode: 'mcu', label: 'MCU', expired: true },
  { kode: 'bpjs_kesehatan', label: 'BPJS Kesehatan', expired: false },
  { kode: 'bpjs_ketenagakerjaan', label: 'BPJS Ketenagakerjaan', expired: false },
  { kode: 'coc_ant_att', label: 'CoC/ANT/ATT', expired: true },
  { kode: 'bst', label: 'BST', expired: true },
  { kode: 'scrb', label: 'SCRB', expired: true },
  { kode: 'aff', label: 'AFF', expired: true },
  { kode: 'mfa', label: 'MFA', expired: true },
  { kode: 'mc', label: 'MC', expired: true },
  { kode: 'radar', label: 'RADAR', expired: true },
  { kode: 'arpa', label: 'ARPA', expired: true },
  { kode: 'goc_gmdss', label: 'GOC/GMDSS', expired: true },
  { kode: 'mooring_master', label: 'MOORING MASTER', expired: true },
  { kode: 'mutasi_off', label: 'MUTASI OFF', expired: false },
];

// [FUNGSI] Peta kode dokumen -> label (untuk menampilkan nama dokumen).
export const DOKUMEN_LABEL: Record<string, string> = Object.fromEntries(
  DOKUMEN.map((d) => [d.kode, d.label]),
);

// [FUNGSI] Urutan jabatan kapal sesuai hierarki organisasi.
// [ALASAN] Bukan alfabetis; dipakai untuk mengurutkan baris crew di semua page.
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

// [FUNGSI] Peringkat jabatan; di luar daftar diletakkan paling akhir.
export function jabatanRank(kode?: string | null): number {
  if (!kode) return Number.MAX_SAFE_INTEGER;
  return JABATAN_RANK.get(kode) ?? Number.MAX_SAFE_INTEGER;
}

// [FUNGSI] Bandingkan dua item: jabatan dulu, lalu nama (case-insensitive).
export function compareJabatan(
  a: { jabatanKode?: string | null; nama?: string | null },
  b: { jabatanKode?: string | null; nama?: string | null },
): number {
  const ra = jabatanRank(a.jabatanKode);
  const rb = jabatanRank(b.jabatanKode);
  if (ra !== rb) return ra - rb;
  return (a.nama ?? '').localeCompare(b.nama ?? '', 'id', { sensitivity: 'base' });
}

// [FUNGSI] Urutkan array memakai comparator jabatan+nama (tidak mengubah input).
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
