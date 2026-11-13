-- AlterTable
ALTER TABLE "AiCostOperation" ADD COLUMN     "actualCostMicrousd" BIGINT,
ADD COLUMN     "providerRequestId" TEXT,
ADD COLUMN     "settledAt" TIMESTAMP(3),
ADD COLUMN     "usageInputTokens" BIGINT,
ADD COLUMN     "usageOutputTokens" BIGINT;

ALTER TABLE "AiCostOperation"
    ADD CONSTRAINT "AiCostOperation_usageInputTokens_nonnegative"
        CHECK ("usageInputTokens" IS NULL OR "usageInputTokens" >= 0),
    ADD CONSTRAINT "AiCostOperation_usageOutputTokens_nonnegative"
        CHECK ("usageOutputTokens" IS NULL OR "usageOutputTokens" >= 0),
    ADD CONSTRAINT "AiCostOperation_actualCostMicrousd_nonnegative"
        CHECK ("actualCostMicrousd" IS NULL OR "actualCostMicrousd" >= 0),
    ADD CONSTRAINT "AiCostOperation_settled_requires_settledAt"
        CHECK ("status" <> 'SETTLED' OR "settledAt" IS NOT NULL),
    ADD CONSTRAINT "AiCostOperation_actualCost_requires_settled"
        CHECK ("actualCostMicrousd" IS NULL OR "status" = 'SETTLED');

-- CreateIndex
CREATE INDEX "AiCostOperation_status_dispatchedAt_idx" ON "AiCostOperation"("status", "dispatchedAt");

-- CreateIndex
CREATE INDEX "AiCostOperation_subjectId_status_idx" ON "AiCostOperation"("subjectId", "status");
