# PRD — MARMS (Maritim Armada Raya Management System)

> **Penjelasan untuk Pemula:** Dokumen ini adalah "spesifikasi produk" — lembaran berisi
> apa saja yang harus bisa dilakukan aplikasi, siapa penggunanya, dan aturan-aturannya.
> Bayangkan ini cetak biru sebelum rumah dibangun. Semua keputusan pembuatan fitur merujuk ke sini.
>
> **Kenapa Ini Penting:** Tanpa PRD, kita bisa lupa fitur atau salah hitung (misalnya gaji).
> Dokumen ini jadi sumber kebenaran tunggal agar aplikasi sesuai kebutuhan perusahaan.

## 1. Identitas Proyek
- Nama: MARMS (Maritim Armada Raya Management System)
- Pemilik: PT. Maritim Armada Raya
- Jenis: Aplikasi web internal operasional crewing
- Modul awal: CREWING (Rekrutmen, Rotasi Crew, Payroll)
- Bahasa antarmuka: Indonesia
- Fase saat ini: **Lokal** (WSL2 + PostgreSQL), DevOps menyusul

## 2. Latar Belakang & Masalah
Perusahaan tongkang mengelola crew, kapal, dan gaji secara manual via Excel terpisah.
Masalah: gaji prorata rawan salah saat relief tengah bulan, sulit melacak masa kerja
kumulatif, tidak ada riwayat terpusat per crew, dokumen sering expired, rekap gaji manual berulang.

## 3. Aktor & Peran (V1)
| Aktor | Login? | Hak Akses |
|---|---|---|
| Pelamar (publik) | TIDAK | Isi form pendaftaran + upload dokumen. Tidak bisa cek status/edit. |
| Admin | YA (1 akun) | Full access semua modul. |

## 4. Alur Bisnis Utama
1. **Rekrutmen:** Pelamar isi form → upload dokumen (opsional) → submit → admin seleksi (Baru → Verifikasi → Wawancara → Diterima/Ditolak).
2. **Rotasi Crew:** Kandidat diterima → assign ke kapal (TB+BG) + tanggal on board → On Board → Off Board/Relief → masa kerja dihitung.
3. **Payroll & Uang Makan:** Pilih bulan + kapal → hitung prorata (gaji & uang makan terpisah) → Draf → Final (snapshot) → Dibayar → export Excel/PDF.
4. **Leave Pay:** Setiap kelipatan 180 hari masa kerja kumulatif → admin tentukan nominal → cairkan (input tanggal) → catat riwayat.

## 5. Entitas Bisnis (Ringkas)
- **Pelamar:** nomor pendaftaran `PLR-YYYY-NNNN` (reset tiap tahun), data pribadi, pengalaman, 20 dokumen (opsional, sebagian punya tanggal expired), status seleksi. Duplikat email/HP ditolak.
- **Crew:** warisan dari pelamar + status (Tersedia/On Board/Off Board) + masa kerja kumulatif (live saat On Board).
- **Kontrak:** nomor auto, jabatan, tanggal mulai, status. (TIDAK menyimpan gaji.)
- **Kapal:** 1 unit = TB + BG berpasangan. Status: Aktif/Docking.
- **Penempatan:** Crew → Kontrak → Kapal + jabatan + tanggal.
- **Segmen On/Off Board:** per periode naik/turun kapal, durasi dihitung saat off board.
- **Payroll:** header (kapal, bulan, jenis Gaji/Uang Makan, status) + detail (1 baris per crew per segmen).
- **Leave Pay Disbursement:** pencairan per crew, nominal manual, tanggal pencairan manual.
- **Master Jabatan:** 8 jabatan fixed dengan gaji pokok.
- **Pengaturan Umum:** uang makan/bulan = Rp 1.650.000.

### Daftar 20 Dokumen
Foto 4x6, CV, KTP, NPWP, Paspor*, Buku Pelaut*, SKCK*, MCU*, BPJS Kesehatan, BPJS Ketenagakerjaan,
CoC/ANT/ATT*, BST*, SCRB*, AFF*, MFA*, MC*, RADAR*, ARPA*, GOC/GMDSS*, MOORING MASTER*, MUTASI OFF.
(* = punya tanggal expired yang diisi pelamar)

## 6. Aturan Bisnis Kunci
1. Gaji pokok dari master jabatan (bukan kontrak).
2. Uang makan dari pengaturan umum, sama semua jabatan, ikut prorata.
3. Pembagi prorata = jumlah hari kalender bulan berjalan (28/29/30/31).
4. Hari aktif = selisih on board - off board dari segmen.
5. Crew dengan 2 segmen di bulan sama = 2 baris terpisah di payroll.
6. Payroll di-snapshot saat Final (nilai lama tidak berubah walau master berubah).
7. Masa kerja kumulatif = total hari semua segmen; bertambah live saat On Board.
8. Leave pay tiap kelipatan 180 hari kumulatif; nominal & tanggal pencairan keputusan admin.
9. Dokumen expired → blokir penempatan baru; admin bisa perbarui dokumen expired.

## 7. Rumus Kalkulasi
- Gaji Prorata = (Gaji Pokok / Hari Kalender) × Hari Aktif
- Uang Makan Prorata = (Uang Makan / Hari Kalender) × Hari Aktif
- Pembulatan: round half up ke Rupiah terdekat (tanpa desimal).
- Berhak Leave Pay = floor(Masa Kerja Kumulatif / 180)

## 8. Modul Aplikasi (di dalam modul "Crewing")
1. Dashboard (angka ringkasan)
2. Master Data (Jabatan, Kapal, Uang Makan)
3. Rekrutmen (form publik, seleksi)
4. Kru & Penempatan (Pool Kandidat, Crew, Off Board)
5. Payroll & Uang Makan (generate, snapshot, status, export)
6. Laporan (crew per kapal, dokumen expired, masa kerja, leave pay)

Modul terpisah (di luar Crewing): **Pengaturan** (akun admin, ganti password).

## 9. Fitur & Batasan
- Login admin di `/admin/login` (1 akun, full access), ganti password wajib saat login pertama.
- Halaman publik form rekrutmen (tanpa login), tanpa nomor lamaran setelah daftar.
- Badge angka pelamar baru di sidebar.
- Export Excel & PDF di Payroll & Uang Makan.
- **Di luar cakupan V1:** BPJS/PPh21, multi-currency, approval berjenjang, portal self-service crew,
  notifikasi WA/email, training matrix, multi-role RBAC, audit log, cek status publik, grafik statistik.

## 10. Gaya Visual
Navy Blue `#0F2C4C` (utama) · Abu-abu `#F5F6F8` (background) · Hijau `#1E7A46` (positif) ·
Merah Bata `#B3261E` (negatif). Rapi, formal, data-dense, seperti dashboard logistik/perbankan.
