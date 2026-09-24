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
