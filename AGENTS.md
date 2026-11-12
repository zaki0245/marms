# AGENTS.md — Panduan untuk Asisten AI di Project MARMS

> **Penjelasan untuk Pemula:** File ini "buku pegangan" untuk AI (termasuk saya) yang bekerja
> di project ini. Isinya cara menjalankan, struktur folder, dan aturan yang harus diikuti.
>
> **Kenapa Ini Penting:** Supaya AI mana pun yang membantu tetap konsisten, tidak merusak
> struktur modul, dan mengikuti konvensi yang sudah disepakati.

## 1. Ringkasan Project
MARMS = aplikasi web internal berbentuk Modular Monolith dengan tiga payung bisnis:
**Crewing** (rekrutmen, rotasi crew, payroll, leave pay), **Finance** (AP/AR: hutang ke
vendor & piutang dari customer, invoice, voucher PV/RV), dan **Operation** (monitoring voyage
tongkang: shipment, laytime, posisi kapal). Backend Node.js + Express + TypeScript
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
  - `finance/`: `vendor`, `customer`, `invoice`, `pv` (voucher PV/RV), `approve` (approval via email), `konfigurasi`, `laporan`.
  - `operation/`: `operation` (shipment/voyage + `laytime.ts` untuk hitung laytime & demurrage).
  - `kapal/`: master kapal (TB + BG) — dipakai lintas payung.
  - `auth/`: login/logout (lintas payung).
  Isi tiap modul: `controller`, `service`, `routes`, `model`.
- Modul mengekspor fungsi publik lewat `index.ts`; JANGAN akses tabel modul lain langsung
  (kecuali modul baca-saja `reports`/`laporan`).
- Util bersama di `src/shared/`: `prisma`, `AppError`, `asyncHandler`, `session`, `authorization`,
  `rateLimit`, `mailer`, `upload`, `masaKerja`, `prorata`, `jabatanOrder`.
- Frontend di `client/src/`; halaman dikelompokkan per payung: `client/src/pages/Crewing/`,
  `client/src/pages/Finance/`, dan `client/src/pages/Operation/` (plus `Kapal`, `Accounts`,
  `Settings`, `Login`, `public`). Komponen bersama di `client/src/components/` (`Layout`,
  `Pagination`, `sortable`, `SearchableSelect`, `MapResizer`, `leafletPin`, `PublicLayout`, `Logo`).
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
- Dokumen expired tidak memblokir penempatan baru; perbarui dokumen expired jadi tanggung jawab crew (admin tetap bisa perbarui).
- Masa kerja live: bertambah saat crew On Board (lihat `src/shared/masaKerja.ts`).
- Leave pay: tiap 180 hari setelah 180 hari pertama (kelayakan mulai 360 hari).
- Finance dibagi dua entitas: **AP** (hutang ke Vendor → voucher **PV**) dan **AR** (piutang dari
  Customer → voucher **RV**). Invoice punya kolom `jenis` (AR/AP).
- Satu voucher (PV/RV) bisa memuat banyak invoice dari satu counterparty.
- Kolom `nominal` di `PvItem` = **DPP yang dibayar** (bukan total); flag `includeTax` menandakan
  voucher itu melunasi PPN/PPH (dibayar sekali, biasanya di pelunasan).
- Status invoice (`BELUM_BAYAR`/`SEBAGIAN`/`LUNAS`) dihitung otomatis dari akumulasi nominal.
- Approval invoice: kirim tautan ke email penerima (SMTP) → penerima klik `/approve/:token` →
  status `SUDAH_DIAPPROVE`. Token di-null-kan setelah disetujui/dibatalkan manual.
  Hanya AP non-Freight dengan `perluApproval = true` yang bisa diajukan; mencentang
  "Perlu Approval" di Input Invoice memunculkan tombol kirim email di Daftar Invoice.
- Operation: status voyage `PLANNED`/`ON_GOING`/`COMPLETED`; peta dashboard hanya mem-pin
  shipment `ON_GOING` yang punya `latitude`/`longitude`. Laytime dihitung di
  `src/modules/operation/laytime.ts` (ada test di `tests/laytime.test.ts`).
- Agen POL/POD memakai master `OperationAgent` yang dipisah per tipe (`POL`/`POD`, unik per
  `(tipe, nama)`) lewat halaman Operation → Data Operation → Agen (tab POL/POD). Saat agen dipilih di form shipment,
  PIC & Contact terisi otomatis tetapi tetap bisa diubah; shipment menyimpan
  `agentPolId`/`agentPodId` + snapshot teks.
- Unit kapal (TB, BG, Owner/Operator, Contact Master) memakai master `OperationKapal` lewat
  halaman Operation → Data Operation → Unit Kapal. Form shipment memilih unit (bisa tambah cepat via `+`), lalu
  keempat field terisi otomatis tetapi tetap bisa diubah; shipment menyimpan `operationKapalId` +
  snapshot teks agar laporan lama utuh.
- Memori field voyage (Shipper, Commodities, POL, POD) berasal dari nilai unik data shipment
  (`GET /api/operation/refs`) dan ditampilkan lewat `MemoryInput` (datalist). Tidak ada tabel master
  untuk field-field ini.
- Tile peta memakai **Geoapify** style `osm-carto` (`https://maps.geoapify.com/v1/tile/...`).
  API key dibaca dari `VITE_GEOAPIFY_API_KEY` (root `.env`, ditanam saat build frontend), dan
  CSP `img-src` di `src/app.ts` hanya mengizinkan `https://maps.geoapify.com`. Attribution wajib:
  "Powered by Geoapify" + "© OpenStreetMap contributors". Jangan kembali ke
  `tile.openstreetmap.org`: server tile sukarela OSM memblokir aplikasi (403 "Access blocked").
  Link peta pada teks WhatsApp memakai tautan pendek **`/peta/<kode>?zoom=<n>`** (route publik
  tanpa login). Server mem-proxy Geoapify Static Maps (`/v1/staticmap`, style `osm-carto`, marker
  posisi) memakai `GEOAPIFY_API_KEY`/`VITE_GEOAPIFY_API_KEY`, jadi API key **tidak** ikut di link
  yang dibagikan. Level zoom dari dropdown halaman Laporan juga dipakai peta pada kartu laporan
  gambar (email). Atribusi sudah tercetak otomatis di gambar.
- Jangan buat file DevOps (Docker production, K3s, CI/CD, OCI) di fase ini.

## 5. Validasi Sebelum Selesai
- `npx tsc --noEmit` (root) dan `cd client && npx tsc --noEmit` harus sukses.
- `cd client && npm run build` harus sukses.
- `npm test` (root) harus sukses — test prorata, masa kerja, laytime.
- Setelah mengubah schema/instal dependency baru, jalankan `docker compose up -d --build`.
- Pastikan tidak menambahkan `.env`, `node_modules`, atau `uploads/` ke git.

## 6. Standar Halaman Daftar
Semua halaman daftar/tabel wajib mengikuti pola halaman **Daftar Invoice**:
- Toolbar di atas tabel: **pencarian** + **filter**.
- **Sorting** semua kolom lewat `SortableTh`, `sortRows`, `useSort` (`client/src/components/sortable.tsx`).
- **Pagination** lewat `Pagination` + `DEFAULT_PAGE_SIZE` (`client/src/components/Pagination.tsx`), termasuk pilihan jumlah per halaman dan tombol Sebelumnya/Berikutnya.
- Reset halaman ke 1 saat pencarian, filter, atau sorting berubah.
- Urutan layout: toolbar filter → tabel (`overflow-x-auto`) → `Pagination`.

> **Penjelasan untuk Pemula:** Ini "resep" halaman daftar. Kalau semua halaman memakai komponen
> yang sama, tampilan dan perilakunya konsisten, dan tidak ada halaman yang lupa pagination.

> **Kenapa Ini Penting:** Tanpa standar ini, tiap halaman daftar punya perilaku berbeda
> (mis. ada search tapi tidak bisa pindah halaman).
