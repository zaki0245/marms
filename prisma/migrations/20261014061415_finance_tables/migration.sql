-- CreateEnum
CREATE TYPE "InvoiceCategory" AS ENUM ('FREIGHT', 'OPERATION', 'OTHERS');

-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('REGULAR', 'DP', 'PELUNASAN');

-- CreateEnum
CREATE TYPE "FakturPajakStatus" AS ENUM ('SUDAH_DITERIMA', 'BELUM_DITERIMA', 'TIDAK_ADA');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('BELUM_BAYAR', 'SEBAGIAN', 'LUNAS');

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "npwp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorBank" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "accountNo" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "bank" TEXT NOT NULL,

    CONSTRAINT "VendorBank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "no" TEXT NOT NULL,
    "pvNo" TEXT NOT NULL,
    "kategori" "InvoiceCategory" NOT NULL DEFAULT 'OTHERS',
    "tipe" "InvoiceType" NOT NULL DEFAULT 'REGULAR',
    "tanggal" TIMESTAMP(3) NOT NULL,
    "bupot" TEXT,
    "vendorId" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "vendorNpwp" TEXT,
    "bankAccountNo" TEXT,
    "bankAccountName" TEXT,
    "bank" TEXT,
    "inv" TEXT NOT NULL,
    "ref" TEXT,
    "keterangan" TEXT,
    "dpp" DECIMAL(15,2) NOT NULL,
    "ppn" DECIMAL(15,2),
    "pphPasal" TEXT,
    "pph" DECIMAL(15,2),
    "bankCharge" DECIMAL(15,2),
    "balance" DECIMAL(15,2),
    "total" DECIMAL(15,2) NOT NULL,
    "issuedDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "masaPajakPPN" TEXT,
    "masaPajakPPH" TEXT,
    "statusFakturPajak" "FakturPajakStatus" NOT NULL DEFAULT 'BELUM_DITERIMA',
    "statusPembayaran" "PaymentStatus" NOT NULL DEFAULT 'BELUM_BAYAR',
    "parentInvoiceId" TEXT,
    "incomplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FakturPajak" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "nomor" TEXT NOT NULL,

    CONSTRAINT "FakturPajak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PembayaranPV" (
    "id" TEXT NOT NULL,
    "pvNo" TEXT NOT NULL,
    "tanggalBayar" TIMESTAMP(3) NOT NULL,
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PembayaranPV_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PembayaranDetail" (
    "id" TEXT NOT NULL,
    "pembayaranId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amountPaid" DECIMAL(15,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL,

    CONSTRAINT "PembayaranDetail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_nama_key" ON "Vendor"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_no_key" ON "Invoice"("no");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_bupot_key" ON "Invoice"("bupot");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_vendorId_inv_key" ON "Invoice"("vendorId", "inv");

-- CreateIndex
CREATE UNIQUE INDEX "PembayaranPV_pvNo_key" ON "PembayaranPV"("pvNo");

-- AddForeignKey
ALTER TABLE "VendorBank" ADD CONSTRAINT "VendorBank_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_parentInvoiceId_fkey" FOREIGN KEY ("parentInvoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FakturPajak" ADD CONSTRAINT "FakturPajak_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PembayaranDetail" ADD CONSTRAINT "PembayaranDetail_pembayaranId_fkey" FOREIGN KEY ("pembayaranId") REFERENCES "PembayaranPV"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PembayaranDetail" ADD CONSTRAINT "PembayaranDetail_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
