-- [FUNGSI] Pindahkan nilai DSR lama ke DS selama DS belum diisi.
-- [ALASAN] DS dan DSR adalah nilai yang sama; data lama tidak boleh hilang saat DSR dihapus.
UPDATE "Shipment" SET "dsPol" = "dsrPol" WHERE "dsPol" IS NULL AND "dsrPol" IS NOT NULL;
UPDATE "Shipment" SET "dsPod" = "dsrPod" WHERE "dsPod" IS NULL AND "dsrPod" IS NOT NULL;

-- AlterTable
ALTER TABLE "Shipment" DROP COLUMN "dsrPod",
DROP COLUMN "dsrPol";
