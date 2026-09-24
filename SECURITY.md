# SECURITY.md — Panduan Keamanan MARMS

> **Penjelasan untuk Pemula:** Dokumen ini berisi aturan keamanan aplikasi: cara menyimpan
> password, mengatur sesi login, membatasi upload file, dan melindungi data sensitif.
>
> **Kenapa Ini Penting:** MARMS menyimpan data pribadi, dokumen identitas, no rekening, dan gaji.
> Kalau keamanan lemah, data orang bisa bocor/disalahgunakan. Keamanan bukan fitur tambahan.

## 1. Password
- Password admin di-hash dengan **bcrypt** (tidak pernah disimpan mentah). ✅ Terimplementasi.
- Akun admin awal dari seed: email `admin@marms.com`, password `Admin123!`.
- **Wajib ganti password setelah login pertama** (dipaksa oleh sistem). ✅

## 2. Sesi Login (Session Management)
- Menggunakan `express-session` dengan **auto-logout 30 menit tidak aktif**. ✅
- Cookie sesi diberi flag `httpOnly` dan `sameSite: 'lax'`. ✅
- (Catatan: penyimpanan sesi saat ini masih memory; bisa ditingkatkan ke PostgreSQL bila perlu.)

## 3. Rate Limiting Login
- Max 5x password salah → diblokir 15 menit. ✅ Terimplementasi (in-memory).
- Pesan error dibuat umum: "Email atau password salah" (tidak ungkap mana yang salah). ✅

## 4. Reset Password Admin
- Reset bersifat **manual via database** (tidak ada halaman lupa password).
- Panduan SQL:
```sql
-- Ganti password admin. Ganti '<HASH_BARU>' dengan hash bcrypt baru.
UPDATE "Admin" SET "passwordHash" = '<HASH_BARU>' WHERE "email" = 'admin@marms.com';
```
- Cara membuat hash baru: jalankan `npm run hash:password -- "PasswordBaru"`.

## 5. Upload Dokumen
- Hanya PDF / JPG / PNG, max 5 MB per file. Dokumen bersifat opsional (maksimal 20 jenis).
- Nama file asli TIDAK dipakai; file disimpan dengan nama acak (UUID) untuk cegah tebakan. ✅
- Folder `uploads/` tidak boleh di-list sebagai direktori publik.

## 6. Data Sensitif & Validasi
- Validasi ketat untuk: email, no HP, tanggal, nominal (zod). ✅
- Semua input dari pengguna dianggap tidak aman sampai tervalidasi (never trust user input). ✅
- Gunakan parameterized query via Prisma (otomatis aman dari SQL injection). ✅

## 7. Secrets & Git
- `.env` WAJIB masuk `.gitignore` (jangan pernah di-commit).
- Jangan menulis password/secret di kode atau komentar.

## 8. Otorisasi
- Semua endpoint `/api/*` dilindungi middleware auth, kecuali whitelist publik
  (`POST /api/recruitment/pelamar`, `GET /api/master-data/jabatan`). ✅
- Halaman publik rekrutmen hanya bisa menulis data pelamar.
