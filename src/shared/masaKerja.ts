// src/shared/masaKerja.ts
// [FUNGSI] Hitung masa kerja live: total segmen tertutup + hari segmen yang masih terbuka.
// [ALASAN] Crew yang masih On Board masa kerjanya bertambah; saat Off Board/Available berhenti.

const DAY = 86400000;

function startOfDayUtc(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function inclusiveDays(start: Date, end: Date): number {
  return Math.round((startOfDayUtc(end) - startOfDayUtc(start)) / DAY) + 1;
}

interface SegmenLike {
  onBoardTanggal: Date;
  offBoardTanggal: Date | null;
}

export interface MasaKerjaSource {
  totalMasaKerja: number;
  placements?: { segments?: SegmenLike[] }[];
}

export function liveMasaKerja(crew: MasaKerjaSource): number {
  let total = crew.totalMasaKerja;
  const now = new Date();
  for (const p of crew.placements ?? []) {
    for (const s of p.segments ?? []) {
      // [FUNGSI] Hanya segmen tanpa off board (masih On Board) yang bertambah live.
      if (!s.offBoardTanggal) {
        const days = inclusiveDays(s.onBoardTanggal, now);
        if (days > 0) total += days;
      }
    }
  }
  return total;
}

// [FUNGSI] Hitung jumlah leave pay yang berhak: tiap 180 hari setelah 180 hari pertama.
// [ALASAN] 180 hari pertama tidak dihitung; kelayakan dimulai pada 360 hari masa kerja.
export function berhakLeavePay(masaKerja: number): number {
  return Math.max(0, Math.floor(masaKerja / 180) - 1);
}
