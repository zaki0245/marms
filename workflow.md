# workflow.md — Alur Kerja Pengembangan

> **Penjelasan untuk Pemula:** Ini urutan langkah harian saat membangun & mengetes aplikasi:
> mulai dari menyalakan, menjalankan, sampai menyimpan perubahan ke Git.
>
> **Kenapa Ini Penting:** Dengan alur yang sama setiap hari, kita tidak lupa langkah
> dan mudah menemukan masalah karena tahu persis apa yang baru diubah.

## 1. Setup Awal (sekali saja)
1. Pastikan berada di WSL Ubuntu, folder `~/projects/marms`.
2. Jalankan `npm install` lalu `cd client && npm install`.
3. Salin `.env.example` menjadi `.env`.
4. `docker compose up -d db` → `npx prisma migrate dev --name init` → `npm run db:seed`.
5. `cd client && npm run build` (build frontend).

## 2. Menjalankan di Lokal (mode development)
```bash
npm run dev
```
Akses dari browser Windows:
- Beranda publik: `http://localhost:3000/`
- Login admin: `http://localhost:3000/admin/login`

## 3. Setiap Ada Perubahan Kode
- **Backend** (`src/`): `npm run dev` otomatis reload (tsx watch).
- **Frontend** (`client/`): jalankan `cd client && npm run build` lalu refresh browser.
- **Schema database**: jalankan `npx prisma migrate dev --name <nama>` lalu **restart** `npm run dev`.

## 4. Alur Kerja per Fitur
1. Kerjakan SATU fitur sampai selesai & bisa dites.
2. Test manual sesuai skenario di `TESTING.md`.
3. Jika error, baca log, perbaiki, jalankan ulang.
4. Baru lanjut ke fitur berikutnya.

## 5. Menyimpan Perubahan (Git)
```bash
git status                 # lihat file yang berubah
git add .                  # pilih semua perubahan
git commit -m "pesan singkat"
git push                   # kirim ke GitHub
```
Aturan commit: satu commit = satu perubahan yang jelas (contoh: "tambah fitur leave pay").

## 6. Troubleshooting Cepat
- Aplikasi tidak jalan → cek `docker compose ps` dan restart `npm run dev`.
- Database tidak tersambung → cek `.env` (DATABASE_URL) dan service `db` sudah `Up (healthy)`.
- Error `401` di API → login ulang (sesi berakhir setelah 30 menit tidak aktif).
- Port bentrok → ganti port di `.env` dan `docker-compose.yml`.
