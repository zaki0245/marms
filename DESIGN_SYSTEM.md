# DESIGN SYSTEM — MARMS

> **Penjelasan untuk Pemula:** Ini "panduan tampilan" — warna, huruf, dan gaya tombol/tabel
> yang dipakai konsisten di seluruh aplikasi. Seperti seragam: semua halaman harus terlihat senada.
>
> **Kenapa Ini Penting:** Konsistensi membuat aplikasi terlihat profesional dan mudah dipakai.
> Dengan panduan ini, setiap halaman baru langsung tampil seragam tanpa nebak-nebak.

## 1. Mood
Profesional, data-dense, bersih, fokus keterbacaan tabel & angka.
Seperti dashboard logistik/perbankan. Tidak playful.

## 2. Warna
| Nama | Hex | Kegunaan |
|---|---|---|
| Navy Blue | `#0F2C4C` | Warna utama: header, sidebar, tombol utama |
| Abu-abu Netral | `#F5F6F8` | Background halaman |
| Hijau Tua | `#1E7A46` | Positif: sukses, "Aktif", "Dibayar", "Diterima" |
| Merah Bata | `#B3261E` | Negatif: gagal, "Ditolak", "Expired", "Off Board" |
| Putih | `#FFFFFF` | Kartu, tabel, area konten |
| Abu-abu border | `#E2E5EA` | Garis tabel dan pembatas |
| Teks utama | `#1F2937` | Teks isi |
| Teks sekunder | `#6B7280` | Label, keterangan |

## 3. Tipografi
- Font: `Inter` (fallback: system-ui, sans-serif).
- Judul halaman: 24px, bold.
- Judul tabel/kartu: 16px, semibold.
- Isi tabel: 14px, angka rata kanan, teks rata kiri.
- Angka gaji/uang: gunakan font tabular (agar digit sejajar).

## 4. Spacing (skala 4px)
- Padding kartu: 16px / 24px.
- Jarak antar elemen: 8, 12, 16, 24 px.
- Radius kartu/input: 8px.

## 5. Komponen
- **Tombol:** Primary (Navy solid), Secondary (putih + border navy), Danger (Merah).
- **Tabel:** header navy muda `#EAF0F7` dengan teks navy, baris zebra, hover abu terang.
- **Badge status:** hijau (Aktif/Final/Dibayar/Diterima), merah (Ditolak/Expired),
  abu (Draf), kuning (Verifikasi/Wawancara).
- **Form:** label di atas input, input tinggi 40px, border abu, fokus border navy.
- **Sidebar:** background navy, teks putih, item aktif diberi aksen lebih terang.

## 6. Angka & Uang
- Format Rupiah: `Rp 10.500.000` (titik sebagai pemisah ribuan, tanpa desimal).
- Semua hasil prorata dibulatkan ke Rupiah terdekat (round half up).

## 7. Responsif
- Minimal nyaman di tablet (768px) dan HP (360px).
- Tabel lebar boleh scroll horizontal di layar kecil.
