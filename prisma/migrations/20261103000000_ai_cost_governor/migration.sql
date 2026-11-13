-- P0-A1 Cost Governor — additive platform-provider cost ledger only.
-- No existing table, column, model, VIO balance, or credit balance is altered.
-- Runtime environment variables, not this migration or seed data, provide all cost caps.
-- This migration is authored for review and has not been applied to any non-temporary database.

-- CreateTable
CREATE TABLE "AiModelPrice" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "calculationVersion" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "inputMicrousdPerToken" BIGINT NOT NULL DEFAULT 0,
    "outputMicrousdPerToken" BIGINT NOT NULL DEFAULT 0,
    "audioInputMicrousdPerSecond" BIGINT NOT NULL DEFAULT 0,
    "audioOutputMicrousdPerSecond" BIGINT NOT NULL DEFAULT 0,
    "imageMicrousdPerUnit" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiModelPrice_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AiModelPrice_inputMicrousdPerToken_nonnegative" CHECK ("inputMicrousdPerToken" >= 0),
    CONSTRAINT "AiModelPrice_outputMicrousdPerToken_nonnegative" CHECK ("outputMicrousdPerToken" >= 0),
    CONSTRAINT "AiModelPrice_audioInputMicrousdPerSecond_nonnegative" CHECK ("audioInputMicrousdPerSecond" >= 0),
    CONSTRAINT "AiModelPrice_audioOutputMicrousdPerSecond_nonnegative" CHECK ("audioOutputMicrousdPerSecond" >= 0),
    CONSTRAINT "AiModelPrice_imageMicrousdPerUnit_nonnegative" CHECK ("imageMicrousdPerUnit" >= 0),
    CONSTRAINT "AiModelPrice_effectiveRange_valid" CHECK ("effectiveTo" IS NULL OR "effectiveTo" > "effectiveFrom")
);

-- CreateTable
CREATE TABLE "AiCostOperation" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "rail" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "operationKind" TEXT NOT NULL,
    "priceVersionId" TEXT NOT NULL,
    "reservedMicrousd" BIGINT NOT NULL,
    "settledMicrousd" BIGINT NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'RESERVED',
    "windowStartDay" TIMESTAMP(3) NOT NULL,
    "windowStartMonth" TIMESTAMP(3) NOT NULL,
    "dispatchedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiCostOperation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AiCostOperation_rail_valid" CHECK ("rail" IN ('EXPRESS', 'FIREBASE')),
    CONSTRAINT "AiCostOperation_status_valid" CHECK ("status" IN ('RESERVED', 'DISPATCHING', 'OUTCOME_UNKNOWN', 'SETTLED', 'RELEASED')),
    CONSTRAINT "AiCostOperation_reservedMicrousd_nonnegative" CHECK ("reservedMicrousd" >= 0),
    CONSTRAINT "AiCostOperation_settledMicrousd_nonnegative" CHECK ("settledMicrousd" >= 0),
    CONSTRAINT "AiCostOperation_dispatch_state_consistent" CHECK (
      ("status" = 'RESERVED' AND "dispatchedAt" IS NULL)
      OR ("status" IN ('DISPATCHING', 'OUTCOME_UNKNOWN', 'SETTLED') AND "dispatchedAt" IS NOT NULL)
      OR "status" = 'RELEASED'
    ),
    CONSTRAINT "AiCostOperation_expiry_after_create" CHECK ("expiresAt" > "createdAt")
);

-- CreateTable
CREATE TABLE "AiCostLedgerEntry" (
    "id" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "entryType" TEXT NOT NULL,
    "amountMicrousd" BIGINT NOT NULL,
    "previousStatus" TEXT,
    "nextStatus" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiCostLedgerEntry_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AiCostLedgerEntry_entryType_valid" CHECK ("entryType" IN ('RESERVE', 'SETTLE', 'RELEASE', 'ADJUSTMENT')),
    CONSTRAINT "AiCostLedgerEntry_amountMicrousd_nonnegative" CHECK ("amountMicrousd" >= 0)
);

-- CreateTable
CREATE TABLE "AiCostBudgetCounter" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "reservedMicrousd" BIGINT NOT NULL DEFAULT 0,
    "settledMicrousd" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiCostBudgetCounter_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AiCostBudgetCounter_reservedMicrousd_nonnegative" CHECK ("reservedMicrousd" >= 0),
    CONSTRAINT "AiCostBudgetCounter_settledMicrousd_nonnegative" CHECK ("settledMicrousd" >= 0)
);

-- CreateIndex
CREATE UNIQUE INDEX "AiModelPrice_provider_model_effectiveFrom_key" ON "AiModelPrice"("provider", "model", "effectiveFrom");

-- CreateIndex
CREATE INDEX "AiModelPrice_provider_model_effectiveFrom_idx" ON "AiModelPrice"("provider", "model", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "AiCostOperation_subjectId_idempotencyKey_key" ON "AiCostOperation"("subjectId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "AiCostOperation_status_expiresAt_idx" ON "AiCostOperation"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "AiCostOperation_windowStartDay_idx" ON "AiCostOperation"("windowStartDay");

-- CreateIndex
CREATE INDEX "AiCostOperation_windowStartMonth_idx" ON "AiCostOperation"("windowStartMonth");

-- CreateIndex
CREATE INDEX "AiCostLedgerEntry_operationId_createdAt_idx" ON "AiCostLedgerEntry"("operationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AiCostBudgetCounter_scope_windowStart_key" ON "AiCostBudgetCounter"("scope", "windowStart");

-- CreateIndex
CREATE INDEX "AiCostBudgetCounter_windowStart_idx" ON "AiCostBudgetCounter"("windowStart");

-- AddForeignKey
ALTER TABLE "AiCostOperation" ADD CONSTRAINT "AiCostOperation_priceVersionId_fkey" FOREIGN KEY ("priceVersionId") REFERENCES "AiModelPrice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiCostLedgerEntry" ADD CONSTRAINT "AiCostLedgerEntry_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "AiCostOperation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
