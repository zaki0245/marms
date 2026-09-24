# SKILL.md — Keterampilan & Pola yang Dipakai

> **Penjelasan untuk Pemula:** Ini "kamus keterampilan" — daftar teknik dan pola yang dipakai
> berulang di project ini, lengkap dengan cara pakainya.
>
> **Kenapa Ini Penting:** Supaya setiap fitur dibuat dengan cara yang sama dan benar,
> tidak ada dua fitur serupa yang dibuat dengan cara berbeda-beda.

## 1. Skill: Membuat Modul Baru (Modular Monolith)
1. Buat folder `src/modules/<nama>/`.
2. Buat 4 file: `<nama>.model.ts`, `<nama>.service.ts`, `<nama>.controller.ts`, `<nama>.routes.ts`.
3. Buat `index.ts` yang mengekspor routes/fungsi publik.
4. Daftarkan routes di `src/app.ts` (prefix `/api/<nama>`).
5. Jika perlu tabel baru: tambah di `prisma/schema.prisma` → `npx prisma migrate dev --name <nama>`.

## 2. Skill: Public API Modul
- `index.ts` hanya mengekspor fungsi publik; detail internal tidak diekspor.
- Modul lain memanggil fungsi dari `index.ts`, TIDAK import langsung ke `.service.ts`/`.model.ts` modul lain.
- Contoh: `crew-placement` memanggil `getApplicantWithDocuments` dari modul `recruitment`.

## 3. Skill: Validasi Input
- Semua input endpoint divalidasi dengan `zod` (di file `*.model.ts`).
- Contoh: email format valid, tanggal valid, nominal angka positif.

## 4. Skill: Snapshot Payroll
- Saat payroll dibuat (generate), nilai gaji pokok & uang makan disalin ke kolom detail.
- Perubahan master jabatan/pengaturan NANTI tidak mengubah payroll yang sudah dibuat.

## 5. Skill: Pembulatan Rupiah
- `Math.round()` (round half up) dipakai untuk gaji prorata & uang makan prorata.

## 6. Skill: Nomor Otomatis
- `PLR-YYYY-NNNN` (pelamar) dan `CTK-YYYY-NNNN` (kontrak): ambil nomor terakhir tahun itu, +1, pad 4 digit.

## 7. Skill: Masa Kerja Live
- Helper `liveMasaKerja` di `src/shared/masaKerja.ts`: total segmen tertutup + hari segmen yang masih On Board.
- Dipakai di crew-placement & reports.

## 8. Skill: Leave Pay
- Berhak = `floor(masaKerja / 180)`; sisa = berhak − dibayar.
- Cairkan: catat ke `LeavePayDisbursement` (nominal + tanggal manual), lalu `jumlahLeavePay + 1`.

## 9. Skill: Penanganan Error
- Error bisnis → lempar `AppError(status, pesan)`; error handler global di `app.ts` mengubahnya jadi JSON.
- Error tak terduga → pesan umum "Terjadi kesalahan", detail di log server.

## 10. Skill: Keamanan Auth
- Middleware auth di `app.ts` melindungi semua `/api/*` kecuali whitelist publik.
- Rate limit login (5x salah → 15 menit) ada di `auth.service.ts`.
