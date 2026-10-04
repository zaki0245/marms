# TODO.md — Daftar Pekerjaan MARMS

> **Penjelasan untuk Pemula:** Ini daftar tugas yang harus dikerjakan, diurutkan dari yang
> paling dasar. Setiap tugas dicentang setelah selesai dan berhasil dites.
>
> **Kenapa Ini Penting:** Supaya kita tahu sudah sampai mana dan tidak ada fitur yang terlewat.
> Daftar ini sudah di-reset dan disesuaikan dengan kode aktual di `src/` dan `client/src/`.

## Fase 0 — Setup
- [x] Inisialisasi project (package.json, TypeScript, folder src/client).
- [x] Konfigurasi Prisma + skema semua tabel + migration.
- [x] Seed data: 8 jabatan, pengaturan umum (uang makan), 1 akun admin.
- [x] Dockerfile (multi-stage) + docker-compose.yml (db + app + adminer) + .env.example + .gitignore.

## Modul 1 — Master Data
- [x] CRUD Master Jabatan (8 fixed, gaji pokok).
- [x] Pengaturan "Uang Makan" (uang makan/bulan).
- [x] CRUD Kapal (unit TB + BG; tanpa minimum manning, status Aktif/Docking).

## Modul 2 — Rekrutmen
- [x] Form pendaftaran publik + upload dokumen (21 dokumen, opsional).
- [x] Auto nomor pendaftaran `PLR-YYYY-NNNN`.
- [x] Validasi duplikat email/HP (tolak otomatis).
- [x] Halaman "Terima Kasih" (tanpa nomor lamaran).
- [x] Admin: daftar pelamar + seleksi status (Baru → Verifikasi → Wawancara → Diterima/Ditolak).
- [x] Badge pelamar baru di sidebar.

## Modul 3 — Kru & Penempatan
- [x] Pool Kandidat (assign kandidat Diterima ke kapal + tanggal on board).
- [x] Crew (filter kapal, status, masa kerja live).
- [x] Tab Off Board (crew off board terpisah).
- [x] Off board (alasan Relief/Cuti/Sakit/Habis Kontrak) + hitung masa kerja.
- [x] Blokir penempatan jika dokumen expired.
- [x] Perbarui dokumen expired (file baru + tanggal expired).
- [x] Edit info bank (nama bank, no rekening).

## Modul 4 — Payroll & Uang Makan
- [x] Generate payroll per jenis (Gaji / Uang Makan).
- [x] Hitung prorata (round half up).
- [x] Snapshot nilai gaji/uang makan.
- [x] Status Draf → Final → Dibayar.
- [x] Export Excel/PDF.

## Modul 5 — Laporan & Leave Pay
- [x] Dashboard admin (angka ringkasan, tanpa grafik).
- [x] Laporan: crew per kapal, dokumen akan expired (30 hari), masa kerja.
- [x] Kelayakan leave pay (kelipatan 180 hari) + pencairan (nominal & tanggal) + riwayat.

## Modul 6 — Pengaturan & Auth
- [x] Login admin + ganti password (wajib saat login pertama).
- [x] Rate limiting login (5x salah → 15 menit).
- [x] Logout & proteksi endpoint `/api/*` (whitelist publik: daftar pelamar + list jabatan).

## Fase Akhir — Tersisa
- [x] Generate `SeaServiceRecord` otomatis saat off board (`imo` dari `tbImo`).
- [x] Aktifkan alasan off board Cuti & Sakit di form (Relief/Cuti/Sakit/Habis Kontrak).
- [x] Hapus kolom `dinilaiOleh` / `dicairkanOleh` yang tidak terpakai di leave pay.
- [x] Test minimal (`npm test`): prorata & masa kerja live.
- [ ] Validasi lokal end-to-end (cek seluruh alur dari daftar → payroll → leave pay).
- [ ] Push ke GitHub.
- [ ] (DITUNDA) DevOps: Docker production, K3s, CI/CD, OCI.
