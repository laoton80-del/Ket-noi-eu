-- Pack30D-5 real-provider Circuit Breaker — new LlmRouterTaskType enum value (additive only).
-- Docs: docs/internal-ops/VIONA_PACK30D_5_REAL_PROVIDER_PLAN.md §4, §6.
-- NOTE: this migration file is authored and committed for review; it has NOT been applied
-- (no `prisma migrate deploy` / `db push` run) against any database in this change. Deploying it
-- to a real database remains a separate, explicit, future operator-approved step.
-- Does NOT rename or remove any existing enum value, column, or table.

-- AlterEnum
ALTER TYPE "LlmRouterTaskType" ADD VALUE 'VIONA_REAL_EXECUTION_CONTENT';
