-- DropIndex
DROP INDEX "RiwayatPembayaran_invoiceId_idx";

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "vendorAlamat" TEXT;
