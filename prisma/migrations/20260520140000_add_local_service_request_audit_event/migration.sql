-- LocalServiceRequestAuditEvent foundation (VIONA.LOCAL.REQUEST_AUDIT_RUNTIME_1).
-- Docs: docs/architecture/VIONA_LOCAL_REQUEST_AUDIT_LOG_DESIGN_1.md

CREATE TYPE "LocalServiceRequestAuditEventType" AS ENUM (
  'REQUEST_CREATED',
  'MERCHANT_REVIEW_STARTED',
  'MERCHANT_CONFIRMED',
  'MERCHANT_REJECTED',
  'USER_CANCELLED',
  'OPS_CANCELLED',
  'REQUEST_EXPIRED',
  'EXPIRY_DRY_RUN_IDENTIFIED',
  'EXPIRY_APPLY_ATTEMPTED',
  'EXPIRY_APPLY_SKIPPED_RACE_CONDITION',
  'EXPIRY_APPLY_COMPLETED'
);

CREATE TYPE "LocalServiceRequestAuditActorType" AS ENUM (
  'REQUESTER',
  'MERCHANT',
  'OPS',
  'SYSTEM',
  'AI_COPILOT_READ_ONLY',
  'AI_ACTION_ASSISTANT_FUTURE'
);

CREATE TABLE "LocalServiceRequestAuditEvent" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "eventType" "LocalServiceRequestAuditEventType" NOT NULL,
  "actorType" "LocalServiceRequestAuditActorType" NOT NULL,
  "actorUserId" TEXT,
  "businessId" TEXT,
  "fromStatus" "LocalServiceRequestStatus",
  "toStatus" "LocalServiceRequestStatus",
  "reason" TEXT,
  "safeMessage" TEXT,
  "metadataJson" JSONB,
  "noWalletAction" BOOLEAN NOT NULL DEFAULT true,
  "walletPhaseSnapshot" "LocalWalletPhase",
  "walletModeSnapshot" "LocalWalletMode",
  "requestOnlyNoChargeSnapshot" BOOLEAN NOT NULL DEFAULT true,
  "idempotencyKey" TEXT,
  "runId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "LocalServiceRequestAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LocalServiceRequestAuditEvent_requestId_createdAt_idx" ON "LocalServiceRequestAuditEvent"("requestId", "createdAt");

CREATE INDEX "LocalServiceRequestAuditEvent_eventType_createdAt_idx" ON "LocalServiceRequestAuditEvent"("eventType", "createdAt");

CREATE INDEX "LocalServiceRequestAuditEvent_actorType_createdAt_idx" ON "LocalServiceRequestAuditEvent"("actorType", "createdAt");

CREATE INDEX "LocalServiceRequestAuditEvent_runId_idx" ON "LocalServiceRequestAuditEvent"("runId");

CREATE INDEX "LocalServiceRequestAuditEvent_idempotencyKey_idx" ON "LocalServiceRequestAuditEvent"("idempotencyKey");

ALTER TABLE "LocalServiceRequestAuditEvent" ADD CONSTRAINT "LocalServiceRequestAuditEvent_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "LocalServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
