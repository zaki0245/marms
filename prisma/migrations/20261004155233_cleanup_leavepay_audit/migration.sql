/*
  Warnings:

  - You are about to drop the column `dicairkanOleh` on the `LeavePayDisbursement` table. All the data in the column will be lost.
  - You are about to drop the column `dinilaiOleh` on the `LeavePayDisbursement` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "LeavePayDisbursement" DROP COLUMN "dicairkanOleh",
DROP COLUMN "dinilaiOleh";
