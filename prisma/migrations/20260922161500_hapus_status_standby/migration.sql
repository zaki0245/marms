-- AlterEnum
BEGIN;
CREATE TYPE "VesselStatus_new" AS ENUM ('AKTIF', 'DOCKING');
ALTER TABLE "Kapal" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Kapal" ALTER COLUMN "status" TYPE "VesselStatus_new" USING ("status"::text::"VesselStatus_new");
ALTER TYPE "VesselStatus" RENAME TO "VesselStatus_old";
ALTER TYPE "VesselStatus_new" RENAME TO "VesselStatus";
DROP TYPE "VesselStatus_old";
ALTER TABLE "Kapal" ALTER COLUMN "status" SET DEFAULT 'AKTIF';
COMMIT;
