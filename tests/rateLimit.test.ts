// tests/rateLimit.test.ts
// [FUNGSI] Uji rate limiter membuka blokir setelah masa lock berakhir.
// [ALASAN] Bug sebelumnya membuat akun terkunci permanen setelah satu kali kena limit.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRateLimiter } from '../src/shared/rateLimit';

test('rate limiter mengizinkan percobaan lagi setelah lock berakhir', async () => {
  const limiter = makeRateLimiter({ maxAttempts: 2, lockMs: 20, message: 'terkunci' });

  limiter.check('akun');
  limiter.check('akun');
  assert.throws(() => limiter.check('akun'), /terkunci/);

  await new Promise((resolve) => setTimeout(resolve, 25));
  assert.doesNotThrow(() => limiter.check('akun'));
});

test('rate limiter reset menghapus hitungan', () => {
  const limiter = makeRateLimiter({ maxAttempts: 1, lockMs: 60_000, message: 'terkunci' });

  limiter.check('akun');
  assert.throws(() => limiter.check('akun'), /terkunci/);
  limiter.reset('akun');
  assert.doesNotThrow(() => limiter.check('akun'));
});
