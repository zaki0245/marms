# PRD — MARMS (Maritim Armada Raya Management System)

> **Penjelasan untuk Pemula:** Dokumen ini adalah "spesifikasi produk" — lembaran berisi
> apa saja yang harus bisa dilakukan aplikasi, siapa penggunanya, dan aturan-aturannya.
> Bayangkan ini cetak biru sebelum rumah dibangun. Semua keputusan pembuatan fitur merujuk ke sini.
>
> **Kenapa Ini Penting:** Tanpa PRD, kita bisa lupa fitur atau salah hitung (misalnya gaji).
> Dokumen ini jadi sumber kebenaran tunggal agar aplikasi sesuai kebutuhan perusahaan.
> Isi di bawah sudah disesuaikan dengan kode aktual di `src/` dan `client/src/`.

## 1. Identitas Proyek
- Nama: MARMS (Maritim Armada Raya Management System)
- Pemilik: PT. Maritim Armada Raya
- Jenis: Aplikasi web internal operasional crewing & finance
- Modul: CREWING (Rekrutmen, Rotasi Crew, Payroll, Leave Pay) + FINANCE (AP/AR, Invoice, Voucher PV/RV) + OPERATION (shipment/voyage, laytime, posisi kapal)
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
| Penerima approval voucher | TIDAK | Buka tautan `/approve/:token` dari email, tanpa login. |
| `SUPERADMIN` | YA | Semua payung (Crewing, Finance, Operation) + Kelola Akun. |
| `CREWING` | YA | Modul Crewing saja. |
| `FINANCE` | YA | Modul Finance saja. |
| `OPERATION` | YA | Modul Operation saja. |

## 4. Alur Bisnis Utama
1. **Rekrutmen:** Pelamar isi form → upload dokumen (opsional) → submit → admin seleksi
   (Baru → Verifikasi → Wawancara → Diterima/Ditolak) + verifikasi dokumen.
2. **Rotasi Crew:** Kandidat Diterima muncul di Pool Kandidat → assign ke kapal (unit TB + BG)
   + tanggal on board → On Board → Off Board (alasan Relief/Cuti/Sakit/Habis Kontrak) → masa kerja dihitung.
3. **Payroll & Uang Makan:** Pilih kapal + bulan + jenis (Gaji / Uang Makan) → hitung prorata
   → Draf → Final (snapshot) → Dibayar → export Excel/PDF.
4. **Leave Pay:** Setiap kelipatan 180 hari masa kerja kumulatif → admin input nominal +
   tanggal pencairan → catat riwayat pencairan.
5. **Finance (AP/AR):** Input invoice (pilih jenis AR/AP) → daftar invoice (tab AR/AP) →
   cetak voucher (RV untuk AR, PV untuk AP). Satu voucher bisa membayar banyak invoice dari
   satu vendor/customer; pembayaran sebagian didukung (DPP per voucher + flag lunasi PPN/PPH).
   Invoice bisa dikirim ke email penerima untuk approval; tautan `/approve/:token` menandai
   `SUDAH_DIAPPROVE` tanpa login.
6. **Operation:** Input shipment (data voyage TB/BG, POL/POD, jadwal, laycan, laytime) →
   update posisi & status (`PLANNED` → `ON_GOING` → `COMPLETED`) → Dashboard menampilkan pin
   shipment `ON_GOING` di peta → cetak laporan voyage (termasuk hitungan laytime/demurrage).

## 5. Entitas Bisnis (Ringkas)
- **Pelamar:** nomor pendaftaran `PLR-YYYY-NNNN` (reset tiap tahun), data pribadi (nama, tempat/tanggal
  lahir, jenis kelamin, no HP, email, alamat, kontak referensi), posisi dilamar, pengalaman
  (tahun, kapal terakhir, jabatan terakhir), 21 dokumen (opsional), status seleksi.
  Duplikat email ATAU HP ditolak.
- **Crew:** warisan dari pelamar + tanggal bergabung + status (Tersedia/On Board/Off Board) +
  masa kerja kumulatif (live saat On Board) + info bank (nama bank, no rekening).
- **Kontrak:** nomor auto `CTK-YYYY-NNNN`, jabatan, tanggal mulai/selesai, durasi, status. (TIDAK menyimpan gaji.)
- **Kapal:** 1 unit = TB + BG berpasangan. Status: Aktif/Docking.
- **Penempatan:** Crew → Kontrak → Kapal + jabatan + tanggal mulai/selesai.
- **Segmen On/Off Board:** per periode naik/turun kapal (pelabuhan on/off, alasan, durasi).
- **Sea Service Record:** catatan masa laut per segmen (untuk keperluan administrasi).
- **Payroll:** header (kapal, bulan, jenis Gaji/Uang Makan, status) + detail (1 baris per crew per segmen).
- **Leave Pay Disbursement:** pencairan per crew, nominal manual, tanggal pencairan, catatan performa.
- **Master Jabatan:** 8 jabatan fixed dengan gaji pokok.
- **Pengaturan Umum:** uang makan/bulan = Rp 1.650.000.
- **Vendor (AP):** lawan transaksi hutang (nama, npwp, alamat, rekening bank).
- **Customer (AR):** lawan transaksi piutang (nama, npwp, alamat, rekening bank).
- **Invoice:** jenis AR/AP, kategori (Freight/Operation/Others), tipe (Regular/DP/Pelunasan),
  DPP/PPN/PPH/total, nomor invoice (opsional), ref, keterangan, status faktur & pembayaran.
- **Voucher (Pv):** jenis RV/PV, nomor, tanggal, counterparty, bank, bank charge, balance,
  keterangan, item (invoice + DPP + flag includeTax).
- **Shipment (Operation):** satu voyage tongkang — kode, TB/BG, owner/operator, shipper,
  komoditas, laycan, POL/POD + agen/PIC/kontak, jadwal kegiatan (arrival, berthing, commenced
  loading/discharge, cast off, departure), laytime per pelabuhan, demurrage/despatch, posisi
  terakhir (koordinat + teks), status PLANNED/ON_GOING/COMPLETED, dokumen pendukung.
  Field TB/BG/owner/shipper/komoditas/contact/POL/POD punya saran dari riwayat shipment.
- **Agen (Operation):** master agen pelabuhan **terpisah per tipe** — tab POL & POD, nama unik
  per tipe, PIC & kontak. Dipakai untuk Agent POL & POD pada shipment. Memilih agen mengisi
  PIC/kontak otomatis (bisa diubah per shipment); satu nama boleh ada di kedua tipe.

### Daftar 21 Dokumen
Foto 4x6, CV, KTP, NPWP, Paspor*, Buku Pelaut*, SKCK*, MCU*, BPJS Kesehatan, BPJS Ketenagakerjaan,
CoC/ANT/ATT*, BST*, SCRB*, AFF*, MFA*, MC*, RADAR*, ARPA*, GOC/GMDSS*, MOORING MASTER*, MUTASI OFF.
(* = punya tanggal expired yang diisi pelamar; total 14 dokumen ber-expired, 7 tanpa expired.)

## 6. Aturan Bisnis Kunci
1. Gaji pokok dari master jabatan (bukan kontrak).
2. Uang makan dari pengaturan umum, sama semua jabatan, ikut prorata.
3. Pembagi prorata = jumlah hari kalender bulan berjalan (28/29/30/31).
4. Hari aktif = overlap segmen on/off board dengan bulan bersangkutan.
5. Crew dengan 2 segmen di bulan sama = 2 baris terpisah di payroll.
6. Payroll di-snapshot saat dibuat (nilai gaji/uang makan tersimpan di detail).
7. Masa kerja kumulatif = total hari semua segmen; bertambah live saat On Board.
8. Leave pay tiap kelipatan 180 hari kumulatif; nominal & tanggal pencairan keputusan admin.
9. Dokumen expired **tidak** memblokir penempatan baru; memperbarui dokumen expired menjadi
   tanggung jawab crew, admin tetap bisa memperbarui (file baru + tanggal).
10. Alasan off board: Relief, Cuti, Sakit, Habis Kontrak.

## 7. Rumus Kalkulasi
- Gaji Prorata = (Gaji Pokok / Hari Kalender) × Hari Aktif
- Uang Makan Prorata = (Uang Makan / Hari Kalender) × Hari Aktif
- Pembulatan: round half up ke Rupiah terdekat (tanpa desimal).
- Berhak Leave Pay = floor(Masa Kerja Kumulatif / 180)

## 8. Modul Aplikasi
| Modul | Keterangan |
|---|---|
| Dashboard | Angka ringkasan (tanpa grafik). |
| Master Data | Jabatan, Kapal (TB + BG), Uang Makan. |
| Rekrutmen | Form publik, seleksi status, verifikasi dokumen. |
| Crew & Penempatan | Pool Kandidat, Crew, Off Board, perbarui dokumen, info bank. |
| Payroll & Uang Makan | Generate, snapshot, status, export Excel/PDF. |
| Leave Pay | Kelayakan (kelipatan 180 hari), pencairan, riwayat. |
| Laporan | Crew per kapal, dokumen akan expired, masa kerja. |
| Pengaturan | Info akun admin, ganti password. |
| Finance: Vendor/Customer | Master Vendor (AP) & Customer (AR) + rekening bank. |
| Finance: Invoice | Input invoice AR/AP, daftar invoice (tab AR/AP), status faktur & pembayaran. |
| Finance: Cetak | Cetak voucher RV (AR) & PV (AP) ke PDF. |
| Finance: Laporan | Rekap AR/AP (filter bulan/tahun, export Excel). |
| Operation: Shipment | CRUD shipment/voyage, dokumen pendukung, status voyage, memori field voyage. |
| Operation: Agen | Master agen POL & POD terpisah per tipe (nama, PIC, kontak) + tambah cepat dari form. |
| Operation: Dashboard | Peta posisi shipment `ON_GOING` + ringkasan jumlah. |
| Operation: Laporan | Laporan voyage per shipment (laytime, demurrage/despatch). |
| Accounts | Kelola akun admin & role (khusus SUPERADMIN). |

## 9. Fitur & Batasan
- Login admin di `/login` (role menentukan payung yang bisa dibuka), ganti password wajib saat
  login pertama. Kelola akun (buat/nonaktifkan akun + role) khusus SUPERADMIN.
- Rate limiting: login 5x salah per email → terkunci 15 menit; pendaftaran pelamar 20x per IP →
  terkunci 15 menit (in-memory, reset saat restart).
- Halaman publik: form rekrutmen (tanpa login), tanpa nomor lamaran setelah daftar; halaman
  approval voucher `/approve/:token` dari email.
- Badge angka pelamar baru di sidebar.
- Export Excel & PDF di Payroll & Uang Makan.
- Info bank crew (nama bank, no rekening) dapat diedit admin.
- **Di luar cakupan saat ini:** BPJS/PPh21, multi-currency, approval berjenjang, portal
  self-service crew, notifikasi WA, training matrix, audit log, cek status publik, grafik statistik.

## 10. Gaya Visual
Navy Blue `#0F2C4C` (utama) · Abu-abu `#F8F8F8` (background) · Hijau `#2E7D32` (positif) ·
Merah Bata `#C4242A` (negatif). Rapi, formal, data-dense, seperti dashboard logistik/perbankan.
Detail lengkap ada di `DESIGN_SYSTEM.md`.
