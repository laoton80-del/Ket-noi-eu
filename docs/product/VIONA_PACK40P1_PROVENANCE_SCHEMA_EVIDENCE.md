# Pack40P1 — Provenance Schema Evidence

Status: **IMPLEMENTATION COMPLETE — MIGRATION NOT APPLIED**

Operator phrase: `APPROVE_PACK40P1_PROVENANCE_SCHEMA_IMPLEMENTATION`

Deployment-lock markers:

```text
SCHEMA_COMMITTED_MIGRATION_NOT_APPLIED
DEPLOYMENT_BLOCKED_FOR_ENVIRONMENTS_WITHOUT_MIGRATION
```

---

## 1. Verified master SHA

`764cb160b043fb9c0573596d252b16128af73a66` (includes Pack40P rollout/deployment-gate refinement via PR #344)

## 2. PR #344 merge state

**MERGED** @ `2026-07-14T20:14:39Z`, merge commit `764cb160b043fb9c0573596d252b16128af73a66`

## 3. Implementation branch and commit

- Branch: `feat/pack40p1-provenance-schema-implementation`
- Commit: recorded at PR open time

## 4. Enum definition

```prisma
enum VionaRequestScopeKind {
  consumer
  merchant
  legacyUnresolved
}
```

## 5. VionaRequest fields

```prisma
scopeKind         VionaRequestScopeKind @default(legacyUnresolved)
merchantProfileId String?
merchantProfile   MerchantProfile?      @relation(fields: [merchantProfileId], references: [id], onDelete: Restrict)
```

## 6. MerchantProfile relation semantics

- Back relation: `vionaRequests VionaRequest[]`
- FK: `VionaRequest.merchantProfileId` → `MerchantProfile.id`
- `onDelete: Restrict` (no cascade)
- Merchant `isActive` unchanged — deactivation does not alter provenance

## 7. Indexes

- `@@index([scopeKind])` → `VionaRequest_scopeKind_idx`
- `@@index([merchantProfileId])` → `VionaRequest_merchantProfileId_idx`

## 8. Migration operations

File: `prisma/migrations/20260714120000_pack40p1_add_viona_request_provenance/migration.sql`

1. `CREATE TYPE "VionaRequestScopeKind" AS ENUM (...)`
2. `ALTER TABLE "VionaRequest" ADD COLUMN "scopeKind" ... DEFAULT 'legacyUnresolved'`
3. `ALTER TABLE "VionaRequest" ADD COLUMN "merchantProfileId" TEXT`
4. `CREATE INDEX` on `scopeKind` and `merchantProfileId`
5. `ADD CONSTRAINT ... FOREIGN KEY ... ON DELETE RESTRICT ON UPDATE CASCADE`

## 9. Existing rows default only to `legacyUnresolved`

Column default `legacyUnresolved` applies at migration apply time. No `UPDATE`/`INSERT` in migration.

## 10. No row receives consumer or merchant provenance

Migration contains no assignment of `consumer` or `merchant` to existing rows.

## 11. Migration static-safety scan

No `DROP`, `TRUNCATE`, `DELETE`, `UPDATE`, `INSERT`, or `UPSERT` statements. Verified by structural test suite.

## 12. Structural test results

`npx tsx scripts/test-viona-pack40p1-provenance-schema.ts` — **22/22 PASS**

## 13. Prisma validation

`npx prisma validate` — **PASS**

## 14. Prisma generation

`npx prisma generate` — **PASS** (local `node_modules` only; no tracked generated files in diff)

## 15. Typecheck

`npx tsc --noEmit` — **PASS** (0 errors)

## 16. Lint

`npx eslint scripts/test-viona-pack40p1-provenance-schema.ts` — **PASS** (0 errors)

## 17. Full local regression

All `scripts/test-viona-pack*.ts` suites except live-staging Pack36A — **24/24 PASS**

## 18. Changed-file inventory

1. `prisma/schema.prisma`
2. `prisma/migrations/20260714120000_pack40p1_add_viona_request_provenance/migration.sql`
3. `scripts/test-viona-pack40p1-provenance-schema.ts`
4. `docs/product/VIONA_PACK40P1_PROVENANCE_SCHEMA_EVIDENCE.md`
5. `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`
6. `Handoff_VIONA11726.txt`

## 19. Migration not applied

No `prisma migrate deploy`, `migrate dev`, `db push`, or SQL execution was performed.

## 20. No database accessed

No database connection, query, or migration status inspection.

## 21. No create-path behavior change

Pack19 and Pack35 create paths unchanged — verified by structural test source scans.

## 22. No access policy change

`vionaRequestAccessScope.ts` unchanged.

## 23. No deployment or staging call

No Fly command, HTTP call, or environment mutation.

## 24. Deployment-lock state

```text
SCHEMA_COMMITTED_MIGRATION_NOT_APPLIED
DEPLOYMENT_BLOCKED_FOR_ENVIRONMENTS_WITHOUT_MIGRATION
```

## 25. Pack40A remains blocked

Pack40A enforcement not implemented. Next authorized step after P1 merge: **`APPROVE_PACK40P3_STAGING_PROVENANCE_MIGRATION_APPLY`** (staging migrate only — separate phrase; does not authorize deploy).

## 26. Final classification

`READY_FOR_PACK40P1_SCHEMA_PR_REVIEW`
