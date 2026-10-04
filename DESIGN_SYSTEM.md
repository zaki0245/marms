# DESIGN SYSTEM — MARMS

> **Penjelasan untuk Pemula:** Ini "panduan tampilan" — warna, huruf, dan gaya tombol/tabel
> yang dipakai konsisten di seluruh aplikasi. Seperti seragam: semua halaman harus terlihat senada.
>
> **Kenapa Ini Penting:** Konsistensi membuat aplikasi terlihat profesional dan mudah dipakai.
> Dengan panduan ini, setiap halaman baru langsung tampil seragam tanpa nebak-nebak.
> Nilai di bawah mengikuti `client/tailwind.config.js` dan `client/src/index.css`.

## 1. Mood
Profesional, data-dense, bersih, fokus keterbacaan tabel & angka.
Seperti dashboard logistik/perbankan. Tidak playful.

## 2. Warna
| Nama | Hex | Kegunaan |
|---|---|---|
| Navy | `#0F2C4C` | Warna utama: header, sidebar, tombol utama, judul |
| Navy Light | `#EAF0F7` | Header tabel & highlight navy muda |
| Surface | `#F5F6F8` | Background halaman |
| Positive (Hijau) | `#1E7A46` | Positif: sukses, "Aktif", "Dibayar", "Diterima" |
| Negative (Merah Bata) | `#B3261E` | Negatif: gagal, "Ditolak", "Expired", "Off Board" |
| Putih | `#FFFFFF` | Kartu, tabel, area konten |
| Amber (Tailwind) | `amber-100` / `amber-700` | Badge netral: "Verifikasi", "Wawancara", "Draf" |
| Gray (Tailwind default) | `gray-100`…`gray-800` | Border (`gray-200/300`), teks sekunder (`gray-500`), teks isi (`gray-800`) |

> Warna navy/navy-light/surface/positive/negative didefinisikan di `tailwind.config.js`;
> gray & amber memakai palet bawaan Tailwind.

## 3. Tipografi
- Font: system-ui stack — `system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`.
- Judul halaman: 24px bold navy (`text-2xl font-bold text-navy`).
- Judul kartu/modal: 18px bold navy (`text-lg font-bold text-navy`).
- Sub-judul bagian: 16px semibold navy (`font-semibold text-navy`).
- Label form: 12px abu-abu (`text-xs text-gray-500`), diletakkan di atas input.
- Isi tabel: 14px (`text-sm`); angka rata kanan + `tabular-nums` agar digit sejajar.
- Kode/nomor (nomor pendaftaran, kode jabatan, periode kerja): `font-mono`.

## 4. Spacing
- Padding kartu: 16px (`p-4`) atau 20px (`p-5`); modal `p-6`.
- Jarak antar elemen: `mt-3`/`mt-4`/`mt-6`, gap `gap-2`/`gap-3`/`gap-4`.
- Radius: kartu/input `rounded`/`rounded-lg`; kartu publik kadang `rounded-xl`.

## 5. Komponen
- **Tombol:**
  - Primary: `bg-navy text-white rounded px-4 py-2 text-sm font-semibold`.
  - Secondary (outline): `border border-navy text-navy`.
  - Danger: teks `text-negative` (link aksi) atau `bg-negative text-white` (submit merusak, mis. off board).
  - Aksi tabel berbentuk link: `text-navy`/`text-positive`/`text-negative` + `hover:underline`.
- **Tabel:** header `bg-navy-light text-navy`, baris dipisah `border-t border-gray-100`, baris kosong `text-gray-400`.
- **Badge status:**
  - Hijau (`bg-positive/10 text-positive`): Diterima, Dibayar, Aktif.
  - Merah (`bg-negative/10 text-negative`): Ditolak, Expired.
  - Navy (`bg-navy/10 text-navy`): Baru, Final.
  - Amber (`bg-amber-100 text-amber-700`): Verifikasi, Wawancara, Draf.
  - Abu (`bg-gray-200 text-gray-600`): Docking.
- **Form:** label di atas input, input `rounded border border-gray-300 px-3 py-2`, fokus `ring-2 ring-navy/30`.
- **Sidebar:** lebar `w-60`, `bg-navy text-white`, item aktif `bg-white/15`, group "Crewing" bisa dibuka/tutup.
- **Modal:** overlay `bg-black/40` + kartu `bg-white rounded-lg shadow-xl p-6`.
- **Pesan:** sukses `bg-positive/10 text-positive`, error `bg-negative/10 text-negative`.

## 6. Angka & Uang
- Format Rupiah: `'Rp ' + n.toLocaleString('id-ID')` → contoh `Rp 10.500.000` (tanpa desimal).
- Semua hasil prorata dibulatkan ke Rupiah terdekat (round half up).

## 7. Responsif
- Grid kartu: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
- Form dua kolom: `grid-cols-1 sm:grid-cols-2`.
- Tabel lebar boleh scroll horizontal di layar kecil; sidebar tetap di kiri (belum collapse di mobile).
