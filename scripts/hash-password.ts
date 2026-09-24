// scripts/hash-password.ts
// [FUNGSI] Membuat hash bcrypt dari password yang diberikan via argumen.
// [ALASAN] Dipakai untuk reset password admin secara manual (lihat SECURITY.md).
// Pemakaian: npm run hash:password -- "PasswordBaru"

import bcrypt from 'bcryptjs';

const password = process.argv[2];

if (!password) {
  console.error('Pemakaian: npm run hash:password -- "PasswordBaru"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log('Hash bcrypt:');
console.log(hash);
