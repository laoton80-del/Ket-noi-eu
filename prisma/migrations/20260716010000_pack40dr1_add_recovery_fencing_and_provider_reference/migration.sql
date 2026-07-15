-- Pack40DR1 — additive recovery fencing + exact opaque provider reference (schema only; not applied by this commit).
-- See docs/product/VIONA_PACK40DR_RECOVERY_RECONCILIATION_READINESS_AUDIT.md.
-- Additive only — no existing column dropped/renamed; no data UPDATE/DELETE/backfill.
-- NOTE: this migration file is authored and committed for review; it has NOT been applied
-- (no `prisma migrate deploy` / `db push` run) against any database in this change.

-- AlterTable: monotonic lease fence (constant default; existing rows read as 0)
ALTER TABLE "VionaRequestExecutionAttempt"
ADD COLUMN "leaseGeneration" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: exact opaque provider-issued reference for future reconciliation (nullable)
ALTER TABLE "VionaRequestExecutionAttempt"
ADD COLUMN "providerExternalReference" VARCHAR(191);

-- Pack40DR1 exact-reference uniqueness: one exact provider operation cannot bind two attempts.
-- Null references remain allowed (multiple NULLs). Prisma cannot express this partial unique index;
-- it is migration-managed.
CREATE UNIQUE INDEX "VionaRequestExecutionAttempt_providerName_providerExternalReference_key"
ON "VionaRequestExecutionAttempt" ("providerName", "providerExternalReference")
WHERE "providerExternalReference" IS NOT NULL;
