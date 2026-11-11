// src/modules/operation/laytime.ts
// [FUNGSI] Hitung laytime POL/POD dan demurrage/despatch dari timestamp voyage.
// [ALASAN] Rumus mengikuti sheet: POL = TA->CL, POD = TA->CD,
//          demurrage/despatch = laytime allowed - total laytime.

export interface LaytimeInput {
  taPol?: Date | null;
  clPol?: Date | null;
  taPod?: Date | null;
  cdPod?: Date | null;
  laytimeAllowed?: number | null;
}

export interface LaytimeResult {
  laytimePol: number | null;
  laytimePod: number | null;
  totalLaytime: number | null;
  demurrageDespatch: number | null;
}

// [FUNGSI] Selisih dua waktu dalam hari (boleh pecahan). | [ALASAN] Laytime dihitung dalam hari.
function selisihHari(dari?: Date | null, sampai?: Date | null): number | null {
  if (!dari || !sampai) return null;
  return (sampai.getTime() - dari.getTime()) / 86_400_000;
}

// [FUNGSI] Hitung seluruh angka laytime sekaligus. | [ALASAN] Nilai kosong bila timestamp belum lengkap.
export function hitungLaytime(input: LaytimeInput): LaytimeResult {
  const laytimePol = selisihHari(input.taPol, input.clPol);
  const laytimePod = selisihHari(input.taPod, input.cdPod);
  const totalLaytime =
    laytimePol != null && laytimePod != null ? laytimePol + laytimePod : null;
  const demurrageDespatch =
    totalLaytime != null && input.laytimeAllowed != null
      ? input.laytimeAllowed - totalLaytime
      : null;
  return { laytimePol, laytimePod, totalLaytime, demurrageDespatch };
}
