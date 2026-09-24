# GIT_STRATEGY.md — Strategi Git & GitHub

> **Penjelasan untuk Pemula:** Git adalah alat untuk menyimpan "versi" kode, dan GitHub
> adalah tempat menyimpannya di internet. Dokumen ini aturan kapan dan bagaimana menyimpan (commit).
>
> **Kenapa Ini Penting:** Dengan Git, kalau kode rusak kita bisa mundur ke versi yang benar.
> Strategi yang jelas mencegah file rahasia ter-upload dan membuat riwayat mudah dibaca.

## 1. Cabang (Branch)
- `main` = kode yang stabil & berjalan (hanya berisi fitur yang sudah dites).
- Cabang fitur `feat/<nama-fitur>` untuk tiap modul (contoh: `feat/master-data`).
- Setelah fitur dites, gabungkan (merge) ke `main`.

## 2. Aturan Commit
- Satu commit = satu perubahan jelas. Contoh pesan:
  - `feat: tambah modul master data (jabatan, kapal)`
  - `fix: perbaiki pembulatan gaji prorata`
  - `docs: tambah panduan setup lokal`
- Gunakan bahasa singkat dan konsisten (awalan `feat:`, `fix:`, `docs:`).

## 3. File yang WAJIB Diabaikan (.gitignore)
- `.env` (berisi password database)
- `node_modules/` (dependency, bisa di-install ulang)
- `uploads/` (dokumen pribadi pelamar)
- `dist/`, `build/` (hasil build)
- file log `*.log`

## 4. Langkah Push Pertama (nanti di Fase 1D)
1. Buat repository di GitHub (private).
2. `git init` → `git add .` → `git commit -m "chore: init project MARMS"`.
3. `git branch -M main`.
4. `git remote add origin <URL-repo>`.
5. `git push -u origin main`.

## 5. Aturan Penting
- JANGAN pernah commit `.env` atau file yang berisi password.
- Kalau tidak sengaja ter-commit, segera hapus & ganti password database.
- Setiap selesai 1 modul, commit sebelum lanjut ke modul berikutnya.
