# DEPLOY.md — Panduan Deploy MARMS ke Railway

> **Penjelasan untuk Pemula:** Ini panduan langkah demi langkah menaruh aplikasi
> MARMS di internet supaya bisa diakses siapa saja lewat browser (dengan gembok HTTPS).
>
> **Kenapa Ini Penting:** Deploy yang benar memastikan aplikasi jalan, aman, dan
> dokumen pelamar (passport, KTP, buku pelaut) tidak hilang.

## Gambaran Besar

MARMS butuh tiga "komponen" saat deploy:

| Komponen | Fungsi | Di Railway |
|---|---|---|
| Aplikasi (Express + React) | Menjalankan app | Service otomatis dari repo |
| Database (PostgreSQL) | Menyimpan data | Plugin "PostgreSQL" |
| Penyimpanan file (uploads/) | Menyimpan dokumen pelamar | Volume (persistent disk) |

Railway otomatis memberi **HTTPS (gembok)** dan alamat web, jadi tidak perlu ribet
mengurus sertifikat.

---

## Struktur & Role (Payung Bisnis)

Aplikasi dibagi menjadi **payung bisnis**, dan tiap akun punya **role** yang
menentukan payung mana yang bisa dibuka:

| Role | Bisa akses |
|---|---|
| `SUPERADMIN` | Semua payung (Crewing + Finance) + menu **Kelola Akun** |
| `CREWING` | Hanya modul Crewing |
| `FINANCE` | Hanya modul Finance |

- Akun admin pertama (dari seed) otomatis jadi `SUPERADMIN`.
- Menu **Kelola Akun** (khusus SUPERADMIN) untuk membuat akun, memilih role, dan
  mengaktifkan/nonaktifkan akun.
- Modul **Finance** saat ini masih **kosong** (scaffold). Men-deploy Crewing dulu
  aman — Finance tidak mengganggu fitur Crewing sama sekali.

---

## Pengembangan Harian (Lokal, Docker saja)

Mulai sekarang aplikasi dijalankan **hanya lewat Docker** (tidak pakai `npm run dev`):

```bash
docker compose up -d --build
```

- `--build` = bangun ulang image (backend + frontend) lalu restart app.
- Data database & file upload **tidak hilang** (tersimpan di volume `pgdata` & `uploads`).
- Jalankan perintah ini **setiap kali ada perubahan kode**.
- `.env` wajib berisi `SESSION_SECRET` dan `ADMIN_PASSWORD` (docker-compose meminta
  keduanya; bila kosong, `docker compose up` akan gagal dengan pesan error).

**Pengecualian — mengubah struktur database:** untuk *membuat* migration baru tetap
pakai prisma CLI di komputer (host), baru setelahnya build Docker:

```bash
npx prisma migrate dev --name <nama_perubahan>   # bikin migration (di host)
docker compose up -d --build                      # terapkan + restart app
```

---

## Langkah Deploy

### 1. Persiapkan repo di GitHub
1. Pastikan semua perubahan sudah di-commit dan di-push ke GitHub.
   - `git add .` → `git commit -m "..."` → `git push`
2. Repo harus berisi `Dockerfile` (sudah ada) — Railway akan membangunnya otomatis.

### 2. Buat project di Railway
1. Buka [railway.com](https://railway.com), daftar/login.
2. Klik **New Project** → **Deploy from GitHub repo** → pilih repo MARMS.
3. Railway membaca `Dockerfile` dan menjalankan `npx prisma migrate deploy && node dist/app.js`
   secara otomatis tiap deploy.

### 3. Tambah Database (PostgreSQL)
1. Di project, klik **+ New** → **Database** → pilih **PostgreSQL**.
2. Railway otomatis membuat database dan menyediakan `DATABASE_URL` lewat environment.

### 4. Tambah Volume (penyimpanan dokumen)
> **PENTING:** Tanpa volume, file dokumen pelamar akan hilang setiap kali app
> restart/dideploy ulang.

1. Klik **+ New** → **Volume**.
2. Pasang volume ke service aplikasi, mount path: `/app/uploads`.

### 5. Isi Environment Variables (di service aplikasi)

| Nama | Nilai | Keterangan |
|---|---|---|
| `DATABASE_URL` | (otomatis dari plugin Postgres) | Jangan diubah |
| `SESSION_SECRET` | string acak panjang | WAJIB, rahasiakan |
| `ADMIN_EMAIL` | `admin@marms.com` | Email admin pertama |
| `ADMIN_PASSWORD` | password kuat | WAJIB, dipakai sekali untuk seed |
| `COOKIE_SECURE` | `true` | Karena Railway sudah HTTPS |
| `CORS_ORIGIN` | (biarkan kosong) | App same-origin, jarang dipakai |
| `NODE_ENV` | (otomatis `production` oleh Railway) | Jangan diubah |

> **Membuat SESSION_SECRET acak:** jalankan di terminal lokal:
> `openssl rand -hex 32`

### 6. Buat Akun Admin (sekali saja)
Migrasi hanya membuat tabel, **tidak** membuat akun admin. Jalankan seed sekali:

```bash
railway run npx prisma db seed
```

(atau lewat menu Railway → **Command** / **Shell**, jalankan `npx prisma db seed`).

Setelah itu login di `https://<domain-mu>/admin/login` dengan email & password admin
yang diisi di langkah 5. Saat login pertama, kamu diminta mengganti password.

### 7. Verifikasi
- Buka `https://<domain-mu>/health` → muncul `{"status":"ok"}`.
- Buka beranda publik → tampil.
- Login admin → berhasil.
- Upload dokumen → lalu buka dokumennya (harus bisa, karena sudah login).

---

## Menjalankan Ulang / Update Sistem

Ada tiga jenis update, dengan langkah berbeda-beda.

### A. Update fitur biasa (tanpa mengubah struktur database)

```bash
# edit kode ...
git add . && git commit -m "pesan" && git push   # Railway otomatis deploy
```

Untuk lokal: `docker compose up -d --build`.

### B. Update yang mengubah struktur database (tambah tabel/kolom)

1. Ubah `prisma/schema.prisma`.
2. Buat migration: `npx prisma migrate dev --name <nama>` → muncul folder baru di `prisma/migrations/`.
3. Commit migration tersebut ke git.
4. Push → Railway menjalankan `prisma migrate deploy` otomatis saat deploy.

### C. Update yang butuh data awal baru (seed)

1. Tambah data di `prisma/seed.ts`.
2. Commit & push.
3. Di produksi, jalankan seed manual (karena `migrate deploy` **tidak** menjalankan seed):
   ```bash
   railway run npx prisma db seed
   ```

### Ringkasan

| Jenis perubahan | Lokal (Docker) | Produksi (Railway) |
|---|---|---|
| Fitur biasa | `docker compose up -d --build` | `git push` (otomatis) |
| Ubah schema | `prisma migrate dev` + build | commit migration + `git push` |
| Data awal baru | build | `railway run npx prisma db seed` |

---

## Alternatif: Deploy ke VPS (lebih murah, kontrol penuh)

Jika suatu saat ingin pindah dari Railway ke server sendiri (VPS):
1. Sewa VPS (Hetzner/Vultr/DigitalOcean), pasang Docker + Docker Compose.
2. `git clone` repo, buat `.env` (isi `SESSION_SECRET`, `ADMIN_PASSWORD`, dst.).
3. Jalankan `docker compose up -d --build`.
4. Pasang HTTPS dengan Caddy di depan app (gembok otomatis dari Let's Encrypt).

---

## Catatan Keamanan Produksi (jangan dilewati)

- `SESSION_SECRET` & `ADMIN_PASSWORD` **wajib** nilai kuat, jangan pakai contoh.
- `COOKIE_SECURE=true` hanya kalau sudah HTTPS (Railway sudah otomatis).
- Volume uploads wajib terpasang agar dokumen tidak hilang.
- Ganti password admin setelah login pertama (aplikasi memaksa ini).
