// tests/laytime.test.ts
// [FUNGSI] Uji hitung laytime & demurrage/despatch.
// [ALASAN] Angka ini dipakai untuk klaim demurrage; salah hitung merugikan.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hitungLaytime } from '../src/modules/operation/laytime';

// [FUNGSI] Bandingkan angka pecahan dengan toleransi kecil.
function hampir(a: number | null, b: number) {
  assert.ok(a != null && Math.abs(a - b) < 1e-9, `expected ${b}, got ${a}`);
}

test('laytime POL = TA sampai CL, POD = TA sampai CD', () => {
  const hasil = hitungLaytime({
    taPol: new Date('2025-05-20T13:30:00'),
    clPol: new Date('2025-05-21T21:00:00'),
    taPod: new Date('2025-06-02T10:00:00'),
    cdPod: new Date('2025-06-03T08:45:00'),
    laytimeAllowed: 6,
  });
  hampir(hasil.laytimePol, 1.3125);
  hampir(hasil.laytimePod, 0.9479166666666666);
  hampir(hasil.totalLaytime, 2.2604166666666665);
  hampir(hasil.demurrageDespatch, 3.7395833333333335);
});

test('timestamp belum lengkap menghasilkan null', () => {
  const hasil = hitungLaytime({ taPol: new Date('2025-05-20T13:30:00') });
  assert.equal(hasil.laytimePol, null);
  assert.equal(hasil.laytimePod, null);
  assert.equal(hasil.totalLaytime, null);
  assert.equal(hasil.demurrageDespatch, null);
});
