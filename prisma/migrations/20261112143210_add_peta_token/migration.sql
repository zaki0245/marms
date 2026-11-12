-- [FUNGSI] Token acak untuk tautan peta publik (menggantikan kode shipment yang mudah ditebak).
ALTER TABLE "Shipment" ADD COLUMN "petaToken" TEXT;

-- Backfill shipment lama dengan token acak.
UPDATE "Shipment" SET "petaToken" = md5(random()::text || clock_timestamp()::text) WHERE "petaToken" IS NULL;

ALTER TABLE "Shipment" ALTER COLUMN "petaToken" SET NOT NULL;
CREATE UNIQUE INDEX "Shipment_petaToken_key" ON "Shipment"("petaToken");
