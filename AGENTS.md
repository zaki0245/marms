# AGENTS.md — Panduan untuk Asisten AI di Project MARMS

> **Penjelasan untuk Pemula:** File ini "buku pegangan" untuk AI (termasuk saya) yang bekerja
> di project ini. Isinya cara menjalankan, struktur folder, dan aturan yang harus diikuti.
>
> **Kenapa Ini Penting:** Supaya AI mana pun yang membantu tetap konsisten, tidak merusak
> struktur modul, dan mengikuti konvensi yang sudah disepakati.

## 1. Ringkasan Project
MARMS = aplikasi web internal berbentuk Modular Monolith dengan dua payung bisnis:
**Crewing** (rekrutmen, rotasi crew, payroll, leave pay) dan **Finance** (AP/AR: hutang ke
vendor & piutang dari customer, invoice, voucher PV/RV). Backend Node.js + Express + TypeScript
+ Prisma + PostgreSQL. Frontend React + Vite + Tailwind. Semua kode satu repo, satu container
app + satu DB.

## 2. Perintah Utama (jalankan di dalam WSL, folder `~/projects/marms`)
```bash
npm install              # pasang dependency root (sekali saat setup)
cd client && npm install # pasang dependency frontend (sekali saat setup)
docker compose up -d --build  # jalankan app (backend + frontend + DB) via Docker
npx prisma migrate dev --name <nama>  # buat migration untuk perubahan schema (di host)
npx prisma migrate reset --force      # reset database + seed ulang
```

> Aplikasi dijalankan **hanya lewat Docker** (`docker compose up -d --build`), bukan
> `npm run dev`. Prisma CLI tetap dipakai di host hanya untuk **membuat migration**.

## 3. Struktur & Konvensi
- Backend per payung bisnis di `src/modules/<payung>/`:
  - `crewing/`: `master-data`, `recruitment`, `crew-placement`, `payroll`, `reports`, `leave-pay`.
  - `finance/`: `vendor`, `customer`, `invoice`, `pv` (voucher PV/RV), `konfigurasi`, `laporan`.
  - `auth/`: login/logout (lintas payung).
  Isi tiap modul: `controller`, `service`, `routes`, `model`.
- Modul mengekspor fungsi publik lewat `index.ts`; JANGAN akses tabel modul lain langsung
  (kecuali modul baca-saja `reports`/`laporan`).
- Util bersama di `src/shared/`: `prisma`, `AppError`, `asyncHandler`, `session`, `upload`, `masaKerja`.
- Frontend di `client/src/`; halaman dikelompokkan per payung: `client/src/pages/Crewing/` dan
  `client/src/pages/Finance/` (plus `Accounts`, `Settings`, `Login`, `public`).
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
- Leave pay: tiap 180 hari setelah 180 hari pertama (kelayakan mulai 360 hari).
- Finance dibagi dua entitas: **AP** (hutang ke Vendor → voucher **PV**) dan **AR** (piutang dari
  Customer → voucher **RV**). Invoice punya kolom `jenis` (AR/AP).
- Satu voucher (PV/RV) bisa memuat banyak invoice dari satu counterparty.
- Kolom `nominal` di `PvItem` = **DPP yang dibayar** (bukan total); flag `includeTax` menandakan
  voucher itu melunasi PPN/PPH (dibayar sekali, biasanya di pelunasan).
- Status invoice (`BELUM_BAYAR`/`SEBAGIAN`/`LUNAS`) dihitung otomatis dari akumulasi nominal.
- Jangan buat file DevOps (Docker production, K3s, CI/CD, OCI) di fase ini.

## 5. Validasi Sebelum Selesai
- `npx tsc --noEmit` (root) dan `cd client && npx tsc --noEmit` harus sukses.
- `cd client && npm run build` harus sukses.
- Setelah mengubah schema/instal dependency baru, jalankan `docker compose up -d --build`.
- Pastikan tidak menambahkan `.env`, `node_modules`, atau `uploads/` ke git.
