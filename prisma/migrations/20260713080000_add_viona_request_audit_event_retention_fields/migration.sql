-- Pack33 global omni-compliance & localization — VionaRequestAuditEvent retention fields
-- (additive only). Docs: docs/product/VIONA_PACK33_GLOBAL_COMPLIANCE_PLAN.md §4, §7.
-- NOTE: this migration file is authored and committed for review; it has NOT been applied
-- (no `prisma migrate deploy` / `db push` run) against any database in this change. Deploying
-- it to a real database remains a separate, explicit, future operator-approved step.
-- Does NOT rename or remove any existing column on VionaRequestAuditEvent or any other table.

-- AlterTable
ALTER TABLE "VionaRequestAuditEvent" ADD COLUMN "retentionRegion" TEXT;
ALTER TABLE "VionaRequestAuditEvent" ADD COLUMN "anonymizedAt" TIMESTAMP(3);
