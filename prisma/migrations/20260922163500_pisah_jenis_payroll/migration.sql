-- CreateEnum
CREATE TYPE "PayrollJenis" AS ENUM ('GAJI', 'UANG_MAKAN');

-- AlterTable
ALTER TABLE "Payroll" ADD COLUMN "jenis" "PayrollJenis" NOT NULL DEFAULT 'GAJI';

-- AlterUnique
DROP INDEX "Payroll_vesselId_bulan_tahun_key";
CREATE UNIQUE INDEX "Payroll_vesselId_bulan_tahun_jenis_key" ON "Payroll"("vesselId", "bulan", "tahun", "jenis");
