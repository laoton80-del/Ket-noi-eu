-- Pack31 financial gateway & escrow — VionaRequestEscrowHold (additive only).
-- Docs: docs/product/VIONA_PACK31_FINANCIAL_ESCROW_PLAN.md
-- NOTE: this migration file is authored and committed for review; it has NOT been applied
-- (no `prisma migrate deploy` / `db push` run) against any database in this change. Deploying
-- it to a real database remains a separate, explicit, future operator-approved step.
-- Does NOT touch `Wallet` / `Transaction` columns — those remain unchanged (legacy VIG fields).

-- CreateEnum
CREATE TYPE "VionaRequestEscrowHoldStatus" AS ENUM ('HELD', 'SETTLED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'FAILED');

-- AlterEnum
ALTER TYPE "TxType" ADD VALUE 'VIONA_REQUEST_EXECUTION_SETTLED';

-- CreateTable
CREATE TABLE "VionaRequestEscrowHold" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "estimatedAmountVIO" DOUBLE PRECISION NOT NULL,
    "heldAmountVIO" DOUBLE PRECISION NOT NULL,
    "settledAmountVIO" DOUBLE PRECISION,
    "refundedAmountVIO" DOUBLE PRECISION,
    "status" "VionaRequestEscrowHoldStatus" NOT NULL DEFAULT 'HELD',
    "holdTransactionId" TEXT NOT NULL,
    "settleTransactionId" TEXT,
    "refundTransactionId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" TIMESTAMP(3),

    CONSTRAINT "VionaRequestEscrowHold_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VionaRequestEscrowHold_holdTransactionId_key" ON "VionaRequestEscrowHold"("holdTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "VionaRequestEscrowHold_settleTransactionId_key" ON "VionaRequestEscrowHold"("settleTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "VionaRequestEscrowHold_refundTransactionId_key" ON "VionaRequestEscrowHold"("refundTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "VionaRequestEscrowHold_idempotencyKey_key" ON "VionaRequestEscrowHold"("idempotencyKey");

-- CreateIndex
CREATE INDEX "VionaRequestEscrowHold_requestId_actionId_idx" ON "VionaRequestEscrowHold"("requestId", "actionId");

-- CreateIndex
CREATE INDEX "VionaRequestEscrowHold_userId_status_idx" ON "VionaRequestEscrowHold"("userId", "status");

-- AddForeignKey
ALTER TABLE "VionaRequestEscrowHold" ADD CONSTRAINT "VionaRequestEscrowHold_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "VionaRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
