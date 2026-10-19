-- DropIndex
DROP INDEX "Pv_approvalToken_key";

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "approvalSentAt" TIMESTAMP(3),
ADD COLUMN     "approvalSentTo" TEXT,
ADD COLUMN     "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'BELUM_DIAPPROVE',
ADD COLUMN     "approvalToken" TEXT,
ADD COLUMN     "approvedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Pv" DROP COLUMN "approvalSentAt",
DROP COLUMN "approvalSentTo",
DROP COLUMN "approvalStatus",
DROP COLUMN "approvalToken",
DROP COLUMN "approvedAt";

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_approvalToken_key" ON "Invoice"("approvalToken");
