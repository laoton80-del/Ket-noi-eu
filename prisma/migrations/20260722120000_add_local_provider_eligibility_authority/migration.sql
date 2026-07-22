-- Structure-only: Local provider eligibility authority (FC-P0 Pack A1).
-- Docs: docs/product/VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_PLAN_TIMESTAMP_REFERENTIAL_PATCH_FINALIZATION.md
-- ZERO eligibility/audit rows. ZERO Business activation. No seed/backfill.

CREATE TYPE "LocalProviderEligibilityStatus" AS ENUM (
  'DRAFT',
  'ACTIVE',
  'SUSPENDED',
  'RETIRED'
);

CREATE TYPE "LocalProviderEligibilityAuditEventType" AS ENUM (
  'REGISTERED',
  'CONFIG_UPDATED',
  'ACTIVATED',
  'SUSPENDED',
  'RETIRED'
);

CREATE TYPE "LocalProviderEligibilityAuditActorType" AS ENUM (
  'ROLE_ADMIN'
);

CREATE TABLE "LocalProviderEligibility" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "status" "LocalProviderEligibilityStatus" NOT NULL DEFAULT 'DRAFT',
  "publicB2cVisible" BOOLEAN NOT NULL DEFAULT false,
  "supportedServiceTypes" "LocalServiceType"[] NOT NULL DEFAULT ARRAY[]::"LocalServiceType"[],
  "activatedAt" TIMESTAMP(3),
  "suspendedAt" TIMESTAMP(3),
  "retiredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LocalProviderEligibility_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LocalProviderEligibility_businessId_key" ON "LocalProviderEligibility"("businessId");

CREATE INDEX "LocalProviderEligibility_status_publicB2cVisible_idx" ON "LocalProviderEligibility"("status", "publicB2cVisible");

ALTER TABLE "LocalProviderEligibility" ADD CONSTRAINT "LocalProviderEligibility_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "LocalProviderEligibilityAuditEvent" (
  "id" TEXT NOT NULL,
  "eligibilityId" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "eventType" "LocalProviderEligibilityAuditEventType" NOT NULL,
  "actorType" "LocalProviderEligibilityAuditActorType" NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "priorStatus" "LocalProviderEligibilityStatus",
  "nextStatus" "LocalProviderEligibilityStatus" NOT NULL,
  "priorPublicB2cVisible" BOOLEAN,
  "nextPublicB2cVisible" BOOLEAN NOT NULL,
  "priorSupportedServiceTypes" "LocalServiceType"[] NOT NULL DEFAULT ARRAY[]::"LocalServiceType"[],
  "nextSupportedServiceTypes" "LocalServiceType"[] NOT NULL DEFAULT ARRAY[]::"LocalServiceType"[],
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "LocalProviderEligibilityAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LocalProviderEligibilityAuditEvent_eligibilityId_createdAt_idx"
  ON "LocalProviderEligibilityAuditEvent"("eligibilityId", "createdAt");

CREATE INDEX "LocalProviderEligibilityAuditEvent_businessId_createdAt_idx"
  ON "LocalProviderEligibilityAuditEvent"("businessId", "createdAt");

CREATE INDEX "LocalProviderEligibilityAuditEvent_actorUserId_createdAt_idx"
  ON "LocalProviderEligibilityAuditEvent"("actorUserId", "createdAt");

CREATE INDEX "LocalProviderEligibilityAuditEvent_eventType_createdAt_idx"
  ON "LocalProviderEligibilityAuditEvent"("eventType", "createdAt");

ALTER TABLE "LocalProviderEligibilityAuditEvent" ADD CONSTRAINT "LocalProviderEligibilityAuditEvent_eligibilityId_fkey"
  FOREIGN KEY ("eligibilityId") REFERENCES "LocalProviderEligibility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LocalProviderEligibilityAuditEvent" ADD CONSTRAINT "LocalProviderEligibilityAuditEvent_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
