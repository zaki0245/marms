# MEMORY.md — Catatan Penting & Keputusan Project

> **Penjelasan untuk Pemula:** Ini "buku catatan" berisi keputusan penting dan hal-hal yang
> mudah dilupakan selama membangun project. Dibaca ulang supaya kita tidak lupa konteks.
>
> **Kenapa Ini Penting:** Project panjang (berbulan-bulan). Tanpa catatan, kita bisa lupa
> kenapa suatu keputusan diambil, lalu mengulang diskusi yang sama.

> **📌 Dokumentasi di-rebuild pada 4 Oktober 2026 karena divergensi dengan kode.**
> Sebagian besar dokumen lama sudah tidak sinkron dengan implementasi aktual di `src/` dan
> `client/src/`. Catatan di bawah sudah disesuaikan dengan kode yang berjalan saat ini.

## Keputusan Teknis
- Stack: Node.js 20 + Express 4 + TypeScript + Prisma 6 + PostgreSQL 16 + React 18/Vite 5/Tailwind 3.4.
- Arsitektur: Modular Monolith (1 app + 1 DB), modul hanya lewat public API (`index.ts`).
- Password di-hash dengan **bcryptjs** (10 round); sesi express-session auto-logout 30 menit tidak aktif (`rolling`).
- Rate limiting login: 5x salah → terkunci 15 menit (in-memory `Map`, reset saat restart).
- Upload dokumen: multer 2 → folder `uploads/`, nama file UUID, max 5MB, PDF/JPG/PNG.
- Export Excel/PDF: xlsx + jsPDF/jspdf-autotable (di sisi frontend, `client/src/utils/export.ts`).
- Validasi input backend memakai **zod**.
- Dockerfile multi-stage (build frontend → build backend → runtime non-root) + HEALTHCHECK `/health`.
- docker-compose menjalankan 3 service: `db` (PostgreSQL 16), `app`, `adminer` (kelola DB di `:8080`).

## Keputusan Bisnis (hasil iterasi dengan user)
- 1 akun admin full access (V1), multi-role di V2.
- Pelamar publik tanpa login, tanpa cek status, tanpa nomor lamaran setelah daftar.
- Dokumen pelamar: **21 dokumen, opsional** (14 ber-expired, 7 tanpa expired); sebagian punya tanggal
  expired yang diisi pelamar. Admin bisa perbarui dokumen expired (file baru + tanggal expired).
- Status pelamar: Baru, Verifikasi, Wawancara, Diterima, Ditolak (5 status).
- Kapal: hanya status Aktif/Docking; **tanpa minimum manning** (aturan tetap: semua 1,
  kecuali Juru Minyak & Juru Mudi = 2). *(Belum dikoding — baru catatan bisnis.)*
- Alasan off board: Relief, Cuti, Sakit, Habis Kontrak.
- Payroll **dipisah** jadi "Payroll" (gaji) & "Uang Makan", satu menu "Payroll & Uang Makan".
- Masa kerja **live**: bertambah hanya saat crew On Board (`src/shared/masaKerja.ts`).
- Leave pay: tiap kelipatan 180 hari; admin input nominal + tanggal pencairan; tersimpan riwayat.
- Gaji dari master jabatan, bukan kontrak; uang makan ikut prorata.
- Pembulatan round half up ke Rupiah terdekat.
- Info bank crew (nama bank, no rekening) bisa diedit admin saat assign maupun via menu Crew.

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

## Catatan Keamanan (diketahui, belum diubah)
- Rate limiting login bersifat **in-memory** → hilang saat server restart (cukup untuk V1 lokal).
- `cors()` terbuka untuk semua origin (belum di-allowlist).
- Dokumen di `/uploads/*` dapat diakses publik tanpa login (nama file acak UUID, tanpa autentikasi).
- `SESSION_SECRET` punya fallback `dev-secret` bila env tidak di-set (wajib di-set di produksi).

## Status Terakhir
- **Semua submodul Crewing + Leave Pay + Pengaturan selesai dan berjalan di lokal.**
- Termasuk: auth/login, leave pay, export Excel/PDF, perbarui dokumen expired, info bank.
- Sea Service Record kini dibuat otomatis saat off board; alasan off board ada 4 (Relief/Cuti/Sakit/Habis Kontrak).
- Test minimal sudah ada (`npm test`): prorata & masa kerja live.
- Berikutnya: validasi lokal menyeluruh lalu push ke GitHub.
- DevOps (Docker production, K3s, CI/CD, OCI): DITUNDA.
