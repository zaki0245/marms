# DATABASE.md — Skema Database MARMS

> **Penjelasan untuk Pemula:** Ini "denah gudang data" — daftar semua tabel, kolom, dan
> hubungan antar tabel di database PostgreSQL.
>
> **Kenapa Ini Penting:** Supaya kita tahu data disimpan di mana dan bagaimana saling terhubung,
> terutama saat menambah fitur atau membuat laporan.

## Enums (Nilai Tetap)

| Enum | Nilai |
|---|---|
| `Gender` | LAKI_LAKI, PEREMPUAN |
| `ApplicantStatus` | BARU, VERIFIKASI, INTERVIEW, DITERIMA, DITOLAK |
| `CrewStatus` | AVAILABLE, ON_BOARD, OFF_BOARD |
| `ContractStatus` | AKTIF, BERAKHIR, DIPERPANJANG |
| `VesselStatus` | AKTIF, DOCKING |
| `PlacementStatus` | AKTIF, SELESAI |
| `OffBoardReason` | RELIEF, END_OF_CONTRACT |
| `PayrollStatus` | DRAFT, FINAL, DIBAYAR |
| `PayrollJenis` | GAJI, UANG_MAKAN |
| `DocumentStatus` | PENDING, TERVERIFIKASI, DITOLAK |

## Tabel & Relasi

| Tabel | Kolom Kunci | Relasi |
|---|---|---|
| `Jabatan` | kode (PK), nama, gajiPokok | — |
| `Pengaturan` | key (PK), value | — |
| `Kapal` | id, namaUnit (unik), status, tbNama/tbImo/tbGt/tbTahun, bgNama/bgImo/bgGt/bgTahun | 1→banyak Penempatan, Payroll |
| `Pelamar` | id, nomorPendaftaran (unik), email (unik), noHp (unik), status | 1→banyak Dokumen, 1→1 Crew |
| `Dokumen` | id, applicantId, jenis, filePath, tanggalExpired | ← Pelamar |
| `Crew` | id, applicantId (unik), status, totalMasaKerja, jumlahLeavePay, namaBank, noRekening | ← Pelamar; → Kontrak, Penempatan, SeaServiceRecord, LeavePayDisbursement, PayrollDetail |
| `Kontrak` | id, nomorKontrak (unik), crewId, jabatanKode, tanggalMulai | ← Crew; → Penempatan |
| `Penempatan` | id, crewId, kontrakId, vesselId, jabatanKode, tanggalMulai, status | → Segmen |
| `Segmen` | id, placementId, onBoardTanggal, offBoardTanggal, alasanOffBoard, durasi | → SeaServiceRecord |
| `SeaServiceRecord` | id, crewId, segmentId (unik), totalHari | ← Crew, Segmen |
| `Payroll` | id, vesselId, bulan, tahun, jumlahHari, jenis, status | unik(vesselId, bulan, tahun, jenis); → PayrollDetail |
| `PayrollDetail` | id, payrollId, crewId, jabatanKode, hariAktif, gajiProrata, uangMakanProrata, total, namaBank, noRekening | ← Payroll, Crew |
| `LeavePayDisbursement` | id, crewId, tanggalPencairan, nominal, pencairanKe, masaKerjaSnapshot | ← Crew |
| `Admin` | id, email (unik), passwordHash, mustChangePassword | — |

## Alur Data Utama
```
Pelamar --diterima--> Crew --punya--> Kontrak --> Penempatan --> Segmen --> SeaServiceRecord
Crew --muncul di--> PayrollDetail  (per segmen, per bulan, per jenis)
Crew --punya--> LeavePayDisbursement (per pencairan)
```

## Catatan Penting
- Gaji pokok ada di `Jabatan`, BUKAN di `Kontrak`.
- Payroll di-snapshot: `PayrollDetail` menyimpan gaji/uang makan yang sudah dibekukan.
- Masa kerja kumulatif di `Crew.totalMasaKerja` (segmen tertutup); masa kerja live dihitung dari segmen yang masih On Board.
