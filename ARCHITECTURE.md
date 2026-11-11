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
| Peta | Leaflet + react-leaflet (tile Geoapify `osm-carto`, key via `VITE_GEOAPIFY_API_KEY`) |
| Keamanan | helmet (CSP), cors allowlist, express-session, bcryptjs, rate limit in-memory |
| Export | xlsx (Excel) + jsPDF/autotable (PDF) — di sisi frontend |
| Test | `node:test` via `tsx` (`tests/*.test.ts`) |

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
│   │   ├── crewing/           # payung bisnis Crewing
│   │   │   ├── master-data/   # Jabatan & Pengaturan (uang makan)
│   │   │   ├── recruitment/   # pendaftaran & seleksi pelamar
│   │   │   ├── crew-placement/# assign, off board, info bank
│   │   │   ├── payroll/       # gaji & uang makan prorata
│   │   │   ├── reports/       # dashboard & laporan (baca-saja)
│   │   │   └── leave-pay/     # kelayakan & pencairan leave pay
│   │   ├── finance/           # payung bisnis Finance (AR/AP)
│   │   │   ├── vendor/        # master Vendor (AP)
│   │   │   ├── customer/      # master Customer (AR)
│   │   │   ├── invoice/       # invoice AR & AP + approval token
│   │   │   ├── pv/            # voucher PV (AP) & RV (AR)
│   │   │   ├── approve.*      # route publik approval voucher dari email
│   │   │   ├── konfigurasi/   # nama/alamat perusahaan & penandatangan
│   │   │   └── laporan/       # rekap & dashboard finance
│   │   ├── operation/         # payung bisnis Operation
│   │   │   ├── operation.*    # CRUD shipment, master agen, memori field voyage, dashboard
│   │   │   └── laytime.ts     # hitung laytime, demurrage/despatch
│   │   ├── kapal/             # master Kapal (TB + BG), lintas payung
│   │   └── auth/              # login, logout, ganti password, kelola akun
│   ├── shared/                # prisma, AppError, asyncHandler, session, authorization,
│   │                          # rateLimit, mailer, upload, masaKerja, prorata, jabatanOrder
│   ├── types/                 # deklarasi tipe express-session
│   └── app.ts                 # titik masuk backend
├── client/
│   ├── src/api/client.ts      # instance axios + format Rupiah
│   ├── src/components/        # Layout, Pagination, sortable, SearchableSelect, MemoryInput,
│   │                          # MapResizer, mapTiles, leafletPin, PublicLayout, Logo
│   ├── src/constants.ts       # daftar 21 dokumen
│   ├── src/pages/
│   │   ├── Crewing/           # Dashboard, MasterData, Recruitment, Crew, Payroll, Reports
│   │   ├── Finance/           # Dashboard, Input/Daftar Invoice, Cetak (PV/RV), Vendor, Customer, Laporan, Konfigurasi
│   │   ├── Operation/         # Dashboard (peta), Shipment, ShipmentForm, Agent, AgentForm, Laporan
│   │   ├── Kapal/             # master kapal
│   │   ├── Accounts/          # kelola akun (superadmin)
│   │   ├── Settings/          # pengaturan
│   │   ├── Login.tsx          # login admin
│   │   └── public/            # form pendaftaran publik + approval voucher
│   └── src/utils/             # export Excel/PDF, pvPrint (PDF voucher)
├── scripts/                   # utilitas CLI (hash-password)
├── tests/                     # test prorata, masa kerja, laytime
└── uploads/                   # dokumen pelamar & shipment (Docker volume)
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

## 7. Autentikasi, Role & Upload
- Sesi login pakai `express-session` (cookie httpOnly, `sameSite=lax`, auto-logout 30 menit
  tidak aktif dengan `rolling`, `secure` mengikuti `COOKIE_SECURE`).
- `SESSION_SECRET` **wajib** di produksi (aplikasi menolak start bila kosong); hanya di
  development memakai fallback `dev-secret`.
- Route auth dipasang sebelum proteksi; semua endpoint `/api/*` dilindungi middleware auth +
  pembatasan role di `src/app.ts`:
  - `/api/operation/*` → `OPERATION` atau `SUPERADMIN`
  - `/api/finance/*` → `FINANCE` atau `SUPERADMIN`
  - sisanya → `CREWING` atau `SUPERADMIN`
- Whitelist publik: `POST /api/recruitment/pelamar`, `GET /api/master-data/jabatan`,
  `/api/auth/*`, dan `/api/approve/:token` (tautan approval voucher dari email).
- Rate limit in-memory: login 5x salah per email → kunci 15 menit; pendaftaran pelamar
  20x per IP → kunci 15 menit.
- File dokumen disimpan di `uploads/` (dokumen pelamar + dokumen shipment), nama file UUID,
  max 5 MB, PDF/JPG/PNG. Dokumen pelamar opsional; sebagian punya tanggal expired; admin bisa
  memperbarui dokumen expired.

## 8. Penyajian Frontend & Health Check
- Express menyajikan hasil build frontend (`client/dist`) sebagai file statis + SPA fallback
  (`app.get('*')` mengembalikan `index.html` untuk route non-`/api`).
- Endpoint `/health` mengembalikan `{"status":"ok"}` untuk HEALTHCHECK Docker.
- Dokumen disajikan via `/uploads/:filename` dan **wajib login**; nama file divalidasi dengan
  regex UUID + ekstensi untuk mencegah path traversal.

## 9. Catatan Keamanan
- Rate limiting masih **in-memory** (reset saat restart) — cukup untuk V1.
- `cors()` dibatasi ke origin `CORS_ORIGIN` (default `http://localhost:5173`) dan memakai
  `credentials: true`. Saat produksi same-origin, variabel ini jarang dipakai.
- `helmet` memasang CSP; `img-src` hanya mengizinkan `'self'`, `data:`, dan
  `https://maps.geoapify.com` (tile peta Geoapify).
- API key Geoapify ditanam di bundle frontend saat build (`VITE_GEOAPIFY_API_KEY`, build arg
  Docker). Batasi key di dashboard Geoapify (HTTP referrer) dan rotasi bila bocor.
- Dokumen `/uploads/*` tidak lagi publik (butuh sesi login).
- Peta Leaflet diberi `isolation: isolate` di `client/src/index.css` agar pane-nya (z-index
  400–1000) tidak menimpa sidebar/modal (z-index 30–50) di layar HP.

