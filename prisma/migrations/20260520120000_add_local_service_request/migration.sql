-- LocalServiceRequest foundation (VIONA.LOCAL.REQUEST_SCHEMA_MIGRATION.1).
-- Docs: docs/architecture/VIONA_LOCAL_REQUEST_SCHEMA_DESIGN_1.md

CREATE TYPE "LocalServiceRequestStatus" AS ENUM (
  'DRAFT',
  'REQUESTED',
  'MERCHANT_REVIEW',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'REJECTED',
  'USER_CANCELLED',
  'OPS_CANCELLED',
  'EXPIRED'
);

CREATE TYPE "LocalWalletMode" AS ENUM (
  'NO_LEDGER_PREVIEW',
  'REQUEST_ONLY_NO_CHARGE',
  'HOLD_ON_SUBMIT',
  'SETTLE_ON_CONFIRM',
  'LEGACY_BOOKING_BRIDGE'
);

CREATE TYPE "LocalWalletPhase" AS ENUM (
  'NONE',
  'HELD',
  'SETTLED',
  'RELEASED',
  'REFUNDED',
  'LEGACY_BRIDGE',
  'PREVIEW'
);

CREATE TYPE "LocalRequestSource" AS ENUM (
  'LOCAL_SCREEN',
  'FIXER_CHECKOUT',
  'LEONA_ASSIST',
  'LEGAL_SCAN',
  'ADMIN_SEED',
  'API_DIRECT'
);

CREATE TYPE "LocalServiceType" AS ENUM (
  'SERVICE_MENU',
  'FIXER_HIRE',
  'GENERIC_REQUEST',
  'LEGAL_INTAKE',
  'CLASSIFIED_LEAD'
);

CREATE TYPE "LocalCancelReason" AS ENUM (
  'USER_CANCEL',
  'PROVIDER_REJECTED',
  'EXPIRED',
  'OPS_CANCEL',
  'SYSTEM_SAFETY_RELEASE',
  'INSUFFICIENT_FUNDS',
  'OTHER'
);

CREATE TABLE "LocalServiceRequest" (
  "id" TEXT NOT NULL,
  "requesterUserId" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "serviceId" TEXT,
  "fixerProfileKey" TEXT,
  "assignedProviderUserId" TEXT,
  "legacyBookingId" TEXT,
  "serviceType" "LocalServiceType" NOT NULL,
  "category" "BizType",
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "locationText" TEXT,
  "city" TEXT,
  "countryCode" TEXT,
  "scheduledStartAt" TIMESTAMP(3),
  "scheduledEndAt" TIMESTAMP(3),
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "merchantReviewDeadlineAt" TIMESTAMP(3),
  "confirmedAt" TIMESTAMP(3),
  "rejectedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "expiredAt" TIMESTAMP(3),
  "providerSettledAt" TIMESTAMP(3),
  "status" "LocalServiceRequestStatus" NOT NULL DEFAULT 'REQUESTED',
  "walletMode" "LocalWalletMode" NOT NULL DEFAULT 'REQUEST_ONLY_NO_CHARGE',
  "walletPhase" "LocalWalletPhase" NOT NULL DEFAULT 'NONE',
  "totalVioCredits" DOUBLE PRECISION,
  "heldVioCredits" DOUBLE PRECISION,
  "releasedVioCredits" DOUBLE PRECISION,
  "platformFeeVioCredits" DOUBLE PRECISION,
  "providerEarningsVioCredits" DOUBLE PRECISION,
  "cancelReason" "LocalCancelReason",
  "rejectReason" "LocalCancelReason",
  "cancelledByRole" TEXT,
  "source" "LocalRequestSource" NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LocalServiceRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LocalServiceRequest_legacyBookingId_key" ON "LocalServiceRequest"("legacyBookingId");

CREATE INDEX "LocalServiceRequest_requesterUserId_createdAt_idx" ON "LocalServiceRequest"("requesterUserId", "createdAt");

CREATE INDEX "LocalServiceRequest_businessId_status_createdAt_idx" ON "LocalServiceRequest"("businessId", "status", "createdAt");

CREATE INDEX "LocalServiceRequest_businessId_merchantReviewDeadlineAt_idx" ON "LocalServiceRequest"("businessId", "merchantReviewDeadlineAt");

CREATE INDEX "LocalServiceRequest_status_walletPhase_idx" ON "LocalServiceRequest"("status", "walletPhase");

CREATE INDEX "LocalServiceRequest_status_merchantReviewDeadlineAt_idx" ON "LocalServiceRequest"("status", "merchantReviewDeadlineAt");

CREATE INDEX "LocalServiceRequest_walletMode_idx" ON "LocalServiceRequest"("walletMode");

CREATE INDEX "LocalServiceRequest_legacyBookingId_idx" ON "LocalServiceRequest"("legacyBookingId");

ALTER TABLE "LocalServiceRequest" ADD CONSTRAINT "LocalServiceRequest_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LocalServiceRequest" ADD CONSTRAINT "LocalServiceRequest_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LocalServiceRequest" ADD CONSTRAINT "LocalServiceRequest_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LocalServiceRequest" ADD CONSTRAINT "LocalServiceRequest_assignedProviderUserId_fkey" FOREIGN KEY ("assignedProviderUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LocalServiceRequest" ADD CONSTRAINT "LocalServiceRequest_legacyBookingId_fkey" FOREIGN KEY ("legacyBookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
