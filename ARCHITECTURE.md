# ARCHITECTURE — MARMS

> **Penjelasan untuk Pemula:** Ini peta bagaimana kode diatur di dalam project.
> Seperti denah ruangan: mana ruang tamu (frontend), mana gudang (database),
> dan koridor penghubungnya (API). Tujuannya supaya kode rapi dan mudah dicari.
>
> **Kenapa Ini Penting:** Project besar jadi kacau kalau tidak ada struktur jelas.
> Arsitektur "Modular Monolith" memisahkan kode per modul (Rekrutmen, Payroll, dst)
> tapi tetap satu aplikasi, sehingga mudah dipahami dan tidak rumit di-deploy.

## 1. Konsep: Modular Monolith
- **HANYA 1 codebase, 1 Dockerfile app, 1 container utama + 1 container database.**
- Di dalam `src/modules/`, kode dipisah rapi per modul.
- Setiap modul punya file sendiri: `controller`, `service`, `routes`, `model`.
- Komunikasi antar modul HANYA lewat **fungsi yang diekspor (public API modul)**.
- Modul TIDAK boleh langsung akses database/tabel milik modul lain (kecuali modul baca-saja/agregasi seperti `reports`).

## 2. Tech Stack (Diputuskan)
| Lapisan | Teknologi |
|---|---|
| Bahasa | TypeScript (backend + frontend) |
| Backend | Node.js 20 + Express |
| ORM + DB | Prisma + PostgreSQL 16 |
| Frontend | React 18 + Vite + Tailwind CSS |
| Auth | express-session + bcrypt |
| Upload | multer (simpan di folder `uploads/`) |
| Export | xlsx (Excel) + jsPDF/autotable (PDF) — di sisi frontend |

## 3. Struktur Folder
```
marms/
├── docker-compose.yml
├── Dockerfile
├── prisma/
│   ├── schema.prisma        # definisi semua tabel
│   ├── migrations/          # riwayat perubahan database
│   └── seed.ts              # data awal (jabatan, pengaturan, admin)
├── src/
│   ├── modules/
│   │   ├── master-data/
│   │   ├── recruitment/
│   │   ├── crew-placement/
│   │   ├── payroll/
│   │   ├── reports/
│   │   ├── auth/
│   │   └── leave-pay/
│   ├── shared/              # prisma, AppError, asyncHandler, session, upload, masaKerja
│   └── app.ts               # titik masuk backend
├── client/
│   ├── src/pages/           # halaman (MasterData, Recruitment, Crew, Payroll, Reports, Settings, Login, public/)
│   ├── src/components/      # Layout (sidebar + auth)
│   └── src/utils/export.ts  # export Excel/PDF
├── uploads/                 # dokumen pelamar (Docker volume)
└── docs/                    # dokumentasi
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
- Sesi login pakai `express-session` (cookie httpOnly, auto-logout 30 menit).
- Semua endpoint `/api/*` dilindungi middleware auth, kecuali whitelist publik:
  `POST /api/recruitment/pelamar` dan `GET /api/master-data/jabatan`.
- File dokumen disimpan di `uploads/`, nama file acak (UUID), max 5 MB, PDF/JPG/PNG.
  Dokumen bersifat opsional; sebagian punya tanggal expired; admin bisa memperbarui dokumen expired.
