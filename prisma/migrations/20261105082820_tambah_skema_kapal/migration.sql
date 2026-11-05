-- CreateEnum
CREATE TYPE "KapalSkema" AS ENUM ('MILIK', 'SEWA');

-- AlterTable
ALTER TABLE "Kapal" ADD COLUMN     "skema" "KapalSkema" NOT NULL DEFAULT 'MILIK';
