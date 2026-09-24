# SETUP_LOCAL.md — Panduan Setup di Laptop (WSL2)

> **Penjelasan untuk Pemula:** Ini panduan langkah demi langkah menyiapkan laptop agar
> aplikasi MARMS bisa jalan di lokal, dari nol sampai terbuka di browser.
>
> **Kenapa Ini Penting:** Setup yang benar di awal mencegah banyak error aneh di kemudian hari.
> Ikuti urutannya, jangan melompat.

## 0. Prasyarat (sekali saja)
Pastikan sudah terpasang di WSL Ubuntu:
- Node.js 20+ dan npm: `node -v` dan `npm -v`
- Docker + Docker Compose: `docker -v` dan `docker compose version`
- Git: `git --version`

## 1. Masuk Folder Project
```bash
cd ~/projects/marms
```

## 2. Salin Konfigurasi
```bash
cp .env.example .env
# lalu edit .env bila perlu (DATABASE_URL, SESSION_SECRET, dll)
```

## 3. Install Dependency (root + frontend)
```bash
npm install              # dependency backend (otomatis prisma generate)
cd client && npm install # dependency frontend
cd ..
```

## 4. Nyalakan Database
```bash
docker compose up -d db
```

## 5. Buat Tabel & Isi Data Awal
```bash
npx prisma migrate dev --name init   # buat tabel (sekali saat pertama)
npm run db:seed                      # isi 8 jabatan, pengaturan uang makan, akun admin
```

## 6. Build Frontend
```bash
cd client && npm run build
cd ..
```
> Frontend di-build ke `client/dist` dan disajikan langsung oleh Express (satu URL, satu proses).

## 7. Jalankan Aplikasi
```bash
npm run dev
```
Tunggu muncul `MARMS API berjalan di http://localhost:3000`.

## 8. Akses dari Browser Windows
- Beranda publik (rekrutmen): `http://localhost:3000`
- Login admin: `http://localhost:3000/admin/login`
- Akun admin awal: `admin@marms.com` / `Admin123!` (wajib ganti saat login pertama)

## 9. Verifikasi Cepat
- `docker compose ps` → service `db` status `Up (healthy)`.
- Buka `http://localhost:3000/health` → `{"status":"ok"}`.
- Buka `http://localhost:3000` → beranda publik tampil.

## 10. Jika Error
- Cek log: `docker compose logs db`.
- Port bentrok → ubah port di `.env` dan `docker-compose.yml`.
- Setelah mengubah schema/instal dependency, restart `npm run dev`.
- Error `401` di API → login ulang (sesi berakhir).
