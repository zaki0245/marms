# TESTING.md — Panduan Testing MARMS

> **Penjelasan untuk Pemula:** Ini daftar cara mengetes setiap fitur, langkah demi langkah,
> plus apa yang seharusnya muncul. Seperti "buku ujian" untuk memastikan fitur benar.
>
> **Kenapa Ini Penting:** Fitur yang tidak dites bisa saja terlihat jalan tapi salah hitung.
> Testing rutin membuat kita yakin aplikasi bekerja sesuai aturan bisnis.

## Cara Mengetes Umum
1. Jalankan aplikasi (`npm run dev`), pastikan database nyala (`docker compose up -d db`).
2. Buka browser Windows di `http://localhost:3000`.
3. Ikuti langkah skenario, bandingkan hasil dengan "yang diharapkan".

## Master Data
- **Jabatan:** ada 8 jabatan dengan gaji pokok sesuai brief.
- **Kapal:** tambah/edit kapal (TB + BG). Status hanya Aktif/Docking. Tidak ada minimum manning.
- **Uang Makan:** ubah nilai uang makan, tersimpan & dipakai payroll.

## Rekrutmen
- **Pendaftaran publik:** isi form + upload sebagian dokumen → klik kirim → muncul konfirmasi
  "Masih ada X dokumen yang belum diunggah" → OK → halaman "Terima Kasih" (tanpa nomor).
- **Dokumen expired:** untuk dokumen bertanda "(berlaku s/d tanggal)", ada input tanggal expired.
- **Duplikat:** daftar lagi dengan email/HP sama → ditolak "Email/No HP sudah terdaftar".
- **Seleksi:** di admin, ubah status pelamar (Baru → Verifikasi → Wawancara → Diterima/Ditolak).

## Kru & Penempatan
- **Pool Kandidat:** pelamar "Diterima" muncul → klik "Assign ke Kapal" → pilih jabatan + kapal + tanggal → status On Board.
- **Crew:** filter kapal menampilkan crew di kapal tersebut; masa kerja bertambah saat On Board.
- **Off Board:** klik "Off Board" (alasan Relief/End of Contract) → crew pindah ke tab Off Board, masa kerja terhitung.
- **Blokir dokumen expired:** crew dengan dokumen expired ditolak saat assign.
- **Perbarui dokumen:** di Detail Crew → Dokumen → "Perbarui" → upload file baru + tanggal expired.

## Payroll & Uang Makan
- **Generate Gaji:** pilih kapal + bulan → buat → muncul rincian gaji prorata (round half up).
- **Generate Uang Makan:** terpisah, hanya uang makan.
- **Relief mid-month:** 2 crew KKM (1-4 dan 5-31) muncul sebagai 2 baris terpisah.
- **Snapshot:** Final payroll, lalu ubah gaji pokok → payroll lama tidak berubah.
- **Export:** klik "Export Excel" dan "Export PDF" → file terunduh.

## Laporan
- **Dashboard:** angka (pelamar baru, crew on board, dokumen expired, siap leave pay, total biaya, status payroll) tampil benar.
- **Leave Pay:** tab Leave Pay menampilkan berhak/dibayar/sisa; "Cairkan" (input nominal + tanggal) → "Dibayar" bertambah; "Riwayat" menampilkan tanggal dibayarkan.

## Pengaturan
- **Login:** `admin@marms.com` / `Admin123!` → dipaksa ganti password.
- **Rate limit:** salah password 5x → diblokir 15 menit.
- **Auto-logout:** diam 30 menit → dialihkan ke login.

## Kriteria Lolos
- Semua skenario menghasilkan "yang diharapkan".
- Tidak ada error di log.
