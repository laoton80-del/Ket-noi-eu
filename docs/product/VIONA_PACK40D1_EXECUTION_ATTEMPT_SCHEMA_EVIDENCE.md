# Pack40D1 — Execution Attempt Schema Foundation Evidence

Status: **LOCAL SCHEMA + REPOSITORY FOUNDATION COMPLETE — MIGRATION NOT APPLIED**

Operator phrase: `APPROVE_PACK40D1_EXECUTION_ATTEMPT_SCHEMA`

Pack40D2/D3 and Pack40S remain **unimplemented**. Schema is unused by production callers.

---

## 1. Verified master SHA

`79bddbeddd1e615257648b6af3cdef075dd03e7d` — Pack40D foundation refinement PR #368

## 2. PR #368 state

| Field | Value |
|---|---|
| State | **MERGED** |
| Merge commit | `79bddbeddd1e615257648b6af3cdef075dd03e7d` |
| Merged at | **2026-07-15T17:26:37Z** |

## 3. Branch and implementation

- Branch: `feat/pack40d1-execution-attempt-schema-foundation`
- Commit: recorded at push time

## 4. Prisma / database versions

| Item | Value |
|---|---|
| Prisma CLI / Client | **6.19.3** (`package.json` `^6.19.0`) |
| Generator | `prisma-client-js` |
| Provider | PostgreSQL (repository schema) |
| Partial unique index | **PostgreSQL-supported**; **migration-managed** (Prisma schema cannot express it) |

## 5. Final schema design

Additive enums + `VionaRequestExecutionAttempt` model. No request status changes. No provenance enum changes. No `VionaRequest.activeExecutionAttemptId`.

## 6. Attempt-state enum

`VionaRequestExecutionAttemptState`:

- Active: `claimed`, `providerPending`, `providerSucceeded`, `providerFailed`, `outcomeUncertain`
- Terminal: `completed`, `failed`, `abandoned`

## 7. Principal and trigger enums

- `VionaRequestExecutionPrincipalType`: `merchantService` only
- `VionaRequestExecutionTriggerType`: `signedMerchantWebhook`, `internalAuthenticatedController`, `approvedInternalDispatch`
- No `approvedTestHarness` persisted

## 8. Model fields

Identity: `id`, `requestId`, `attemptNumber`, `executionKey`, `state`, `correlationId`

Immutable snapshots: `principalType`, `triggerType`, `triggeringUserId`, `ownerUserIdSnapshot`, `scopeKindSnapshot`, `merchantProfileIdSnapshot`, `tenantIdSnapshot`

Lease: `leaseOwner`, `leaseExpiresAt`, `claimedAt`

Provider: `providerName`, `operationCategory`, `providerIdempotencyKey`, `providerStartedAt`, `providerFinishedAt`, `providerResultDigest`, `providerExternalReferenceDigest`

Outcome: `failureClass`, `failureReasonDigest`, `finalizedAt`, `abandonedAt`

Timestamps: `createdAt`, `updatedAt`

## 9. Immutable versus mutable fields

Repository update APIs mutate only: `state`, lease fields, provider metadata/outcome, bounded failure fields, terminal timestamps, `updatedAt`. Snapshot/identity fields are create-time only.

## 10. Relation and referential action

`requestId` → `VionaRequest.id` with **`onDelete: Restrict`** — execution attempts are audit/recovery records and must not cascade-delete with request convenience.

## 11. No active-attempt FK

`VionaRequest.activeExecutionAttemptId` **not added**. Binding via `requestId` + unique `(requestId, attemptNumber)` + partial unique active index.

## 12. Unique and index design

- Unique `executionKey`
- Unique `(requestId, attemptNumber)`
- Unique `providerIdempotencyKey` (nullable; PostgreSQL allows multiple NULLs)
- Indexes: `requestId`, `(requestId, state)`, `(state, leaseExpiresAt)`, `correlationId`

## 13. Partial unique active-attempt index

Migration-managed:

```sql
CREATE UNIQUE INDEX "VionaRequestExecutionAttempt_one_active_attempt_per_request"
ON "VionaRequestExecutionAttempt" ("requestId")
WHERE "state" IN (
  'claimed','providerPending','providerSucceeded','providerFailed','outcomeUncertain'
);
```

## 14. Migration-only index limitation

Prisma schema syntax in this version cannot express the partial unique index. Documented in `migration.sql` as migration-managed.

## 15. Provider-idempotency field

Nullable `providerIdempotencyKey` with unique constraint. Conceptual future value: `{provider}:{requestId}:{executionAttemptId}:{operationCategory}`. Not generated or used in D1.

## 16. Lease design

Nullable `leaseOwner` / `leaseExpiresAt` / `claimedAt` for D2 population. Repository supports conditional lease updates with expected owner.

## 17. Repository API

`src/repositories/vionaRequestExecutionAttemptRepository.ts`:

- `createVionaRequestExecutionAttempt`
- `findVionaRequestExecutionAttemptById`
- `findVionaRequestExecutionAttemptByExecutionKey`
- `findActiveVionaRequestExecutionAttemptForRequest`
- `findVionaRequestExecutionAttemptByProviderIdempotencyKey`
- `transitionVionaRequestExecutionAttemptState`
- `updateVionaRequestExecutionAttemptLease`
- `recordVionaRequestExecutionAttemptProviderOutcome`
- `findExpiredActiveVionaRequestExecutionAttemptLeases`

Accepts injected `Prisma.TransactionClient` slice. No global Prisma. No status/event/audit/provider imports.

## 18. Conditional-update behavior

All lifecycle mutations use `updateMany` with attempt ID + expected state (+ optional expected lease owner). Zero-row updates return `{ updated: false }`.

## 19. Runtime non-wiring proof

Static tests confirm no import of the repository from controllers, routes, orchestrator, dispatch, Pack40A/B/C, escrow, or Twilio adapters.

## 20. Migration safety

Path: `prisma/migrations/20260715120000_pack40d1_add_viona_request_execution_attempt/migration.sql`

Additive only. No UPDATE/DELETE/INSERT/DROP/backfill. Not applied.

## 21. No-backfill conclusion

New table only. Existing `VionaRequest` rows unchanged. No backfill required.

## 22–25. Test / Prisma / typecheck / lint

| Gate | Result |
|---|---|
| Pack40D1 suite | **47/47 PASS** |
| `prisma validate` | **PASS** |
| `prisma generate` | **PASS** |
| `prisma format` | **PASS** (MerchantProfile spacing restored to master to keep Pack40P1 string contracts) |
| `tsc --noEmit` | **PASS** |
| ESLint (touched TS) | **PASS** |
| Pack40A | **39/39 PASS** |
| Pack40B | **81/81 PASS** |
| Pack40C | **93/93 PASS** |
| Pack40P1 | **21/21 PASS** |
| Pack31 orchestrator | **10/10 PASS** |

## 26. Exact files changed

1. `prisma/schema.prisma`
2. `prisma/migrations/20260715120000_pack40d1_add_viona_request_execution_attempt/migration.sql`
3. `src/repositories/vionaRequestExecutionAttemptRepository.ts`
4. `scripts/test-viona-pack40d1-execution-attempt-schema.ts`
5. `docs/product/VIONA_PACK40D1_EXECUTION_ATTEMPT_SCHEMA_EVIDENCE.md`
6. `docs/product/VIONA_PACK40_TENANT_SCOPE_ENFORCEMENT_PLAN.md`
7. `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`
8. `Handoff_VIONA11726.txt`

## 27–31. Confirmations

- Migration **not applied**
- No DB / staging / shadow DB access for apply
- No provider / orchestrator / status mutation
- Pack40A/B/C remain **CLOSED/GREEN**
- Pack40D2/D3 and Pack40S remain **unimplemented**
- Consumer and legacy indirect execution remain unsupported by policy (schema stores snapshots only)

## 32. Final classification

**`READY_FOR_PACK40D1_SCHEMA_PR_REVIEW`**
