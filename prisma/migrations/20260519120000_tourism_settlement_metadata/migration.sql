-- Tourism booking settlement metadata (compatibility v1; backfill in LEGACY_SETTLED_BACKFILL.1).
CREATE TYPE "TourismSettlementMode" AS ENUM (
  'UNKNOWN',
  'LEGACY_SETTLE_ON_BOOK',
  'HOLD_ON_SUBMIT',
  'SETTLE_ON_CONFIRM',
  'PREVIEW_ONLY'
);

ALTER TABLE "TourismBooking" ADD COLUMN "createdAt" TIMESTAMP(3);
ALTER TABLE "TourismBooking" ADD COLUMN "updatedAt" TIMESTAMP(3);
ALTER TABLE "TourismBooking" ADD COLUMN "providerSettledAt" TIMESTAMP(3);
ALTER TABLE "TourismBooking" ADD COLUMN "confirmedAt" TIMESTAMP(3);
ALTER TABLE "TourismBooking" ADD COLUMN "cancelledAt" TIMESTAMP(3);
ALTER TABLE "TourismBooking" ADD COLUMN "cancelReason" TEXT;
ALTER TABLE "TourismBooking" ADD COLUMN "settlementMode" "TourismSettlementMode" NOT NULL DEFAULT 'UNKNOWN';

CREATE INDEX "TourismBooking_status_providerSettledAt_idx" ON "TourismBooking"("status", "providerSettledAt");
CREATE INDEX "TourismBooking_businessId_status_idx" ON "TourismBooking"("businessId", "status");
CREATE INDEX "TourismBooking_settlementMode_idx" ON "TourismBooking"("settlementMode");
