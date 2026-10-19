-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('BELUM_DIAPPROVE', 'SUDAH_DIAPPROVE');

-- AlterTable
ALTER TABLE "Pv" ADD COLUMN     "approvalSentAt" TIMESTAMP(3),
ADD COLUMN     "approvalSentTo" TEXT,
ADD COLUMN     "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'BELUM_DIAPPROVE',
ADD COLUMN     "approvalToken" TEXT,
ADD COLUMN     "approvedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Pv_approvalToken_key" ON "Pv"("approvalToken");
