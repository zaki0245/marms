# AGENTS.md — Panduan untuk Asisten AI di Project MARMS

> **Penjelasan untuk Pemula:** File ini "buku pegangan" untuk AI (termasuk saya) yang bekerja
> di project ini. Isinya cara menjalankan, struktur folder, dan aturan yang harus diikuti.
>
> **Kenapa Ini Penting:** Supaya AI mana pun yang membantu tetap konsisten, tidak merusak
> struktur modul, dan mengikuti konvensi yang sudah disepakati.

## 1. Ringkasan Project
MARMS = aplikasi web internal crewing (rekrutmen, rotasi crew, payroll, leave pay) berbentuk
Modular Monolith. Backend Node.js + Express + TypeScript + Prisma + PostgreSQL.
Frontend React + Vite + Tailwind. Semua kode dalam satu repo, satu container app + satu DB.

## 2. Perintah Utama (jalankan di dalam WSL, folder `~/projects/marms`)
```bash
npm install              # pasang dependency root
cd client && npm install # pasang dependency frontend
npm run dev              # jalankan backend (tsx watch)
cd client && npm run build  # build frontend (hasil di client/dist, disajikan Express)
npx prisma migrate dev --name <nama>  # buat migration untuk perubahan schema
npx prisma migrate reset --force      # reset database + seed ulang
docker compose up -d db               # nyalakan database
```

## 3. Struktur & Konvensi
- Backend per modul di `src/modules/<modul>/`: `master-data`, `recruitment`, `crew-placement`,
  `payroll`, `reports`, `auth`, `leave-pay`. Isi: `controller`, `service`, `routes`, `model`.
- Modul mengekspor fungsi publik lewat `index.ts`; JANGAN akses tabel modul lain langsung
  (kecuali modul baca-saja `reports`).
- Util bersama di `src/shared/`: `prisma`, `AppError`, `asyncHandler`, `session`, `upload`, `masaKerja`.
- Frontend di `client/src/`; halaman di `client/src/pages/`.
- Semua komentar kode dalam Bahasa Indonesia, format:
  `// [FUNGSI] <apa yang dilakukan> | [ALASAN] <kenapa ada di sini>`.
- Schema database di `prisma/schema.prisma`; perubahan struktur WAJIB lewat migration.

## 4. Aturan Penting
- Gaji pokok berasal dari master jabatan, BUKAN kontrak.
- Payroll dipisah jadi dua jenis: `GAJI` dan `UANG_MAKAN`.
- Payroll di-snapshot saat dibuat (nilai gaji/uang makan tersimpan di detail).
- Pembulatan prorata: round half up ke Rupiah terdekat.
- Nomor pendaftaran pelamar: `PLR-YYYY-NNNN`, reset tiap tahun.
- Duplikat pelamar (email ATAU HP sama) ditolak.
- Dokumen expired memblokir penempatan baru; admin bisa perbarui dokumen expired.
- Masa kerja live: bertambah saat crew On Board (lihat `src/shared/masaKerja.ts`).
- Leave pay: tiap kelipatan 180 hari.
- Jangan buat file DevOps (Docker production, K3s, CI/CD, OCI) di fase ini.

## 5. Validasi Sebelum Selesai
- `npx tsc --noEmit` (root) dan `cd client && npx tsc --noEmit` harus sukses.
- `cd client && npm run build` harus sukses.
- Setelah mengubah schema/instal dependency baru, restart `npm run dev`.
- Pastikan tidak menambahkan `.env`, `node_modules`, atau `uploads/` ke git.
