# Pack14D Gate Factory evidence

## Baseline

- **Base:** `origin/master @ 2c15ba9`
- **Branch:** `viona/cursor-request-pack14d-gate-factory-no-product-change`

## Reason

Pack14C required many gate scripts to duplicate Pack14C migration SQL allowlist logic. Pack14D centralizes that logic in `scripts/lib/vionaPackDiffAllowlist.mjs` to reduce drift and false-positive gate failures on future packs.

## Files created

- `scripts/lib/vionaPackDiffAllowlist.mjs`
- `scripts/viona-request-pack14d-gate-factory-check.mjs`
- `docs/product/VIONA_REQUEST_PACK14D_GATE_FACTORY_NO_PRODUCT_CHANGE.md`
- `docs/design/evidence/cursor-request-pack14d-gate-factory/README.md`

## Gate scripts migrated

- `scripts/viona-request-pack13-prisma-schema-implementation-human-approval-recording-check.mjs`
- `scripts/viona-request-pack13-prisma-schema-implementation-approval-packet-check.mjs`
- `scripts/viona-request-inbox-readonly-check.mjs`
- `scripts/viona-request-pack12-prisma-schema-readiness-boundary-check.mjs`
- `scripts/viona-request-schema-design-human-approval-recording-check.mjs`
- `scripts/viona-request-dedicated-store-schema-design-contract-check.mjs`
- `scripts/viona-request-sot-human-approval-recording-check.mjs`
- `scripts/viona-request-sot-founder-architect-signoff-packet-check.mjs`
- `scripts/viona-request-sot-signoff-phase-promotion-readiness-check.mjs`
- `scripts/viona-request-source-of-truth-auth-tenant-mapping-check.mjs`
- `scripts/viona-request-persistence-audit-readiness-check.mjs`

## Adjacent allowlist-only gate scripts

- `scripts/viona-operator-inbox-admin-debug-preview-check.mjs`
- `scripts/viona-operator-inbox-admin-route-readiness-check.mjs`
- `scripts/viona-request-inbox-operator-reference-lab-check.mjs`
- `scripts/viona-request-inbox-reference-lab-check.mjs`

## Pack scope allowlist-only gate scripts

- `scripts/viona-request-pack13c-prisma-schema-implementation-check.mjs`
- `scripts/viona-request-pack14-prisma-migration-human-approval-recording-check.mjs`
- `scripts/viona-request-pack14-prisma-migration-readiness-approval-packet-check.mjs`
- `scripts/viona-request-pack14c-prisma-migration-creation-check.mjs`

## Helper functions

- `PACK14C_MIGRATION_SQL_PATH`
- `isPack14cMigrationSqlPath`
- `isAllowedPack14cMigrationDiffFile`
- `isPrismaSchemaPath`
- `isPrismaMigrationPath`
- `isForbiddenPrismaDiffPath`
- `isPack14cMigrationCreated`
- `isPrismaDiffBlocked`
- `isMigrationsDiffBlocked`

## Safety boundaries

- No `prisma/schema.prisma` change.
- No Pack14C migration SQL change.
- No DB apply.
- No API/adapter/mutation/runtime.
- No product behavior change.

## Gates run

Full VIONA Request Engine gate suite including Pack14D check, Pack14C check, Pack13–Pack2 gates, capability/domain/automation/forbidden/AI gates, `prisma validate`, `tsc`, and smoke.

## Recommendation

**A) Cursor read-only review branch** — Gate Factory refactor only; full gate suite expected PASS.
