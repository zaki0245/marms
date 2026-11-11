-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "agentPodId" TEXT,
ADD COLUMN     "agentPolId" TEXT;

-- CreateTable
CREATE TABLE "OperationAgent" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "pic" TEXT,
    "kontak" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationAgent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OperationAgent_nama_key" ON "OperationAgent"("nama");

-- CreateIndex
CREATE INDEX "Shipment_agentPolId_idx" ON "Shipment"("agentPolId");

-- CreateIndex
CREATE INDEX "Shipment_agentPodId_idx" ON "Shipment"("agentPodId");

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_agentPolId_fkey" FOREIGN KEY ("agentPolId") REFERENCES "OperationAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_agentPodId_fkey" FOREIGN KEY ("agentPodId") REFERENCES "OperationAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- [FUNGSI] Backfill: nama agen dari shipment lama jadi data master agen.
-- [ALASAN] Shipment lama langsung tertaut; PIC/kontak bisa dilengkapi di halaman Agen.
INSERT INTO "OperationAgent" ("id", "nama", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, nama, now(), now()
FROM (
    SELECT DISTINCT btrim("agentPol") AS nama FROM "Shipment" WHERE btrim(coalesce("agentPol", '')) <> ''
    UNION
    SELECT DISTINCT btrim("agentPod") AS nama FROM "Shipment" WHERE btrim(coalesce("agentPod", '')) <> ''
) t
ON CONFLICT ("nama") DO NOTHING;

-- [FUNGSI] Tautkan shipment lama ke agen berdasarkan nama (snapshot teks tetap disimpan).
UPDATE "Shipment" s
SET "agentPolId" = a."id"
FROM "OperationAgent" a
WHERE btrim(coalesce(s."agentPol", '')) = a."nama";

UPDATE "Shipment" s
SET "agentPodId" = a."id"
FROM "OperationAgent" a
WHERE btrim(coalesce(s."agentPod", '')) = a."nama";
