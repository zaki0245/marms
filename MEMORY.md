# MEMORY.md — Catatan Penting & Keputusan Project

> **Penjelasan untuk Pemula:** Ini "buku catatan" berisi keputusan penting dan hal-hal yang
> mudah dilupakan selama membangun project. Dibaca ulang supaya kita tidak lupa konteks.
>
> **Kenapa Ini Penting:** Project panjang (berbulan-bulan). Tanpa catatan, kita bisa lupa
> kenapa suatu keputusan diambil, lalu mengulang diskusi yang sama.

## Keputusan Teknis
- Stack: Node.js + Express + TypeScript + Prisma + PostgreSQL + React/Vite/Tailwind.
- Arsitektur: Modular Monolith (1 app + 1 DB), modul hanya lewat public API.
- Password di-hash dengan bcrypt; sesi express-session dengan auto-logout 30 menit.
- Upload dokumen: multer → folder `uploads/`, nama file UUID, max 5MB, PDF/JPG/PNG.
- Export Excel/PDF: xlsx + jsPDF/autotable (frontend).

## Keputusan Bisnis (hasil iterasi dengan user)
- 1 akun admin full access (V1), multi-role di V2.
- Pelamar publik tanpa login, tanpa cek status, tanpa nomor lamaran setelah daftar.
- Dokumen pelamar: **20 dokumen, opsional**; sebagian punya tanggal expired (diisi pelamar).
  Admin bisa perbarui dokumen expired (file baru + tanggal expired).
- Status pelamar: Baru, Verifikasi, Wawancara, Diterima, Ditolak (5 status).
- Kapal: hanya status Aktif/Docking; **tanpa minimum manning** (aturan tetap: semua 1,
  kecuali Juru Minyak & Juru Mudi = 2).
- Alasan off board: hanya Relief & End of Contract.
- Payroll **dipisah** jadi "Payroll" (gaji) & "Uang Makan" (uang makan), satu menu "Payroll & Uang Makan".
- Masa kerja **live**: bertambah hanya saat crew On Board.
- Leave pay: tiap kelipatan 180 hari; admin input nominal + tanggal pencairan.
- Gaji dari master jabatan, bukan kontrak; uang makan ikut prorata.
- Pembulatan round half up ke Rupiah terdekat.

## Catatan Data Sensitif
- Data berisi: identitas, dokumen, no rekening, gaji → validasi ketat & tidak di-commit ke git.

## Catatan Lingkungan
- Dev di WSL2 Ubuntu, folder `~/projects/marms` (JANGAN di `/mnt/c/`).
- Akses dari browser Windows via `http://localhost:3000`.
- Perintah wajib Linux/Bash, bukan PowerShell/CMD.

## Hal yang Sering Terlupa
- Jangan commit `.env`, `node_modules`, `uploads/`.
- Perubahan skema DB wajib lewat migration (`npx prisma migrate dev --name <nama>`).
- Setelah ganti struktur database, restart `npm run dev` (agar Prisma client dimuat ulang).
- Akun admin awal: `admin@marms.com` / `Admin123!` (wajib ganti saat login pertama).

## Status Terakhir
- **Semua 6 submodul Crewing + Pengaturan selesai dan berjalan di lokal.**
- Termasuk: auth/login, leave pay, export Excel/PDF, perbarui dokumen expired.
- Berikutnya: validasi lokal menyeluruh (cek CHECKLIST_LOCAL) lalu push ke GitHub.
- DevOps (Docker production, K3s, CI/CD, OCI): DITUNDA.
