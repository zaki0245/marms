-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('LAKI_LAKI', 'PEREMPUAN');

-- CreateEnum
CREATE TYPE "ApplicantStatus" AS ENUM ('BARU', 'DOKUMEN_DIUPLOAD', 'VERIFIKASI', 'INTERVIEW', 'DITERIMA', 'DITOLAK');

-- CreateEnum
CREATE TYPE "CrewStatus" AS ENUM ('AVAILABLE', 'ON_BOARD', 'OFF_BOARD');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('AKTIF', 'BERAKHIR', 'DIPERPANJANG');

-- CreateEnum
CREATE TYPE "VesselStatus" AS ENUM ('AKTIF', 'DOCKING', 'STANDBY');

-- CreateEnum
CREATE TYPE "PlacementStatus" AS ENUM ('AKTIF', 'SELESAI');

-- CreateEnum
CREATE TYPE "OffBoardReason" AS ENUM ('RELIEF', 'CUTI', 'SAKIT', 'END_OF_CONTRACT');

-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('DRAFT', 'FINAL', 'DIBAYAR');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'TERVERIFIKASI', 'DITOLAK');

-- CreateTable
CREATE TABLE "Jabatan" (
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "gajiPokok" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Jabatan_pkey" PRIMARY KEY ("kode")
);

-- CreateTable
CREATE TABLE "Pengaturan" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pengaturan_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Kapal" (
    "id" TEXT NOT NULL,
    "namaUnit" TEXT NOT NULL,
    "status" "VesselStatus" NOT NULL DEFAULT 'AKTIF',
    "tbNama" TEXT NOT NULL,
    "tbImo" TEXT,
    "tbGt" INTEGER,
    "tbTahun" INTEGER,
    "bgNama" TEXT NOT NULL,
    "bgImo" TEXT,
    "bgGt" INTEGER,
    "bgTahun" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kapal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MinimumManning" (
    "id" TEXT NOT NULL,
    "vesselId" TEXT NOT NULL,
    "positionCode" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "MinimumManning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pelamar" (
    "id" TEXT NOT NULL,
    "nomorPendaftaran" TEXT NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "tempatLahir" TEXT NOT NULL,
    "tanggalLahir" TIMESTAMP(3) NOT NULL,
    "jenisKelamin" "Gender" NOT NULL,
    "noHp" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "kontakReferensi" TEXT,
    "posisiDilamar" TEXT NOT NULL,
    "pengalamanTahun" INTEGER,
    "kapalTerakhir" TEXT,
    "jabatanTerakhir" TEXT,
    "status" "ApplicantStatus" NOT NULL DEFAULT 'BARU',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pelamar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dokumen" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "jenis" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "nomor" TEXT,
    "tanggalTerbit" TIMESTAMP(3),
    "tanggalExpired" TIMESTAMP(3),
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dokumen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Crew" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "tanggalBergabung" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "CrewStatus" NOT NULL DEFAULT 'AVAILABLE',
    "totalMasaKerja" INTEGER NOT NULL DEFAULT 0,
    "jumlahLeavePay" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Crew_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kontrak" (
    "id" TEXT NOT NULL,
    "nomorKontrak" TEXT NOT NULL,
    "crewId" TEXT NOT NULL,
    "jabatanKode" TEXT NOT NULL,
    "tanggalMulai" TIMESTAMP(3) NOT NULL,
    "tanggalSelesai" TIMESTAMP(3),
    "durasi" INTEGER,
    "status" "ContractStatus" NOT NULL DEFAULT 'AKTIF',
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kontrak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Penempatan" (
    "id" TEXT NOT NULL,
    "crewId" TEXT NOT NULL,
    "kontrakId" TEXT NOT NULL,
    "vesselId" TEXT NOT NULL,
    "jabatanKode" TEXT NOT NULL,
    "tanggalMulai" TIMESTAMP(3) NOT NULL,
    "tanggalSelesai" TIMESTAMP(3),
    "status" "PlacementStatus" NOT NULL DEFAULT 'AKTIF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Penempatan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Segmen" (
    "id" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
    "onBoardTanggal" TIMESTAMP(3) NOT NULL,
    "onBoardPelabuhan" TEXT NOT NULL,
    "offBoardTanggal" TIMESTAMP(3),
    "offBoardPelabuhan" TEXT,
    "alasanOffBoard" "OffBoardReason",
    "durasi" INTEGER,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Segmen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeaServiceRecord" (
    "id" TEXT NOT NULL,
    "crewId" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "namaCrew" TEXT NOT NULL,
    "jabatan" TEXT NOT NULL,
    "namaKapal" TEXT NOT NULL,
    "imo" TEXT,
    "onBoardTanggal" TIMESTAMP(3) NOT NULL,
    "offBoardTanggal" TIMESTAMP(3),
    "onBoardPelabuhan" TEXT NOT NULL,
    "offBoardPelabuhan" TEXT,
    "totalHari" INTEGER NOT NULL,
    "tanggalGenerate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeaServiceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payroll" (
    "id" TEXT NOT NULL,
    "vesselId" TEXT NOT NULL,
    "bulan" INTEGER NOT NULL,
    "tahun" INTEGER NOT NULL,
    "jumlahHari" INTEGER NOT NULL,
    "status" "PayrollStatus" NOT NULL DEFAULT 'DRAFT',
    "tanggalFinalisasi" TIMESTAMP(3),
    "tanggalPembayaran" TIMESTAMP(3),
    "dibuatOleh" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payroll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollDetail" (
    "id" TEXT NOT NULL,
    "payrollId" TEXT NOT NULL,
    "crewId" TEXT NOT NULL,
    "jabatanKode" TEXT NOT NULL,
    "jabatanNama" TEXT NOT NULL,
    "segmentId" TEXT,
    "periodeKerja" TEXT,
    "hariAktif" INTEGER NOT NULL,
    "gajiPokokSnapshot" INTEGER NOT NULL,
    "gajiProrata" INTEGER NOT NULL,
    "uangMakanSnapshot" INTEGER NOT NULL,
    "uangMakanProrata" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "namaBank" TEXT,
    "noRekening" TEXT,

    CONSTRAINT "PayrollDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeavePayDisbursement" (
    "id" TEXT NOT NULL,
    "crewId" TEXT NOT NULL,
    "tanggalPencairan" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nominal" INTEGER NOT NULL,
    "pencairanKe" INTEGER NOT NULL,
    "masaKerjaSnapshot" INTEGER NOT NULL,
    "catatanPerforma" TEXT,
    "dinilaiOleh" TEXT,
    "dicairkanOleh" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeavePayDisbursement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Kapal_namaUnit_key" ON "Kapal"("namaUnit");

-- CreateIndex
CREATE UNIQUE INDEX "MinimumManning_vesselId_positionCode_key" ON "MinimumManning"("vesselId", "positionCode");

-- CreateIndex
CREATE UNIQUE INDEX "Pelamar_nomorPendaftaran_key" ON "Pelamar"("nomorPendaftaran");

-- CreateIndex
CREATE UNIQUE INDEX "Pelamar_noHp_key" ON "Pelamar"("noHp");

-- CreateIndex
CREATE UNIQUE INDEX "Pelamar_email_key" ON "Pelamar"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Crew_applicantId_key" ON "Crew"("applicantId");

-- CreateIndex
CREATE UNIQUE INDEX "Kontrak_nomorKontrak_key" ON "Kontrak"("nomorKontrak");

-- CreateIndex
CREATE UNIQUE INDEX "SeaServiceRecord_segmentId_key" ON "SeaServiceRecord"("segmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Payroll_vesselId_bulan_tahun_key" ON "Payroll"("vesselId", "bulan", "tahun");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- AddForeignKey
ALTER TABLE "MinimumManning" ADD CONSTRAINT "MinimumManning_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "Kapal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dokumen" ADD CONSTRAINT "Dokumen_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Pelamar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Crew" ADD CONSTRAINT "Crew_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Pelamar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kontrak" ADD CONSTRAINT "Kontrak_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Penempatan" ADD CONSTRAINT "Penempatan_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Penempatan" ADD CONSTRAINT "Penempatan_kontrakId_fkey" FOREIGN KEY ("kontrakId") REFERENCES "Kontrak"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Penempatan" ADD CONSTRAINT "Penempatan_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "Kapal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Segmen" ADD CONSTRAINT "Segmen_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "Penempatan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeaServiceRecord" ADD CONSTRAINT "SeaServiceRecord_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeaServiceRecord" ADD CONSTRAINT "SeaServiceRecord_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "Segmen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payroll" ADD CONSTRAINT "Payroll_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "Kapal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollDetail" ADD CONSTRAINT "PayrollDetail_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "Payroll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollDetail" ADD CONSTRAINT "PayrollDetail_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeavePayDisbursement" ADD CONSTRAINT "LeavePayDisbursement_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE CASCADE ON UPDATE CASCADE;
