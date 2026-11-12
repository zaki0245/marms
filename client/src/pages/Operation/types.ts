// client/src/pages/Operation/types.ts
// [FUNGSI] Tipe & format bersama halaman Operation (daftar, peta, laporan).
// [ALASAN] Laporan ke customer memakai format tanggal English + zona WIB yang sama.

export type ShipmentStatus = 'PLANNED' | 'ON_GOING' | 'COMPLETED';

export interface ShipmentDocument {
  id: string;
  shipmentId: string;
  nama: string;
  file: string;
  createdAt: string;
}

export type AgentTipe = 'POL' | 'POD';

export interface OperationAgent {
  id: string;
  tipe: AgentTipe;
  nama: string;
  pic: string | null;
  kontak: string | null;
}

export interface OperationKapal {
  id: string;
  tb: string;
  bg: string;
  ownerOperator: string | null;
  contactMaster: string | null;
}

export interface Shipment {
  id: string;
  kode: string;
  tb: string;
  bg: string;
  ownerOperator: string | null;
  shipper: string | null;
  commodities: string | null;
  contactMaster: string | null;
  laycan: string | null;
  pol: string;
  agentPol: string | null;
  agentPolId: string | null;
  picPol: string | null;
  contactAgentPol: string | null;
  pod: string | null;
  agentPod: string | null;
  agentPodId: string | null;
  picPod: string | null;
  contactAgentPod: string | null;
  operationKapalId: string | null;
  taPol: string | null;
  tbPol: string | null;
  slPol: string | null;
  clPol: string | null;
  coPol: string | null;
  tdPol: string | null;
  dsPol: number | null;
  taPod: string | null;
  tbPod: string | null;
  sdPod: string | null;
  cdPod: string | null;
  coPod: string | null;
  tdPod: string | null;
  dsPod: number | null;
  laytimePol: number | null;
  laytimePod: number | null;
  totalLaytime: number | null;
  laytimeAllowed: number | null;
  demurrageDespatch: number | null;
  dsrPol: number | null;
  dsrPod: number | null;
  position: string | null;
  remarks: string | null;
  status: ShipmentStatus;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
  documents: ShipmentDocument[];
}

export const STATUS_LABEL: Record<ShipmentStatus, string> = {
  PLANNED: 'Rencana',
  ON_GOING: 'Berlayar',
  COMPLETED: 'Selesai',
};

export const STATUS_BADGE: Record<ShipmentStatus, string> = {
  PLANNED: 'bg-gray-200 text-gray-600',
  ON_GOING: 'bg-navy/10 text-navy',
  COMPLETED: 'bg-positive/10 text-positive',
};

const TANGGAL: Intl.DateTimeFormatOptions = {
  timeZone: 'Asia/Jakarta',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
};

const JAM: Intl.DateTimeFormatOptions = {
  timeZone: 'Asia/Jakarta',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
};

// [FUNGSI] Tanggal laporan English, mis. "November 11, 2026". | [ALASAN] Mengikuti format sheet.
export function fmtTanggal(iso: string | null): string {
  if (!iso) return 'TBA';
  return new Intl.DateTimeFormat('en-US', TANGGAL).format(new Date(iso));
}

// [FUNGSI] Tanggal + jam laporan, mis. "October 28, 2026 / 07:20".
export function fmtTanggalJam(iso: string | null): string {
  if (!iso) return 'TBA / TBA';
  const jam = new Intl.DateTimeFormat('en-GB', JAM).format(new Date(iso));
  return `${fmtTanggal(iso)} / ${jam}`;
}

// [FUNGSI] Tanggal hari ini (WIB) untuk laporan.
export function tanggalLaporan(): string {
  return new Intl.DateTimeFormat('en-US', TANGGAL).format(new Date());
}

export function tahunLaporan(): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', year: 'numeric' }).format(new Date());
}

// [FUNGSI] Laycan + tahun bila belum ditulis. | [ALASAN] Laporan text menambahkan tahun.
export function fmtLaycan(laycan: string | null): string {
  if (!laycan) return 'TBA';
  return /\d{4}/.test(laycan) ? laycan : `${laycan}, ${tahunLaporan()}`;
}

// [FUNGSI] Waktu update untuk kolom daftar (format Indonesia).
export function fmtUpdate(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

// [FUNGSI] Angka desimal tanpa nol berlebih, mis. 7554.31.
export function fmtDesimal(n: number | null): string {
  if (n == null) return 'TBA';
  return String(Math.round(n * 100) / 100);
}

// [FUNGSI] Link posisi kapal yang bisa dibuka dari WhatsApp/email.
export function linkPosisi(lat: number | null, lng: number | null): string | null {
  if (lat == null || lng == null) return null;
  return `https://www.google.com/maps?q=${lat},${lng}`;
}
