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
| `VesselStatus` | AKTIF, DOCKING |
| `PlacementStatus` | AKTIF, SELESAI |
| `OffBoardReason` | RELIEF, CUTI, SAKIT, END_OF_CONTRACT |
| `PayrollStatus` | DRAFT, FINAL, DIBAYAR |
| `PayrollJenis` | GAJI, UANG_MAKAN |
| `DocumentStatus` | PENDING, TERVERIFIKASI, DITOLAK |

> Catatan: enum `OffBoardReason` punya 4 nilai (RELIEF, CUTI, SAKIT, END_OF_CONTRACT),
> dan keempatnya tersedia di form off board.

## Tabel & Relasi

| Tabel | Kolom Kunci | Relasi |
|---|---|---|
| `Jabatan` | kode (PK), nama, gajiPokok, createdAt, updatedAt | — (referensi longgar: Kontrak/Penempatan/PayrollDetail menyimpan `jabatanKode` string) |
| `Pengaturan` | key (PK), value, updatedAt | — |
| `Kapal` | id, namaUnit (unik), status, tbNama/tbImo/tbGt/tbTahun, bgNama/bgImo/bgGt/bgTahun | → Penempatan, Payroll |
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
| `Admin` | id, email (unik), passwordHash, mustChangePassword | — |

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
```

## Alur Data Utama
```
Pelamar --diterima--> Crew --punya--> Kontrak --> Penempatan --> Segmen --> SeaServiceRecord
Crew --muncul di--> PayrollDetail  (per segmen, per bulan, per jenis)
Crew --punya--> LeavePayDisbursement (per pencairan)
```

## Catatan Penting
- Gaji pokok ada di `Jabatan`, BUKAN di `Kontrak` (`jabatanKode` di Kontrak/Penempatan/PayrollDetail adalah string tanpa foreign key).
- Payroll di-snapshot: `PayrollDetail` menyimpan gaji/uang makan yang sudah dibekukan.
- Masa kerja kumulatif di `Crew.totalMasaKerja` (segmen tertutup); masa kerja live dihitung dari segmen yang masih On Board (`src/shared/masaKerja.ts`).
- `SeaServiceRecord` dibuat otomatis saat crew off board (`crew-placement.service.ts`); kolom `imo` diisi dari `tbImo` (tugboat).
