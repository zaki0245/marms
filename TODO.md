# TODO.md — Daftar Pekerjaan MARMS

> **Penjelasan untuk Pemula:** Ini daftar tugas yang harus dikerjakan, diurutkan dari yang
> paling dasar. Setiap tugas dicentang setelah selesai dan berhasil dites.
>
> **Kenapa Ini Penting:** Supaya kita tahu sudah sampai mana dan tidak ada fitur yang terlewat.

## Fase 0 — Setup
- [x] Inisialisasi project (package.json, TypeScript, folder src/client).
- [x] Konfigurasi Prisma + skema semua tabel + migration.
- [x] Seed data: 8 jabatan, pengaturan umum, 1 akun admin.
- [x] Dockerfile + docker-compose.yml + .env.example + .gitignore.

## Modul 1 — Master Data
- [x] CRUD Master Jabatan (8 fixed, gaji pokok).
- [x] Pengaturan "Uang Makan" (uang makan/bulan).
- [x] CRUD Kapal (unit TB + BG; tanpa minimum manning, status Aktif/Docking).

## Modul 2 — Rekrutmen
- [x] Form pendaftaran publik + upload dokumen (20 dokumen, opsional).
- [x] Auto nomor pendaftaran `PLR-YYYY-NNNN`.
- [x] Validasi duplikat email/HP (tolak otomatis).
- [x] Halaman "Terima Kasih" (tanpa nomor lamaran).
- [x] Admin: daftar pelamar + seleksi status (Baru → Verifikasi → Wawancara → Diterima/Ditolak).
- [x] Badge pelamar baru di sidebar.

## Modul 3 — Kru & Penempatan
- [x] Pool Kandidat (assign kandidat diterima ke kapal + tanggal on board).
- [x] Crew (filter kapal, status, masa kerja live).
- [x] Tab Off Board (crew off board terpisah).
- [x] Off board (alasan Relief/End of Contract) + hitung masa kerja.
- [x] Blokir penempatan jika dokumen expired.
- [x] Perbarui dokumen expired (file baru + tanggal expired).

## Modul 4 — Payroll & Uang Makan
- [x] Generate payroll per jenis (Gaji / Uang Makan).
- [x] Hitung prorata (round half up).
- [x] Snapshot nilai gaji/uang makan.
- [x] Status Draf → Final → Dibayar.
- [x] Export Excel/PDF.

## Modul 5 — Laporan
- [x] Dashboard admin (angka tanpa grafik).
- [x] Laporan: crew per kapal, dokumen akan expired, masa kerja, leave pay.

## Modul 6 — Pengaturan (modul terpisah)
- [x] Login admin + ganti password (wajib saat login pertama).
- [x] Rate limiting login (5x salah → 15 menit).
- [x] Reset password manual (panduan SQL di SECURITY.md).

## Fase Akhir
- [ ] Validasi lokal menyeluruh (cek alur end-to-end).
- [ ] Push ke GitHub.
