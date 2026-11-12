-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "perluApproval" BOOLEAN NOT NULL DEFAULT true;

-- [FUNGSI] Backfill: AR & Freight tidak memakai approval (perilaku lama).
UPDATE "Invoice" SET "perluApproval" = false WHERE "jenis" = 'AR' OR "kategori" = 'FREIGHT';
