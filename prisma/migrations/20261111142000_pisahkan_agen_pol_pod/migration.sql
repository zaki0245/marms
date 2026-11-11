-- CreateEnum
CREATE TYPE "AgentTipe" AS ENUM ('POL', 'POD');

-- DropIndex
DROP INDEX "OperationAgent_nama_key";

-- AlterTable
ALTER TABLE "OperationAgent" ADD COLUMN     "tipe" "AgentTipe" NOT NULL DEFAULT 'POL';

-- [FUNGSI] Data lama: agen yang hanya dipakai di POD dijadikan agen POD.
-- [ALASAN] Sebelum pemisahan, satu tabel dipakai POL & POD; tipe ditentukan dari pemakaian.
UPDATE "OperationAgent" a
SET "tipe" = 'POD'
WHERE NOT EXISTS (SELECT 1 FROM "Shipment" s WHERE s."agentPolId" = a."id")
  AND EXISTS (SELECT 1 FROM "Shipment" s WHERE s."agentPodId" = a."id");

-- [FUNGSI] Agen yang dipakai POL & POD dibuatkan salinan POD (PIC/kontak disalin).
-- [ALASAN] Satu baris hanya boleh punya satu tipe setelah unique (tipe, nama).
INSERT INTO "OperationAgent" ("id", "tipe", "nama", "pic", "kontak", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'POD', a."nama", a."pic", a."kontak", now(), now()
FROM "OperationAgent" a
WHERE a."tipe" = 'POL'
  AND EXISTS (SELECT 1 FROM "Shipment" s WHERE s."agentPodId" = a."id");

-- [FUNGSI] Arahkan shipment POD lama ke baris agen bertipe POD dengan nama yang sama.
UPDATE "Shipment" s
SET "agentPodId" = p."id"
FROM "OperationAgent" p
WHERE s."agentPodId" IS NOT NULL
  AND p."tipe" = 'POD'
  AND p."nama" = (SELECT o."nama" FROM "OperationAgent" o WHERE o."id" = s."agentPodId");

-- CreateIndex
CREATE UNIQUE INDEX "OperationAgent_tipe_nama_key" ON "OperationAgent"("tipe", "nama");
