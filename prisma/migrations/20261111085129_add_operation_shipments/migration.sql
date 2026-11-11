-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('PLANNED', 'ON_GOING', 'COMPLETED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'OPERATION';

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "tb" TEXT NOT NULL,
    "bg" TEXT NOT NULL,
    "ownerOperator" TEXT,
    "shipper" TEXT,
    "commodities" TEXT,
    "contactMaster" TEXT,
    "laycan" TEXT,
    "size" DOUBLE PRECISION,
    "pol" TEXT NOT NULL,
    "agentPol" TEXT,
    "picPol" TEXT,
    "contactAgentPol" TEXT,
    "pod" TEXT,
    "agentPod" TEXT,
    "picPod" TEXT,
    "contactAgentPod" TEXT,
    "taPol" TIMESTAMP(3),
    "tbPol" TIMESTAMP(3),
    "slPol" TIMESTAMP(3),
    "clPol" TIMESTAMP(3),
    "coPol" TIMESTAMP(3),
    "tdPol" TIMESTAMP(3),
    "dsPol" TIMESTAMP(3),
    "taPod" TIMESTAMP(3),
    "tbPod" TIMESTAMP(3),
    "sdPod" TIMESTAMP(3),
    "cdPod" TIMESTAMP(3),
    "coPod" TIMESTAMP(3),
    "tdPod" TIMESTAMP(3),
    "dsPod" TIMESTAMP(3),
    "laytimePol" DOUBLE PRECISION,
    "laytimePod" DOUBLE PRECISION,
    "totalLaytime" DOUBLE PRECISION,
    "laytimeAllowed" DOUBLE PRECISION,
    "demurrageDespatch" DOUBLE PRECISION,
    "dsrPol" DOUBLE PRECISION,
    "dsrPod" DOUBLE PRECISION,
    "position" TEXT,
    "remarks" TEXT,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'PLANNED',
    "image" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_kode_key" ON "Shipment"("kode");

-- CreateIndex
CREATE INDEX "Shipment_status_idx" ON "Shipment"("status");
