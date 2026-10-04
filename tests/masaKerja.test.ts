// tests/masaKerja.test.ts
// [FUNGSI] Uji perhitungan masa kerja live.
// [ALASAN] Masa kerja menentukan kelayakan leave pay (jalur uang).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { liveMasaKerja } from '../src/shared/masaKerja';

test('crew tanpa penempatan mengembalikan totalMasaKerja saja', () => {
  assert.equal(liveMasaKerja({ totalMasaKerja: 180 }), 180);
});

test('segmen tertutup tidak menambah masa kerja live', () => {
  const source = {
    totalMasaKerja: 90,
    placements: [
      {
        segments: [{ onBoardTanggal: new Date('2026-01-01'), offBoardTanggal: new Date('2026-01-10') }],
      },
    ],
  };
  assert.equal(liveMasaKerja(source), 90);
});

test('segmen terbuka (masih On Board) menambah hari live', () => {
  const source = {
    totalMasaKerja: 100,
    placements: [{ segments: [{ onBoardTanggal: new Date(), offBoardTanggal: null }] }],
  };
  assert.equal(liveMasaKerja(source), 101);
});
