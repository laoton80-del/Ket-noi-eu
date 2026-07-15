-- Pack40D1 — additive VionaRequestExecutionAttempt foundation (schema only; not applied by this commit).
-- See docs/product/VIONA_PACK40D_EXECUTION_FOUNDATION_REFINEMENT.md.
-- Additive only — no existing table, column, index, or constraint is altered or dropped.
-- No data mutation: new table only; existing VionaRequest rows unchanged.
-- NOTE: this migration file is authored and committed for review; it has NOT been applied
-- (no `prisma migrate deploy` / `db push` run) against any database in this change.

-- CreateEnum
CREATE TYPE "VionaRequestExecutionAttemptState" AS ENUM (
  'claimed',
  'providerPending',
  'providerSucceeded',
  'providerFailed',
  'outcomeUncertain',
  'completed',
  'failed',
  'abandoned'
);

-- CreateEnum
CREATE TYPE "VionaRequestExecutionPrincipalType" AS ENUM ('merchantService');

-- CreateEnum
CREATE TYPE "VionaRequestExecutionTriggerType" AS ENUM (
  'signedMerchantWebhook',
  'internalAuthenticatedController',
  'approvedInternalDispatch'
);

-- CreateTable
CREATE TABLE "VionaRequestExecutionAttempt" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "executionKey" TEXT NOT NULL,
    "state" "VionaRequestExecutionAttemptState" NOT NULL,
    "correlationId" TEXT NOT NULL,
    "principalType" "VionaRequestExecutionPrincipalType" NOT NULL,
    "triggerType" "VionaRequestExecutionTriggerType" NOT NULL,
    "triggeringUserId" TEXT,
    "ownerUserIdSnapshot" TEXT NOT NULL,
    "scopeKindSnapshot" "VionaRequestScopeKind" NOT NULL,
    "merchantProfileIdSnapshot" TEXT,
    "tenantIdSnapshot" TEXT NOT NULL,
    "leaseOwner" TEXT,
    "leaseExpiresAt" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3),
    "providerName" TEXT,
    "operationCategory" TEXT,
    "providerIdempotencyKey" TEXT,
    "providerStartedAt" TIMESTAMP(3),
    "providerFinishedAt" TIMESTAMP(3),
    "providerResultDigest" TEXT,
    "providerExternalReferenceDigest" TEXT,
    "failureClass" TEXT,
    "failureReasonDigest" TEXT,
    "finalizedAt" TIMESTAMP(3),
    "abandonedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VionaRequestExecutionAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VionaRequestExecutionAttempt_executionKey_key" ON "VionaRequestExecutionAttempt"("executionKey");

-- CreateIndex
CREATE UNIQUE INDEX "VionaRequestExecutionAttempt_providerIdempotencyKey_key" ON "VionaRequestExecutionAttempt"("providerIdempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "VionaRequestExecutionAttempt_requestId_attemptNumber_key" ON "VionaRequestExecutionAttempt"("requestId", "attemptNumber");

-- CreateIndex
CREATE INDEX "VionaRequestExecutionAttempt_requestId_idx" ON "VionaRequestExecutionAttempt"("requestId");

-- CreateIndex
CREATE INDEX "VionaRequestExecutionAttempt_requestId_state_idx" ON "VionaRequestExecutionAttempt"("requestId", "state");

-- CreateIndex
CREATE INDEX "VionaRequestExecutionAttempt_state_leaseExpiresAt_idx" ON "VionaRequestExecutionAttempt"("state", "leaseExpiresAt");

-- CreateIndex
CREATE INDEX "VionaRequestExecutionAttempt_correlationId_idx" ON "VionaRequestExecutionAttempt"("correlationId");

-- Pack40D1 active-attempt invariant: at most one non-terminal attempt per request.
-- Prisma schema cannot express partial unique indexes; this constraint is migration-managed.
CREATE UNIQUE INDEX "VionaRequestExecutionAttempt_one_active_attempt_per_request"
ON "VionaRequestExecutionAttempt" ("requestId")
WHERE "state" IN (
  'claimed',
  'providerPending',
  'providerSucceeded',
  'providerFailed',
  'outcomeUncertain'
);

-- AddForeignKey
ALTER TABLE "VionaRequestExecutionAttempt" ADD CONSTRAINT "VionaRequestExecutionAttempt_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "VionaRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
