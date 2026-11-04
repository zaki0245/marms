# DESIGN SYSTEM — MARMS

> **Penjelasan untuk Pemula:** Ini "panduan tampilan" — warna, huruf, dan gaya tombol/tabel
> yang dipakai konsisten di seluruh aplikasi.
>
> **Kenapa Ini Penting:** Konsistensi membuat aplikasi terlihat profesional dan mudah dipakai.
> Nilai di bawah mengikuti `client/tailwind.config.js` dan `client/src/index.css`.

## 1. Mood
Profesional, data-dense, bersih, fokus keterbacaan tabel & angka. Seperti dashboard logistik/perbankan.
Chrome **header & sidebar** memakai navy solid (acuan: halaman `/career`); area konten (kartu, tabel, judul halaman) tetap netral. Tidak playful.

## 2. Warna
| Nama | Hex | Kegunaan |
|---|---|---|
| Navy (Aksen) | `#0F2C4C` | Tombol utama, aksen data, **header publik & sidebar/topbar admin**. Bukan untuk header tabel. |
| Surface | `#F8F8F8` | Background halaman (ground netral). |
| Ink | `gray-900` (`#111827`) | Teks utama: judul, angka, nama. |
| Muted | `gray-500`/`gray-600` | Teks sekunder, label, header tabel (sentence-case). |
| Positive (Hijau) | `#2E7D32` | Sukses, "Aktif", "Dibayar", "Diterima", "Lunas". |
| Negative (Merah) | `#C4242A` | Gagal, "Ditolak", "Expired", "Off Board", hapus. |
| Border | `gray-200`/`gray-300` | Batas kartu/input; baris tabel `gray-100`. |

> Kode warna: `navy`, `surface`, `positive`, `negative` di `tailwind.config.js`; sisanya palet bawaan Tailwind.
> `navy-light` dipertahankan hanya untuk kasus kecil (mis. tint), BUKAN header tabel.

## 3. Tipografi
- Font: **Geist** (400/500/600/700) — `"Geist", Inter, system-ui, sans-serif`; **Geist Mono** untuk kode/ID/nomor.
- Judul halaman: `<h1 class="page-title">` = 24px semibold ink (`text-2xl font-semibold text-gray-900`).
- Judul kartu/modal: 18px semibold ink (`text-lg font-semibold text-gray-900`).
- Sub-judul bagian: 16px semibold ink (`font-semibold text-gray-900`).
- Label form: `.label` (12px medium `text-gray-600`), di atas input.
- Isi tabel: 14px (`text-sm`); angka rata kanan + `tabular-nums`; header tabel 12px `text-gray-500` (bukan navy, bukan uppercase, tanpa band).
- Kode/nomor (nomor pendaftaran, kode jabatan, periode): `font-mono`.

## 4. Spacing & Radius
- Padding kartu: 16px (`p-4`) atau 20px (`p-5`); modal `p-6`.
- Jarak antar elemen: `mt-3`/`mt-4`/`mt-6`, gap `gap-2`/`gap-3`/`gap-4`.
- Radius: kartu `rounded-lg` (8px), tombol/input `rounded-md` (6px). Tanpa bayangan di elemen diam (kecuali modal/menu yang melayang).

## 5. Komponen (via `@layer components` di `index.css`)
- **Tombol:**
  - Primary: `.btn-primary` (bg-navy, teks putih).
  - Secondary: `.btn-secondary` (outline abu `border-gray-300`, teks `gray-700`).
  - Ghost: `.btn-ghost` (teks `gray-600`, hover `bg-gray-100`).
  - Danger: `.btn-danger` (bg-negative).
- **Kartu:** `.card` = `rounded-lg border border-gray-200 bg-white` (tanpa shadow).
- **Input/select:** `.input`; **label:** `.label`; **pesan:** `.alert-success` / `.alert-error` (tint pucat + teks gelap senada).
- **Tabel:** header `text-xs text-gray-500` tanpa `bg-navy-light`, baris dipisah `border-t border-gray-100`, angka rata kanan `tabular-nums`, baris kosong `text-gray-500`.
- **Tab:** underline 2px — aktif `-mb-px border-b-2 border-gray-900 text-gray-900`, non-aktif `text-gray-500`.
- **Badge status:** tint pucat + teks gelap senada (mis. `bg-positive/10 text-positive`); tidak pakai teks putih di atas warna jenuh, kecuali aksi langka.
- **Header publik & sidebar admin:** navy (`bg-navy text-white`), pembatas `border-white/10`. Item nav default `text-white/80 hover:bg-white/10`, item aktif pill `bg-white/15 text-white`. Label grup sentence-case `text-white/70`. Tombol tema/email `text-white/80`/`text-white/70`, tombol Keluar `text-red-200 hover:bg-white/10`. Mobile: sidebar jadi drawer + topbar navy (tombol menu `text-white hover:bg-white/10`). Logo di kotak putih (`bg-white`) agar tetap kontras.
  - **Mode gelap:** varian navy di atas **hanya berlaku di mode terang**. Di `.dark`, sidebar/topbar kembali netral (`dark:bg-card`, `dark:border-gray-200`), item aktif pill abu (`dark:bg-gray-200 dark:text-gray-900`), label grup `dark:text-gray-500`, teks nav `dark:text-gray-600`. Header Login disembunyikan (`dark:hidden`); Logo kembali `dark:bg-card`. Halaman publik (`/career*`, `/approve/:token`) tetap navy di kedua mode.

## 6. Angka & Uang
- Format Rupiah: `'Rp ' + n.toLocaleString('id-ID')`; Finance 2 desimal via `formatUang`.
- Angka di tabel/KPI selalu `tabular-nums` agar digit sejajar.

## 7. Responsif
- Grid kartu: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
- Form dua kolom: `grid-cols-1 sm:grid-cols-2`.
- Tabel lebar boleh `overflow-x-auto`; sidebar terang menjadi drawer di bawah `lg`.
