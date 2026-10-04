# ARCHITECTURE — MARMS

> **Penjelasan untuk Pemula:** Ini peta bagaimana kode diatur di dalam project.
> Seperti denah ruangan: mana ruang tamu (frontend), mana gudang (database),
> dan koridor penghubungnya (API). Tujuannya supaya kode rapi dan mudah dicari.
>
> **Kenapa Ini Penting:** Project besar jadi kacau kalau tidak ada struktur jelas.
> Arsitektur "Modular Monolith" memisahkan kode per modul (Rekrutmen, Payroll, dst)
> tapi tetap satu aplikasi, sehingga mudah dipahami dan tidak rumit di-deploy.

## 1. Konsep: Modular Monolith
- **HANYA 1 codebase, 1 Dockerfile app, 1 container utama + 1 container database (+ Adminer opsional).**
- Di dalam `src/modules/`, kode dipisah rapi per modul.
- Setiap modul punya file sendiri: `controller`, `service`, `routes`, `model`.
- Komunikasi antar modul HANYA lewat **fungsi yang diekspor (public API modul)**.
- Modul TIDAK boleh langsung akses database/tabel milik modul lain (kecuali modul baca-saja/agregasi seperti `reports`).

## 2. Tech Stack (Diputuskan)
| Lapisan | Teknologi |
|---|---|
| Bahasa | TypeScript (backend + frontend) |
| Backend | Node.js 20 + Express 4 |
| ORM + DB | Prisma 6 + PostgreSQL 16 |
| Validasi | Zod |
| Auth | express-session + bcryptjs |
| Upload | multer 2 (simpan di folder `uploads/`) |
| Frontend | React 18 + Vite 5 + Tailwind CSS 3.4 |
| Routing UI | react-router-dom 6 |
| HTTP client | axios |
| Export | xlsx (Excel) + jsPDF/autotable (PDF) — di sisi frontend |

## 3. Struktur Folder
```
marms/
├── docker-compose.yml      # db + app + adminer
├── Dockerfile              # multi-stage (frontend → backend → runtime non-root)
├── prisma/
│   ├── schema.prisma       # definisi semua tabel
│   ├── migrations/         # riwayat perubahan database
│   └── seed.ts             # data awal (8 jabatan, uang makan, admin)
├── src/
│   ├── modules/
│   │   ├── master-data/    # Jabatan, Kapal, Pengaturan (uang makan)
│   │   ├── recruitment/    # pendaftaran & seleksi pelamar
│   │   ├── crew-placement/ # assign, off board, info bank
│   │   ├── payroll/        # gaji & uang makan prorata
│   │   ├── reports/        # dashboard & laporan (baca-saja)
│   │   ├── leave-pay/      # kelayakan & pencairan leave pay
│   │   └── auth/           # login, logout, ganti password
│   ├── shared/             # prisma, AppError, asyncHandler, session, upload, masaKerja
│   ├── types/              # deklarasi tipe express-session
│   └── app.ts              # titik masuk backend
├── client/
│   ├── src/api/client.ts   # instance axios + format Rupiah
│   ├── src/components/     # Layout (sidebar + auth), Logo
│   ├── src/constants.ts    # daftar 21 dokumen
│   ├── src/pages/          # Dashboard, MasterData, Recruitment, Crew, Payroll, Reports, Settings, Login, public/
│   └── src/utils/export.ts # export Excel/PDF
├── uploads/                # dokumen pelamar (Docker volume)
└── docs/                   # dokumentasi
```

## 4. Aturan Modul (Public API)
Setiap modul mengekspor satu `index.ts` berisi fungsi-fungsi publik.
Modul lain memanggil fungsi itu, BUKAN membaca tabel modul lain langsung.

### Contoh SALAH ❌
```ts
// payroll.service.ts — LANGSUNG baca tabel Crew milik modul lain
const crews = await prisma.crew.findMany({ where: { status: 'ON_BOARD' } });
```

### Contoh BENAR ✅
```ts
// recruitment/index.ts — modul Rekrutmen mengekspor fungsi publik
export { getApplicantWithDocuments } from './recruitment.service';

// crew-placement.service.ts — modul Kru memanggil public API modul Rekrutmen
import { getApplicantWithDocuments } from '../recruitment';
const pelamar = await getApplicantWithDocuments(applicantId);
```

**Kenapa:** Kalau suatu saat struktur tabel berubah, cukup ubah di dalam modul pemiliknya.
Modul pemakai tidak ikut rusak, karena hanya tahu fungsi yang dipanggil.

## 5. Alur Request
```
Browser (React)  →  HTTP request  →  Express routes  →  controller  →  service
   →  Prisma  →  PostgreSQL
Browser (React)  ←  HTTP response (JSON)  ←  controller  ←  service
```

## 6. Database & Snapshot
- PostgreSQL untuk presisi angka & transaksi.
- Saat payroll dibuat, nilai gaji pokok/uang makan disalin ke detail (snapshot).
  Perubahan master jabatan/pengaturan NANTI tidak mengubah payroll lama.

## 7. Autentikasi & Upload
- Sesi login pakai `express-session` (cookie httpOnly, auto-logout 30 menit tidak aktif, `rolling`).
- Route auth dipasang sebelum proteksi; semua endpoint `/api/*` dilindungi middleware auth,
  kecuali whitelist publik: `POST /api/recruitment/pelamar` dan `GET /api/master-data/jabatan`.
- File dokumen disimpan di `uploads/`, nama file acak (UUID), max 5 MB, PDF/JPG/PNG.
  Dokumen bersifat opsional; sebagian punya tanggal expired; admin bisa memperbarui dokumen expired.

## 8. Penyajian Frontend & Health Check
- Express menyajikan hasil build frontend (`client/dist`) sebagai file statis + SPA fallback
  (`app.get('*')` mengembalikan `index.html` untuk route non-`/api`).
- Endpoint `/health` mengembalikan `{"status":"ok"}` untuk HEALTHCHECK Docker.
- Dokumen pelamar disajikan via `/uploads/...`.

## 9. Catatan Keamanan (diketahui, belum diubah)
- Rate limiting login bersifat in-memory (reset saat restart) — cukup untuk V1.
- `cors()` terbuka untuk semua origin (belum di-allowlist).
- `/uploads/*` dapat diakses tanpa login (nama file UUID acak).
- `SESSION_SECRET` punya fallback `dev-secret`; wajib di-set di produksi.

