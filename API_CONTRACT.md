# API_CONTRACT.md — Kontrak API MARMS

> **Penjelasan untuk Pemula:** Ini "daftar pintu masuk" — semua endpoint (URL) yang disediakan
> backend, lengkap dengan method dan fungsinya.
>
> **Kenapa Ini Penting:** Supaya frontend dan backend sepakat tentang cara berkomunikasi,
> dan saat menambah fitur kita tahu endpoint apa yang tersedia.

Base URL: `http://localhost:3000/api`

> Semua endpoint `/api/*` dilindungi auth (harus login), KECUALI:
> - `POST /recruitment/pelamar` (pendaftaran publik)
> - `GET /master-data/jabatan` (dropdown posisi di form publik)

## Auth
| Method | Endpoint | Fungsi |
|---|---|---|
| POST | `/auth/login` | Login admin (set sesi) |
| POST | `/auth/logout` | Logout |
| GET | `/auth/me` | Info admin saat ini |
| POST | `/auth/change-password` | Ganti password |

## Master Data
| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/master-data/jabatan` | Daftar jabatan |
| POST | `/master-data/jabatan` | Tambah jabatan |
| PUT | `/master-data/jabatan/:kode` | Ubah jabatan |
| DELETE | `/master-data/jabatan/:kode` | Hapus jabatan |
| GET | `/master-data/pengaturan` | Ambil pengaturan (uang makan) |
| PUT | `/master-data/pengaturan` | Ubah uang makan |
| GET | `/master-data/kapal` | Daftar kapal |
| POST | `/master-data/kapal` | Tambah kapal |
| GET | `/master-data/kapal/:id` | Detail kapal |
| PUT | `/master-data/kapal/:id` | Ubah kapal |
| DELETE | `/master-data/kapal/:id` | Hapus kapal |

## Rekrutmen
| Method | Endpoint | Fungsi |
|---|---|---|
| POST | `/recruitment/pelamar` | Daftar pelamar (publik, multipart) |
| GET | `/recruitment/pelamar` | Daftar pelamar (admin) |
| GET | `/recruitment/pelamar/:id` | Detail pelamar |
| PATCH | `/recruitment/pelamar/:id/status` | Ubah status seleksi |
| POST | `/recruitment/dokumen/:dokumenId/update` | Perbarui dokumen (file + tanggal expired) |
| GET | `/recruitment/stats` | Jumlah pelamar baru |
| GET | `/recruitment/kandidat` | Pelamar Diterima tanpa crew |

## Kru & Penempatan
| Method | Endpoint | Fungsi |
|---|---|---|
| POST | `/crew/assign-applicant/:applicantId` | Assign kandidat ke kapal (buat crew) |
| POST | `/crew/:id/assign` | Assign ulang crew ke kapal |
| POST | `/crew/:id/offboard` | Off board crew |
| PATCH | `/crew/:id/bank` | Ubah info bank crew |
| GET | `/crew` | Daftar crew |
| GET | `/crew/:id` | Detail crew |

## Payroll
| Method | Endpoint | Fungsi |
|---|---|---|
| POST | `/payroll` | Generate draft payroll (jenis GAJI/UANG_MAKAN) |
| GET | `/payroll` | Daftar payroll |
| GET | `/payroll/:id` | Detail payroll |
| POST | `/payroll/:id/finalize` | Finalisasi |
| POST | `/payroll/:id/mark-paid` | Tandai dibayar |
| DELETE | `/payroll/:id` | Hapus draft |

## Laporan
| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/reports/dashboard` | Statistik dashboard |
| GET | `/reports/crew-per-kapal` | Crew per kapal |
| GET | `/reports/dokumen-expired` | Dokumen akan expired |
| GET | `/reports/masa-kerja` | Daftar masa kerja crew |

## Leave Pay
| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/leave-pay` | Daftar kelayakan leave pay |
| GET | `/leave-pay/:crewId/riwayat` | Riwayat pencairan |
| POST | `/leave-pay/:crewId/disburse` | Cairkan leave pay |
