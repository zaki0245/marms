/*
  Warnings:

  - You are about to drop the `PembayaranDetail` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PembayaranPV` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PembayaranDetail" DROP CONSTRAINT "PembayaranDetail_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "PembayaranDetail" DROP CONSTRAINT "PembayaranDetail_pembayaranId_fkey";

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "amountPaid" DECIMAL(15,2),
ADD COLUMN     "bankAccountId" TEXT;

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "alamat" TEXT;

-- DropTable
DROP TABLE "PembayaranDetail";

-- DropTable
DROP TABLE "PembayaranPV";
