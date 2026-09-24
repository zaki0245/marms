# RBAC.md — Hak Akses (Role-Based Access Control)

> **Penjelasan untuk Pemula:** Ini aturan "siapa boleh apa" — siapa yang bisa login, apa yang
> bisa mereka lihat dan lakukan.
>
> **Kenapa Ini Penting:** Supaya data sensitif (identitas, gaji, rekening) hanya bisa diakses
> orang yang berwenang.

## Role di V1 (Sederhana)

| Role | Login? | Hak Akses |
|---|---|---|
| **Pelamar (publik)** | TIDAK | Hanya isi form pendaftaran + upload dokumen. Tidak bisa login/cek status. |
| **Admin** | YA (1 akun) | Full access semua modul. |

## Catatan
- **Multi-role (HR, Ops, Payroll, Manajemen) DITUNDA ke V2.**
- V1 cukup 1 admin untuk menyederhanakan.

## Cara Kerja Otorisasi
- Backend memakai middleware auth yang melindungi semua endpoint `/api/*`.
- Whitelist publik (tanpa login):
  - `POST /api/recruitment/pelamar` — pendaftaran pelamar.
  - `GET /api/master-data/jabatan` — dropdown posisi di form publik.
- Sesi admin memakai `express-session` (cookie httpOnly, auto-logout 30 menit).
- Semua halaman admin (`/admin/*`) di frontend juga dicek login; jika belum login, diarahkan ke `/admin/login`.

## Reset Password Admin
- Reset dilakukan **manual via database** (lihat `SECURITY.md`).
- Tidak ada halaman "lupa password" di V1.

## Rencana V2 (jika dibutuhkan)
- Role: HR (rekrutmen), Ops (rotasi crew), Payroll (gaji), Manajemen (read-only/laporan).
- Setiap role diberi akses modul tertentu.
