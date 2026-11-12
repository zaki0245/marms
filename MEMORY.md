# MEMORY.md — Catatan Penting & Keputusan Project

> **Penjelasan untuk Pemula:** Ini "buku catatan" berisi keputusan penting dan hal-hal yang
> mudah dilupakan selama membangun project. Dibaca ulang supaya kita tidak lupa konteks.
>
> **Kenapa Ini Penting:** Project panjang (berbulan-bulan). Tanpa catatan, kita bisa lupa
> kenapa suatu keputusan diambil, lalu mengulang diskusi yang sama.

> **📌 Dokumentasi di-rebuild pada 4 Oktober 2026 dan disinkronkan ulang pada 11 November 2026
> karena divergensi dengan kode.** Sebagian besar dokumen lama sudah tidak sinkron dengan
> implementasi aktual di `src/` dan `client/src/`. Catatan di bawah sudah disesuaikan dengan
> kode yang berjalan saat ini.

## Keputusan Teknis
- Stack: Node.js 20 + Express 4 + TypeScript + Prisma 6 + PostgreSQL 16 + React 18/Vite 5/Tailwind 3.4.
- Arsitektur: Modular Monolith (1 app + 1 DB), modul hanya lewat public API (`index.ts`).
- Password di-hash dengan **bcryptjs** (10 round); sesi express-session auto-logout 30 menit tidak aktif (`rolling`).
- Multi-role sejak awal implementasi: `SUPERADMIN`, `CREWING`, `FINANCE`, `OPERATION`; role & status
  aktif dibaca dari DB tiap request (perubahan langsung berlaku).
- Rate limiting in-memory (`src/shared/rateLimit.ts`): login 5x salah per email → 15 menit;
  pendaftaran pelamar 20x per IP → 15 menit.
- Upload dokumen: multer 2 → folder `uploads/`, nama file UUID, max 5MB, PDF/JPG/PNG.
- Export Excel/PDF: xlsx + jsPDF/jspdf-autotable (di sisi frontend, `client/src/utils/export.ts`).
- Validasi input backend memakai **zod**.
- Peta: Leaflet + react-leaflet, tile **Geoapify** style `osm-carto`. API key dari
  `VITE_GEOAPIFY_API_KEY` (root `.env`, diteruskan sebagai build arg Docker). Sebelumnya memakai
  tile OSM lalu CARTO; OSM memblokir aplikasi (403 "Access blocked"), CARTO tidak butuh key tetapi
  ToS gratisnya non-komersial.
- Header keamanan `helmet` dengan CSP; `img-src` hanya `'self'`, `data:`, dan `https://maps.geoapify.com`.
- Dockerfile multi-stage (build frontend → build backend → runtime non-root) + HEALTHCHECK `/health`.
- docker-compose menjalankan 3 service: `db` (PostgreSQL 16), `app`, `adminer` (kelola DB di `:8080`).
- Test: `npm test` (`node:test` via tsx) untuk `tests/prorata.test.ts`, `masaKerja.test.ts`, `laytime.test.ts`.

## Keputusan Bisnis (hasil iterasi dengan user)
- Akun admin dengan 4 role: `SUPERADMIN` (semua payung + Kelola Akun), `CREWING`, `FINANCE`, `OPERATION`.
- Pelamar publik tanpa login, tanpa cek status, tanpa nomor lamaran setelah daftar.
- Dokumen pelamar: **21 dokumen, opsional** (14 ber-expired, 7 tanpa expired); sebagian punya tanggal
  expired yang diisi pelamar. Admin bisa perbarui dokumen expired (file baru + tanggal expired).
- Status pelamar: Baru, Verifikasi, Wawancara, Diterima, Ditolak (5 status).
- Kapal: status `AKTIF`/`DOCKING`/`TIDAK_AKTIF` + skema `MILIK`/`SEWA`; **tanpa minimum manning**
  (aturan tetap: semua 1, kecuali Juru Minyak & Juru Mudi = 2). *(Aturan manning belum dikoding.)*
- Alasan off board: Relief, Cuti, Sakit, Habis Kontrak.
- Payroll **dipisah** jadi "Payroll" (gaji) & "Uang Makan", satu menu "Payroll & Uang Makan".
- Masa kerja **live**: bertambah hanya saat crew On Board (`src/shared/masaKerja.ts`).
- Leave pay: tiap kelipatan 180 hari; admin input nominal + tanggal pencairan; tersimpan riwayat.
- Gaji dari master jabatan, bukan kontrak; uang makan ikut prorata.
- Pembulatan round half up ke Rupiah terdekat.
- Info bank crew (nama bank, no rekening) bisa diedit admin saat assign maupun via menu Crew.
- **Finance (AP/AR):** dibagi dua entitas — AP (hutang ke Vendor → voucher PV) & AR (piutang dari
  Customer → voucher RV). Invoice punya kolom `jenis` (AR/AP). Satu voucher bisa memuat banyak
  invoice dari satu counterparty. `PvItem.nominal` = DPP yang dibayar; flag `includeTax` menandakan
  voucher melunasi PPN/PPH (dibayar sekali, biasanya di pelunasan). Invoice DP tidak membawa
  PPN/PPH. Status invoice (`BELUM_BAYAR/SEBAGIAN/LUNAS`) otomatis dari akumulasi nominal.
- Cetak voucher: PDF meniru template PVN (logo, terbilang, tabel invoice, bank, tanda tangan);
  judul/label menyesuaikan jenis (`PAYMENT VOUCHER` vs `RECEIPT VOUCHER`).
- Approval invoice: admin kirim tautan approval ke email penerima (SMTP). Penerima membuka
  `/approve/:token` tanpa login → status `SUDAH_DIAPPROVE` + `approvedAt`. Token hangus setelah dipakai.
  Tombol kirim hanya ada bila `perluApproval = true` (AP non-Freight); diatur lewat checkbox
  "Perlu Approval" pada Input Invoice.
- **Operation:** satu shipment = satu voyage tongkang (TB + BG) dengan jadwal kegiatan POL/POD,
  laytime & demurrage/despatch, posisi terakhir (koordinat + teks), dokumen pendukung, dan status
  `PLANNED`/`ON_GOING`/`COMPLETED`. Dashboard peta hanya menampilkan shipment `ON_GOING`.
- Field voyage yang berulang (Shipper, Commodities, POL, POD) punya memori dari data shipment
  sebelumnya (`GET /api/operation/refs`), bukan tabel master.
- Unit kapal (TB, BG, Owner/Operator, Contact Master) adalah master `OperationKapal` (unik per
  `(tb, bg)`) di halaman Operation → Unit Kapal. Memilih unit mengisi keempat field otomatis;
  shipment tetap menyimpan snapshot teks + FK `operationKapalId` (FK jadi null bila unit dihapus).
- Agen POL/POD adalah master `OperationAgent` yang **dipisah per tipe** (`POL`/`POD`, unik per
  `(tipe, nama)`), lengkap dengan PIC & kontak. Halaman Agen memakai tab POL/POD; memilih agen
  mengisi PIC/kontak otomatis. Shipment tetap menyimpan snapshot teks + FK
  `agentPolId`/`agentPodId` (FK jadi null bila agen dihapus).

## Catatan Data Sensitif
- Data berisi: identitas, dokumen, no rekening, gaji → validasi ketat & tidak di-commit ke git.
- File dokumen disimpan di `uploads/` (di-gitignore, di Docker jadi volume).

## Catatan Lingkungan
- Dev di WSL2 Ubuntu, folder `~/projects/marms` (JANGAN di `/mnt/c/`).
- Akses dari browser Windows via `http://localhost:3000`.
- Perintah wajib Linux/Bash, bukan PowerShell/CMD.

## Hal yang Sering Terlupa
- Jangan commit `.env`, `node_modules`, `uploads/`.
- Perubahan skema DB wajib lewat migration (`npx prisma migrate dev --name <nama>`).
- Setelah ganti struktur database, jalankan `docker compose up -d --build` (agar Prisma client dimuat ulang).
- Akun admin awal: `admin@marms.com` / `Admin123!` (wajib ganti saat login pertama).

## Catatan Keamanan
- Rate limiting bersifat **in-memory** → hilang saat server restart (cukup untuk V1 lokal).
- `cors()` dibatasi ke `CORS_ORIGIN` + `credentials: true` (bukan wildcard).
- Dokumen di `/uploads/*` **wajib login**; nama file divalidasi regex UUID + ekstensi.
- `SESSION_SECRET` wajib di produksi (app menolak start bila kosong); fallback `dev-secret` hanya di dev.
- `helmet` CSP membatasi `img-src` ke `'self'`, `data:`, dan `https://maps.geoapify.com`.
- Peta Leaflet diberi `isolation: isolate` agar pane (z-index 400–1000) tidak menimpa sidebar/modal di HP.

## Status Terakhir
- **Crewing + Leave Pay + Pengaturan + Finance (AP/AR) selesai dan berjalan di lokal.**
- **Operation selesai:** Shipment (jadwal, laytime, posisi, dokumen), Dashboard peta, Laporan voyage, role OPERATION.
- Termasuk: auth multi-role, kelola akun, approval invoice via email, leave pay, export Excel/PDF,
  perbarui dokumen expired, info bank.
- Sea Service Record dibuat otomatis saat off board; alasan off board 4 (Relief/Cuti/Sakit/Habis Kontrak).
- Test sudah ada (`npm test`): prorata, masa kerja live, laytime.
- Perbaikan mobile: drawer sidebar tidak lagi tertimpa peta; tile peta pindah ke Geoapify.
- Berikutnya: validasi lokal menyeluruh (termasuk di HP) sebelum deploy.
- DevOps (Docker production, K3s, CI/CD, OCI): DITUNDA.
