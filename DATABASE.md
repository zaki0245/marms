# DATABASE.md — Skema Database MARMS

> **Penjelasan untuk Pemula:** Ini "denah gudang data" — daftar semua tabel, kolom, dan
> hubungan antar tabel di database PostgreSQL.
>
> **Kenapa Ini Penting:** Supaya kita tahu data disimpan di mana dan bagaimana saling terhubung,
> terutama saat menambah fitur atau membuat laporan. Skema di bawah sesuai `prisma/schema.prisma`.

## Enums (Nilai Tetap)

| Enum | Nilai |
|---|---|
| `Gender` | LAKI_LAKI, PEREMPUAN |
| `ApplicantStatus` | BARU, VERIFIKASI, INTERVIEW, DITERIMA, DITOLAK |
| `CrewStatus` | AVAILABLE, ON_BOARD, OFF_BOARD |
| `ContractStatus` | AKTIF, BERAKHIR, DIPERPANJANG |
| `VesselStatus` | AKTIF, DOCKING, TIDAK_AKTIF |
| `KapalSkema` | MILIK, SEWA |
| `PlacementStatus` | AKTIF, SELESAI |
| `OffBoardReason` | RELIEF, CUTI, SAKIT, END_OF_CONTRACT |
| `PayrollStatus` | DRAFT, FINAL, DIBAYAR |
| `PayrollJenis` | GAJI, UANG_MAKAN |
| `DocumentStatus` | PENDING, TERVERIFIKASI, DITOLAK |
| `InvoiceJenis` | AR, AP |
| `VoucherJenis` | RV, PV |
| `InvoiceCategory` | FREIGHT, OPERATION, OTHERS |
| `InvoiceType` | REGULAR, DP, PELUNASAN |
| `FakturPajakStatus` | SUDAH_DITERIMA, BELUM_DITERIMA, TIDAK_ADA |
| `PaymentStatus` | BELUM_BAYAR, SEBAGIAN, LUNAS |
| `ApprovalStatus` | BELUM_DIAPPROVE, SUDAH_DIAPPROVE |
| `Role` | SUPERADMIN, CREWING, FINANCE, OPERATION |
| `ShipmentStatus` | PLANNED, ON_GOING, COMPLETED |
| `AgentTipe` | POL, POD |

> Catatan: enum `OffBoardReason` punya 4 nilai (RELIEF, CUTI, SAKIT, END_OF_CONTRACT),
> dan keempatnya tersedia di form off board.

## Tabel & Relasi

| Tabel | Kolom Kunci | Relasi |
|---|---|---|
| `Jabatan` | kode (PK), nama, gajiPokok, createdAt, updatedAt | — (referensi longgar: Kontrak/Penempatan/PayrollDetail menyimpan `jabatanKode` string) |
| `Pengaturan` | key (PK), value, updatedAt | — |
| `Kapal` | id, namaUnit (unik), skema (MILIK/SEWA), status, tbNama/tbImo/tbGt/tbTahun, bgNama/bgImo/bgGt/bgTahun, createdAt, updatedAt | → Penempatan, Payroll |
| `Pelamar` | id, nomorPendaftaran (unik), namaLengkap, tempatLahir, tanggalLahir, jenisKelamin, noHp (unik), email (unik), alamat, kontakReferensi, posisiDilamar, pengalamanTahun, kapalTerakhir, jabatanTerakhir, status | → Dokumen, 1→1 Crew |
| `Dokumen` | id, applicantId, jenis, filePath, nomor, tanggalTerbit, tanggalExpired, status, catatan | ← Pelamar |
| `Crew` | id, applicantId (unik), tanggalBergabung, status, totalMasaKerja, jumlahLeavePay, namaBank, noRekening | ← Pelamar; → Kontrak, Penempatan, SeaServiceRecord, LeavePayDisbursement, PayrollDetail |
| `Kontrak` | id, nomorKontrak (unik), crewId, jabatanKode, tanggalMulai, tanggalSelesai, durasi, status, catatan | ← Crew; → Penempatan |
| `Penempatan` | id, crewId, kontrakId, vesselId, jabatanKode, tanggalMulai, tanggalSelesai, status | → Segmen |
| `Segmen` | id, placementId, onBoardTanggal, onBoardPelabuhan, offBoardTanggal, offBoardPelabuhan, alasanOffBoard, durasi, catatan | → SeaServiceRecord |
| `SeaServiceRecord` | id, crewId, segmentId (unik), namaCrew, jabatan, namaKapal, imo, onBoardTanggal, offBoardTanggal, onBoardPelabuhan, offBoardPelabuhan, totalHari, tanggalGenerate | ← Crew, Segmen |
| `Payroll` | id, vesselId, bulan, tahun, jumlahHari, status, jenis, tanggalFinalisasi, tanggalPembayaran, dibuatOleh | unik(vesselId, bulan, tahun, jenis); → PayrollDetail |
| `PayrollDetail` | id, payrollId, crewId, jabatanKode, jabatanNama, segmentId, periodeKerja, hariAktif, gajiPokokSnapshot, gajiProrata, uangMakanSnapshot, uangMakanProrata, total, namaBank, noRekening | ← Payroll, Crew |
| `LeavePayDisbursement` | id, crewId, tanggalPencairan, nominal, pencairanKe, masaKerjaSnapshot, catatanPerforma | ← Crew |
| `Admin` | id, email (unik), passwordHash, role, active, sessionVersion, createdAt, updatedAt | — |
| `AuditLog` | id, adminId, adminEmail (snapshot), aksi, detail, createdAt | ← indeks createdAt |
| `Vendor` | id, nama (unik), npwp, alamat | → VendorBank, Invoice, Pv |
| `VendorBank` | id, vendorId, accountNo, accountName, bank | ← Vendor |
| `Customer` | id, nama (unik), npwp, alamat | → CustomerBank, Invoice, Pv |
| `CustomerBank` | id, customerId, accountNo, accountName, bank | ← Customer |
| `Invoice` | id, no (unik), jenis (AR/AP), kategori, tipe, tanggal, bupot, vendorId?, customerId?, vendorName/vendorNpwp/vendorAlamat atau customerName/customerNpwp/customerAlamat (snapshot), bankAccount*, inv?, ref, keterangan, dpp, ppn, pphPasal, pph, total, cargoQuantity, unitPrice, dueDate, masaPajakPPN, masaPajakPPH, statusFakturPajak, statusPembayaran, parentInvoiceId, incomplete, approvalStatus, perluApproval, approvalToken, approvalSentAt, approvalSentTo, approvedAt | ← Vendor/Customer; → FakturPajak, PvItem; unik(vendorId/customerId, inv) |
| `FakturPajak` | id, invoiceId, nomor | ← Invoice |
| `Pv` (voucher) | id, pvNo (unik), jenis (RV/PV), tanggal, vendorId?, customerId?, vendorName/vendorNpwp/vendorAlamat atau customerName/customerNpwp/customerAlamat (snapshot), bankAccount*, chequeNo, issuedDate, bankCharge, balance, keterangan | ← Vendor/Customer; → PvItem |
| `PvItem` | id, pvId, invoiceId, nominal (DPP), includeTax | ← Pv, Invoice |
| `Shipment` | id, kode (unik), petaToken (unik), tb, bg, ownerOperator, shipper, commodities, contactMaster, laycan, size, pol/agentPol/agentPolId/picPol/contactAgentPol, pod/agentPod/agentPodId/picPod/contactAgentPod, operationKapalId, jadwal t*Pol/t*Pod, laytimePol, laytimePod, totalLaytime, laytimeAllowed, demurrageDespatch, dsrPol, dsrPod, position, remarks, status (PLANNED/ON_GOING/COMPLETED), latitude, longitude | → ShipmentDocument, OperationAgent (POL & POD), OperationKapal |
| `ShipmentDocument` | id, shipmentId, nama, file, createdAt | ← Shipment (cascade) |
| `OperationAgent` | id, tipe (POL/POD), nama, pic, kontak, createdAt, updatedAt | ← Shipment (agentPolId/agentPodId, onDelete SetNull); unik (tipe, nama) |
| `OperationKapal` | id, tb, bg, ownerOperator, contactMaster, createdAt, updatedAt | ← Shipment (operationKapalId, onDelete SetNull); unik (tb, bg) |

## ERD

```mermaid
erDiagram
    PELAMAR ||--o{ DOKUMEN : "memiliki"
    PELAMAR ||--o| CREW : "menjadi"
    CREW ||--o{ KONTRAK : "memiliki"
    CREW ||--o{ PENEMPATAN : "memiliki"
    KONTRAK ||--o{ PENEMPATAN : "dipakai"
    KAPAL ||--o{ PENEMPATAN : "menampung"
    KAPAL ||--o{ PAYROLL : "direkap"
    PENEMPATAN ||--o{ SEGMEN : "terdiri dari"
    SEGMEN ||--o| SEA_SERVICE_RECORD : "dicatat"
    CREW ||--o{ SEA_SERVICE_RECORD : "memiliki"
    PAYROLL ||--o{ PAYROLL_DETAIL : "berisi"
    CREW ||--o{ PAYROLL_DETAIL : "muncul di"
    CREW ||--o{ LEAVE_PAY_DISBURSEMENT : "dicairkan"
    SHIPMENT ||--o{ SHIPMENT_DOCUMENT : "memiliki"
    OPERATION_AGENT ||--o{ SHIPMENT : "agen POL"
    OPERATION_AGENT ||--o{ SHIPMENT : "agen POD"

    PELAMAR {
        string id PK
        string nomorPendaftaran UK
        string noHp UK
        string email UK
        string posisiDilamar
        enum status
    }
    DOKUMEN {
        string id PK
        string applicantId FK
        string jenis
        string filePath
        date tanggalExpired
        enum status
    }
    CREW {
        string id PK
        string applicantId FK_UK
        enum status
        int totalMasaKerja
        int jumlahLeavePay
        string namaBank
        string noRekening
    }
    KONTRAK {
        string id PK
        string nomorKontrak UK
        string crewId FK
        string jabatanKode
        enum status
    }
    KAPAL {
        string id PK
        string namaUnit UK
        enum status
    }
    PENEMPATAN {
        string id PK
        string crewId FK
        string kontrakId FK
        string vesselId FK
        string jabatanKode
        enum status
    }
    SEGMEN {
        string id PK
        string placementId FK
        datetime onBoardTanggal
        datetime offBoardTanggal
        enum alasanOffBoard
        int durasi
    }
    SEA_SERVICE_RECORD {
        string id PK
        string crewId FK
        string segmentId FK_UK
        int totalHari
    }
    PAYROLL {
        string id PK
        string vesselId FK
        int bulan
        int tahun
        enum jenis
        enum status
    }
    PAYROLL_DETAIL {
        string id PK
        string payrollId FK
        string crewId FK
        string jabatanKode
        int hariAktif
        int gajiPokokSnapshot
        int gajiProrata
        int uangMakanSnapshot
        int uangMakanProrata
        int total
    }
    LEAVE_PAY_DISBURSEMENT {
        string id PK
        string crewId FK
        int nominal
        int pencairanKe
        int masaKerjaSnapshot
    }
    SHIPMENT {
        string id PK
        string kode UK
        enum status
        float latitude
        float longitude
    }
    SHIPMENT_DOCUMENT {
        string id PK
        string shipmentId FK
        string nama
        string file
    }
    OPERATION_AGENT {
        string id PK
        enum tipe
        string nama UK
        string pic
        string kontak
    }
```

## Alur Data Utama
```
Pelamar --diterima--> Crew --punya--> Kontrak --> Penempatan --> Segmen --> SeaServiceRecord
Crew --muncul di--> PayrollDetail  (per segmen, per bulan, per jenis)
Crew --punya--> LeavePayDisbursement (per pencairan)
Shipment --memiliki--> ShipmentDocument (BL, invoice, COO, dsb.)
```

## Catatan Penting
- Gaji pokok ada di `Jabatan`, BUKAN di `Kontrak` (`jabatanKode` di Kontrak/Penempatan/PayrollDetail adalah string tanpa foreign key).
- Payroll di-snapshot: `PayrollDetail` menyimpan gaji/uang makan yang sudah dibekukan.
- Masa kerja kumulatif di `Crew.totalMasaKerja` (segmen tertutup); masa kerja live dihitung dari segmen yang masih On Board (`src/shared/masaKerja.ts`).
- `SeaServiceRecord` dibuat otomatis saat crew off board (`crew-placement.service.ts`); kolom `imo` diisi dari `tbImo` (tugboat).
- Finance: `Invoice.jenis` (AR/AP) menentukan counterparty (Customer/Vendor) & snapshot yang diisi.
  `Pv` (voucher) memakai `jenis` RV/PV; `PvItem.nominal` = DPP, `includeTax` = melunasi PPN/PPH.
  Status invoice dihitung otomatis dari akumulasi nominal (`recomputeStatus`).
- Approval invoice: `Invoice.approvalToken` dipakai untuk tautan publik `/approve/:token`;
  setelah disetujui `approvalStatus=SUDAH_DIAPPROVE`, `approvedAt` diisi, token dihapus.
  `Invoice.perluApproval` (default true) menentukan tombol kirim email; nilainya dipaksa
  `false` untuk AR dan kategori Freight.
- Operation: `Shipment` menyimpan jadwal voyage (Pol/Pod), laytime & demurrage/despatch,
  posisi terakhir (`latitude`/`longitude`), dan status. Dashboard peta hanya mem-pin
  `status=ON_GOING` yang koordinatnya terisi, lalu mengurutkan berdasarkan `updatedAt`.
- `ShipmentDocument.file` menyimpan nama file UUID di folder `uploads/` (sama seperti dokumen pelamar).
- Agen POL/POD berasal dari master `OperationAgent` yang **dipisah per tipe** (`POL`/`POD`,
  unik per `(tipe, nama)`), lengkap dengan PIC + kontak. Saat agen dipilih, shipment menyimpan
  `agentPolId`/`agentPodId` **dan** snapshot teks (`agentPol`, `picPol`, `contactAgentPol`, dst.)
  agar laporan lama tidak berubah saat master diedit. Menghapus agen membuat FK jadi null, teks
  snapshot tetap ada.
- Unit kapal Operation berasal dari master `OperationKapal` (unik per `(tb, bg)`) berisi TB, BG,
  owner/operator, dan contact master. Saat unit dipilih, shipment menyimpan `operationKapalId`
  **dan** snapshot teks (`tb`, `bg`, `ownerOperator`, `contactMaster`). Menghapus unit membuat FK
  jadi null, teks snapshot tetap ada.
- Memori field voyage (Shipper, Commodities, POL, POD) diambil dari nilai unik tabel `Shipment`
  (`GET /api/operation/refs`), bukan tabel master.
