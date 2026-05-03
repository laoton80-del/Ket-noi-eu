-- Charity ledger (immutable accrual rows) + GDPR erased marker on User.
CREATE TABLE "CharityLedgerEntry" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "kngNetRevenueVig" DOUBLE PRECISION NOT NULL,
    "charityAccrualVig" DOUBLE PRECISION NOT NULL,
    "sourceKind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CharityLedgerEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CharityLedgerEntry_idempotencyKey_key" ON "CharityLedgerEntry"("idempotencyKey");
CREATE INDEX "CharityLedgerEntry_createdAt_idx" ON "CharityLedgerEntry"("createdAt");

ALTER TABLE "User" ADD COLUMN "gdprErasedAt" TIMESTAMP(3);
