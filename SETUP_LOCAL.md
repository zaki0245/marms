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

## Cara Menjalankan (Docker saja)

MARMS dijalankan **hanya lewat Docker** (`docker compose up -d --build`), bukan
`npm run dev`. Prisma CLI di host hanya dipakai untuk membuat migration.

### 1. Masuk Folder Project
```bash
cd ~/projects/marms
```

### 2. Salin Konfigurasi
```bash
cp .env.example .env
# edit .env: isi SESSION_SECRET & ADMIN_PASSWORD (wajib, keduanya diminta docker-compose)
```

### 3. Install Dependency (root + frontend) — sekali
```bash
npm install              # dependency backend (otomatis prisma generate lewat postinstall)
cd client && npm install # dependency frontend
cd ..
```

### 4. Buat Tabel & Isi Data Awal (sekali, saat database baru)
```bash
docker compose up -d db
npx prisma migrate dev --name init   # buat tabel (sekali saat pertama)
npm run db:seed                      # isi 8 jabatan, uang makan, akun admin
```

### 5. Jalankan Aplikasi
```bash
docker compose up -d --build
```
Tunggu service `app` berstatus `Up (healthy)`, lalu buka browser.

Service yang jalan:
| Service | Port | Keterangan |
|---|---|---|
| `app` | `3000` | Aplikasi MARMS (API + frontend) |
| `db` | `5432` | PostgreSQL 16 |
| `adminer` | `8080` | Kelola database lewat browser |

> Aplikasi menjalankan `npx prisma migrate deploy` otomatis saat container start,
> lalu `node dist/app.js`. Volume `pgdata` menyimpan data DB dan `uploads` menyimpan dokumen.

### Catatan Penting Fix Dockerfile
Agar build Docker tidak gagal, urutan di `Dockerfile` wajib:
1. `COPY package*.json ./` **lalu**
2. `COPY prisma ./prisma` **sebelum** `RUN npm ci` — karena `postinstall` menjalankan
   `prisma generate` yang butuh `prisma/schema.prisma`.
3. `COPY tsconfig.json ./` **sebelum** `RUN npm run build` — karena `tsc` butuh file tsconfig.

Tanpa urutan ini, `npm ci` akan gagal (prisma generate tidak menemukan schema) dan
`npm run build` akan error karena tsconfig belum disalin.

---

## 8. Akses dari Browser Windows
- Beranda publik (rekrutmen): `http://localhost:3000`
- Login admin: `http://localhost:3000/admin/login`
- Adminer: `http://localhost:8080`
- Akun admin awal: `admin@marms.com` / `Admin123!` (wajib ganti saat login pertama)

## 9. Verifikasi Cepat
- `docker compose ps` → service `db` status `Up (healthy)`.
- Buka `http://localhost:3000/health` → `{"status":"ok"}`.
- Buka `http://localhost:3000` → beranda publik tampil.

## 10. Jika Error
- Cek log: `docker compose logs db` (atau `docker compose logs app`).
- Port bentrok → ubah port di `.env` dan `docker-compose.yml`.
- Setelah mengubah schema/instal dependency, jalankan `docker compose up -d --build`.
- Error `401` di API → login ulang (sesi berakhir).
- Reset data dari nol: `npx prisma migrate reset --force` (membuat ulang DB + seed).
