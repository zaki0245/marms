// prisma/seed.ts
// [FUNGSI] Mengisi data awal database: 8 jabatan, pengaturan umum, 1 akun admin.
// [ALASAN] Data ini wajib ada agar aplikasi bisa dipakai langsung setelah setup.

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// [FUNGSI] Daftar 8 jabatan fixed beserta gaji pokoknya (sesuai brief).
const JABATAN = [
  { kode: 'MSTR', nama: 'Master', gajiPokok: 10500000 },
  { kode: 'MUAL1', nama: 'Mualim 1', gajiPokok: 8000000 },
  { kode: 'MUAL2', nama: 'Mualim 2', gajiPokok: 7000000 },
  { kode: 'KKM', nama: 'KKM', gajiPokok: 9000000 },
  { kode: 'MAS2', nama: 'Masinis 2', gajiPokok: 8000000 },
  { kode: 'MAS3', nama: 'Masinis 3', gajiPokok: 7000000 },
  { kode: 'JMUDI', nama: 'Juru Mudi', gajiPokok: 4750000 },
  { kode: 'JMINYAK', nama: 'Juru Minyak', gajiPokok: 4750000 },
];

async function main() {
  // [FUNGSI] Simpan jabatan (upsert = insert jika belum ada, update jika sudah ada).
  // [ALASAN] Seed aman dijalankan berulang tanpa membuat data ganda.
  for (const j of JABATAN) {
    await prisma.jabatan.upsert({
      where: { kode: j.kode },
      update: j,
      create: j,
    });
  }

  // [FUNGSI] Simpan uang makan per bulan di pengaturan umum.
  await prisma.pengaturan.upsert({
    where: { key: 'UANG_MAKAN_PER_BULAN' },
    update: { value: '1650000' },
    create: { key: 'UANG_MAKAN_PER_BULAN', value: '1650000' },
  });

  // [FUNGSI] Buat akun admin awal dengan password ter-hash.
  // [ALASAN] Password TIDAK boleh disimpan mentah; pakai bcrypt.
  const email = process.env.ADMIN_EMAIL ?? 'admin@marms.com';
  const password = process.env.ADMIN_PASSWORD ?? 'Admin123!';
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.admin.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash, mustChangePassword: true },
  });

  console.log('Seed selesai: 8 jabatan, 1 pengaturan, 1 akun admin.');
  console.log(`Admin login -> email: ${email} | password: ${password} (wajib ganti)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
