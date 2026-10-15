-- DropForeignKey
ALTER TABLE "RiwayatPembayaran" DROP CONSTRAINT "RiwayatPembayaran_invoiceId_fkey";

-- DropIndex
DROP INDEX "Invoice_bupot_key";

-- CreateTable
CREATE TABLE "Pv" (
    "id" TEXT NOT NULL,
    "pvNo" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "vendorId" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "vendorNpwp" TEXT,
    "vendorAlamat" TEXT,
    "bankAccountNo" TEXT,
    "bankAccountName" TEXT,
    "bank" TEXT,
    "chequeNo" TEXT,
    "issuedDate" TIMESTAMP(3),
    "bankCharge" DECIMAL(15,2),
    "balance" DECIMAL(15,2),
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pv_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PvItem" (
    "id" TEXT NOT NULL,
    "pvId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "nominal" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "PvItem_pkey" PRIMARY KEY ("id")
);

-- Backfill Pv dari RiwayatPembayaran (group per pvNo)
INSERT INTO "Pv" (
    "id", "pvNo", "tanggal", "vendorId", "vendorName", "vendorNpwp", "vendorAlamat",
    "bankAccountNo", "bankAccountName", "bank", "chequeNo", "issuedDate",
    "bankCharge", "balance", "keterangan", "createdAt", "updatedAt"
)
SELECT
    gen_random_uuid()::text,
    r."pvNo",
    MIN(r."tanggal"),
    i."vendorId",
    i."vendorName",
    i."vendorNpwp",
    i."vendorAlamat",
    i."bankAccountNo",
    i."bankAccountName",
    i."bank",
    'Online Banking',
    MIN(i."issuedDate"),
    COALESCE(SUM(r."bankCharge"), 0),
    COALESCE(SUM(r."balance"), 0),
    MIN(r."keterangan"),
    MIN(r."createdAt"),
    MIN(r."updatedAt")
FROM "RiwayatPembayaran" r
JOIN "Invoice" i ON i."id" = r."invoiceId"
GROUP BY r."pvNo", i."vendorId", i."vendorName", i."vendorNpwp", i."vendorAlamat",
         i."bankAccountNo", i."bankAccountName", i."bank";

-- Backfill PvItem
INSERT INTO "PvItem" ("id", "pvId", "invoiceId", "nominal")
SELECT
    gen_random_uuid()::text,
    p."id",
    r."invoiceId",
    r."nominal"
FROM "RiwayatPembayaran" r
JOIN "Pv" p ON p."pvNo" = r."pvNo";

-- AlterTable (hapus issuedDate dari Invoice, inv jadi opsional)
ALTER TABLE "Invoice" DROP COLUMN "issuedDate",
ALTER COLUMN "inv" DROP NOT NULL;

-- DropTable
DROP TABLE "RiwayatPembayaran";

-- CreateIndex
CREATE UNIQUE INDEX "Pv_pvNo_key" ON "Pv"("pvNo");

-- CreateIndex
CREATE INDEX "PvItem_pvId_idx" ON "PvItem"("pvId");

-- CreateIndex
CREATE INDEX "PvItem_invoiceId_idx" ON "PvItem"("invoiceId");

-- AddForeignKey
ALTER TABLE "Pv" ADD CONSTRAINT "Pv_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PvItem" ADD CONSTRAINT "PvItem_pvId_fkey" FOREIGN KEY ("pvId") REFERENCES "Pv"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PvItem" ADD CONSTRAINT "PvItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
