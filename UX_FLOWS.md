# UX_FLOWS.md — Alur Pengguna

> **Penjelasan untuk Pemula:** Ini "peta perjalanan" pengguna — langkah-langkah yang dilakukan
> pelamar dan admin dari awal sampai selesai.
>
> **Kenapa Ini Penting:** Supaya alur aplikasi logis dan tidak ada langkah yang terlewat.

## 1. Alur Pelamar (Publik, Tanpa Login)
1. Buka beranda publik `http://localhost:3000`.
2. Klik **"Daftar Sekarang"**.
3. Isi **Data Pribadi** (nama, tempat/tanggal lahir, jenis kelamin, no HP, email, alamat).
4. Isi **Data Pengalaman** (posisi dilamar, pengalaman, kapal/jabatan terakhir).
5. Unggah **dokumen** (opsional; sebagian punya tanggal expired).
6. Klik **"Kirim Pendaftaran"**.
7. Muncul konfirmasi bila ada dokumen belum diunggah → OK.
8. Halaman **"Terima Kasih"** tampil (tanpa nomor lamaran).

## 2. Alur Admin — Rekrutmen
1. Login di `/admin/login`.
2. Menu **Rekrutmen** → lihat pelamar.
3. Buka **Detail** → ubah status: Baru → Verifikasi → Wawancara → Diterima/Ditolak.
4. Pelamar "Diterima" otomatis masuk ke **Pool Kandidat**.

## 3. Alur Admin — Penempatan Crew
1. Menu **Kru & Penempatan** → tab **Pool Kandidat**.
2. Klik **"Assign ke Kapal"** → pilih jabatan, kapal, tanggal on board, nama bank, no rekening.
3. Crew masuk ke tab **Crew** dengan status **On Board**.
4. Untuk crew off board: klik **"Off Board"** (alasan Relief/End of Contract) → pindah ke tab **Off Board**.
5. Crew bisa di-**Assign** lagi (naik kapal lagi).

## 4. Alur Admin — Payroll & Uang Makan
1. Menu **Payroll & Uang Makan** → tab **Payroll** atau **Uang Makan**.
2. Klik **"Buat"** → pilih kapal + bulan + tahun.
3. Draft dibuat dengan rincian prorata (termasuk nama bank & no rekening).
4. **Final** → kunci nilai (snapshot).
5. **Tandai Dibayar** → selesai.
6. **Export Excel/PDF** untuk arsip.

## 5. Alur Admin — Leave Pay
1. Menu **Laporan** → tab **Leave Pay**.
2. Lihat kolom Berhak / Dibayar / Sisa per crew.
3. Klik **"Cairkan"** → isi nominal + tanggal dibayarkan.
4. Klik **"Riwayat"** → lihat detail pencairan.

## 6. Alur Admin — Pengaturan
1. Menu **Pengaturan** (di luar modul Crewing).
2. Ganti password (password lama + baru).
3. **Keluar** (logout) di pojok kanan atas.
