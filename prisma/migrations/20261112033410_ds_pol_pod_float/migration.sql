/*
  Warnings:

  - The `dsPol` column on the `Shipment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `dsPod` column on the `Shipment` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Shipment" DROP COLUMN "dsPol",
ADD COLUMN     "dsPol" DOUBLE PRECISION,
DROP COLUMN "dsPod",
ADD COLUMN     "dsPod" DOUBLE PRECISION;
