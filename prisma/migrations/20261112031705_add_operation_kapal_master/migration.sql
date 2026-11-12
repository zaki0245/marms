-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "operationKapalId" TEXT;

-- CreateTable
CREATE TABLE "OperationKapal" (
    "id" TEXT NOT NULL,
    "tb" TEXT NOT NULL,
    "bg" TEXT NOT NULL,
    "ownerOperator" TEXT,
    "contactMaster" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationKapal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OperationKapal_tb_bg_key" ON "OperationKapal"("tb", "bg");

-- CreateIndex
CREATE INDEX "Shipment_operationKapalId_idx" ON "Shipment"("operationKapalId");

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_operationKapalId_fkey" FOREIGN KEY ("operationKapalId") REFERENCES "OperationKapal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
