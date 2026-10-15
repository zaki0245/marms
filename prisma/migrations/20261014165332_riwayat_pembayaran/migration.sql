-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "pvNo",
DROP COLUMN "bankCharge",
DROP COLUMN "balance",
DROP COLUMN "amountPaid",
DROP COLUMN "paymentDate";

-- CreateTable
CREATE TABLE "RiwayatPembayaran" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "pvNo" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "nominal" DECIMAL(15,2) NOT NULL,
    "bankCharge" DECIMAL(15,2),
    "balance" DECIMAL(15,2),
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiwayatPembayaran_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RiwayatPembayaran_invoiceId_idx" ON "RiwayatPembayaran"("invoiceId");

-- AddForeignKey
ALTER TABLE "RiwayatPembayaran" ADD CONSTRAINT "RiwayatPembayaran_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
