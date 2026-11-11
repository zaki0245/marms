# TODO.md — Daftar Pekerjaan MARMS

> **Penjelasan untuk Pemula:** Ini daftar tugas yang harus dikerjakan, diurutkan dari yang
> paling dasar. Setiap tugas dicentang setelah selesai dan berhasil dites.
>
> **Kenapa Ini Penting:** Supaya kita tahu sudah sampai mana dan tidak ada fitur yang terlewat.
> Daftar ini sudah di-reset dan disesuaikan dengan kode aktual di `src/` dan `client/src/`.

## Fase 0 — Setup
- [x] Inisialisasi project (package.json, TypeScript, folder src/client).
- [x] Konfigurasi Prisma + skema semua tabel + migration.
- [x] Seed data: 8 jabatan, pengaturan umum (uang makan), 1 akun admin.
- [x] Dockerfile (multi-stage) + docker-compose.yml (db + app + adminer) + .env.example + .gitignore.

## Modul 1 — Master Data
- [x] CRUD Master Jabatan (8 fixed, gaji pokok).
- [x] Pengaturan "Uang Makan" (uang makan/bulan).
- [x] CRUD Kapal (unit TB + BG; tanpa minimum manning, status Aktif/Docking).

## Modul 2 — Rekrutmen
- [x] Form pendaftaran publik + upload dokumen (21 dokumen, opsional).
- [x] Auto nomor pendaftaran `PLR-YYYY-NNNN`.
- [x] Validasi duplikat email/HP (tolak otomatis).
- [x] Halaman "Terima Kasih" (tanpa nomor lamaran).
- [x] Admin: daftar pelamar + seleksi status (Baru → Verifikasi → Wawancara → Diterima/Ditolak).
- [x] Badge pelamar baru di sidebar.

## Modul 3 — Kru & Penempatan
- [x] Pool Kandidat (assign kandidat Diterima ke kapal + tanggal on board).
- [x] Crew (filter kapal, status, masa kerja live).
- [x] Tab Off Board (crew off board terpisah).
- [x] Off board (alasan Relief/Cuti/Sakit/Habis Kontrak) + hitung masa kerja.
- [x] Dokumen expired TIDAK memblokir penempatan baru (tanggung jawab crew untuk perbarui).
- [x] Perbarui dokumen expired (file baru + tanggal expired).
- [x] Edit info bank (nama bank, no rekening).

## Modul 4 — Payroll & Uang Makan
- [x] Generate payroll per jenis (Gaji / Uang Makan).
- [x] Hitung prorata (round half up).
- [x] Snapshot nilai gaji/uang makan.
- [x] Status Draf → Final → Dibayar.
- [x] Export Excel/PDF.

## Modul 5 — Laporan & Leave Pay
- [x] Dashboard admin (angka ringkasan, tanpa grafik).
- [x] Laporan: crew per kapal, dokumen akan expired (30 hari), masa kerja.
- [x] Kelayakan leave pay (kelipatan 180 hari) + pencairan (nominal & tanggal) + riwayat.

## Modul 6 — Pengaturan & Auth
- [x] Login admin + ganti password (wajib saat login pertama).
- [x] Rate limiting login (5x salah → 15 menit).
- [x] Logout & proteksi endpoint `/api/*` (whitelist publik: daftar pelamar + list jabatan).

## Modul 7 — Finance (AP/AR)
- [x] Master Vendor (AP) & Customer (AR) + rekening bank.
- [x] Invoice dengan jenis AR/AP (kategori, tipe DP/Pelunasan, DPP/PPN/PPH, faktur pajak).
- [x] Daftar invoice dengan tab AR/AP, status pembayaran otomatis.
- [x] Voucher PV (AP) & RV (AR): satu voucher banyak invoice, DPP per item, flag lunasi PPN/PPH.
- [x] Cetak PDF voucher (logo, terbilang, tabel invoice, bank, tanda tangan).
- [x] Dashboard Finance (hutang/piutang) & Laporan Rekap AR/AP (export Excel).

## Modul 8 — Operation (Voyage Tongkang)
- [x] CRUD Shipment: data TB/BG, owner/operator, shipper, komoditas, laycan, POL/POD + agen/PIC.
- [x] Jadwal kegiatan voyage (arrival, berthing, commenced, cast off, departure) POL & POD.
- [x] Hitung laytime, demurrage/despatch (`src/modules/operation/laytime.ts` + test).
- [x] Status voyage `PLANNED`/`ON_GOING`/`COMPLETED` + posisi (koordinat & teks).
- [x] Dokumen pendukung shipment (upload/hapus).
- [x] Memori field voyage: TB, BG, Owner/Operator, Shipper, Commodities, Contact Master, POL, POD
  (saran dari riwayat shipment, endpoint `/operation/refs` + `MemoryInput`).
- [x] Master agen POL/POD (`OperationAgent`): nama/PIC/kontak, halaman Agen, tambah cepat "+"
  di form shipment, PIC & kontak terisi otomatis saat memilih agen.
- [x] Pisahkan agen POL & POD: kolom `tipe` (tab POL/POD di halaman Agen), unik per tipe,
  dropdown POL hanya agen POL dan sebaliknya; migration memisahkan data agen lama.
- [x] Backfill relasi agen untuk shipment lama dari nama agen yang sudah ada.
- [x] Dashboard peta posisi shipment `ON_GOING` (tile Geoapify).
- [x] Laporan voyage per shipment (cetak/print).
- [x] Role `OPERATION` + menu sidebar terpisah.

## Fase Akhir — Tersisa
- [x] Generate `SeaServiceRecord` otomatis saat off board (`imo` dari `tbImo`).
- [x] Aktifkan alasan off board Cuti & Sakit di form (Relief/Cuti/Sakit/Habis Kontrak).
- [x] Hapus kolom `dinilaiOleh` / `dicairkanOleh` yang tidak terpakai di leave pay.
- [x] Test minimal (`npm test`): prorata, masa kerja, laytime.
- [x] Audit tampilan HP: sidebar drawer di atas peta (`isolation: isolate` pada `.leaflet-container`).
- [x] Ganti tile peta ke Geoapify `osm-carto` dengan API key (`VITE_GEOAPIFY_API_KEY`) agar tidak
  kena blokir 403 OSM ("Access blocked") dan bebas dari batasan ToS CARTO.
- [ ] Validasi lokal end-to-end (cek seluruh alur dari daftar → payroll → leave pay → shipment).
- [x] Push ke GitHub (`origin` = `zaki0245/marms`, lokal sudah sinkron dengan `origin/main`).
- [ ] (DITUNDA) DevOps: Docker production, K3s, CI/CD, OCI.
