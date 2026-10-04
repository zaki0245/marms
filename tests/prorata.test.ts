// tests/prorata.test.ts
// [FUNGSI] Uji hitung prorata & pembulatan round half up.
// [ALASAN] Jalur uang wajib punya pemeriksaan agar tidak salah hitung.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prorata, roundRupiah } from '../src/shared/prorata';

test('prorata menghitung nilai proporsional', () => {
  assert.equal(prorata(10500000, 30, 15), 5250000);
});

test('prorata membulatkan ke Rupiah terdekat (round half up)', () => {
  assert.equal(prorata(1000, 31, 10), 323);
  assert.equal(prorata(1000, 30, 10), 333);
});

test('roundRupiah membulatkan half up', () => {
  assert.equal(roundRupiah(2.5), 3);
  assert.equal(roundRupiah(2.4), 2);
});
