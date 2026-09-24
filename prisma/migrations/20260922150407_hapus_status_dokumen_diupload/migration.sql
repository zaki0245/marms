/*
  Warnings:

  - The values [DOKUMEN_DIUPLOAD] on the enum `ApplicantStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ApplicantStatus_new" AS ENUM ('BARU', 'VERIFIKASI', 'INTERVIEW', 'DITERIMA', 'DITOLAK');
ALTER TABLE "public"."Pelamar" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Pelamar" ALTER COLUMN "status" TYPE "ApplicantStatus_new" USING ("status"::text::"ApplicantStatus_new");
ALTER TYPE "ApplicantStatus" RENAME TO "ApplicantStatus_old";
ALTER TYPE "ApplicantStatus_new" RENAME TO "ApplicantStatus";
DROP TYPE "public"."ApplicantStatus_old";
ALTER TABLE "Pelamar" ALTER COLUMN "status" SET DEFAULT 'BARU';
COMMIT;
