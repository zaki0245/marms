-- CreateEnum
CREATE TYPE "InvoiceJenis" AS ENUM ('AR', 'AP');

-- CreateEnum
CREATE TYPE "VoucherJenis" AS ENUM ('RV', 'PV');

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "Pv" DROP CONSTRAINT "Pv_vendorId_fkey";

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "customerAlamat" TEXT,
ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "customerNpwp" TEXT,
ADD COLUMN     "jenis" "InvoiceJenis" NOT NULL DEFAULT 'AP',
ALTER COLUMN "vendorId" DROP NOT NULL,
ALTER COLUMN "vendorName" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Pv" ADD COLUMN     "customerAlamat" TEXT,
ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "customerNpwp" TEXT,
ADD COLUMN     "jenis" "VoucherJenis" NOT NULL DEFAULT 'PV',
ALTER COLUMN "vendorId" DROP NOT NULL,
ALTER COLUMN "vendorName" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "npwp" TEXT,
    "alamat" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerBank" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "accountNo" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "bank" TEXT NOT NULL,

    CONSTRAINT "CustomerBank_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_nama_key" ON "Customer"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_customerId_inv_key" ON "Invoice"("customerId", "inv");

-- AddForeignKey
ALTER TABLE "CustomerBank" ADD CONSTRAINT "CustomerBank_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pv" ADD CONSTRAINT "Pv_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pv" ADD CONSTRAINT "Pv_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
