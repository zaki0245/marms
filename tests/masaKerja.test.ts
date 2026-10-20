// tests/masaKerja.test.ts
// [FUNGSI] Uji perhitungan masa kerja live.
// [ALASAN] Masa kerja menentukan kelayakan leave pay (jalur uang).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { liveMasaKerja, berhakLeavePay } from '../src/shared/masaKerja';

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

test('berhakLeavePay: 180 hari pertama tidak dihitung', () => {
  assert.equal(berhakLeavePay(180), 0);
});

test('berhakLeavePay: kelayakan mulai 360 hari, bertambah tiap 180 hari', () => {
  assert.equal(berhakLeavePay(360), 1);
  assert.equal(berhakLeavePay(540), 2);
  assert.equal(berhakLeavePay(100), 0);
});
