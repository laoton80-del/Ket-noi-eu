# Pack40D1 — Staging Execution Attempt Migration Apply Evidence

Status: **STAGING MIGRATION APPLIED — RUNTIME WIRING NOT STARTED**

Operator phrase: `APPROVE_PACK40D1_STAGING_EXECUTION_ATTEMPT_MIGRATION_APPLY`

Deployed schema-state markers:

```text
PACK40D1_EXECUTION_ATTEMPT_SCHEMA_APPLIED_TO_STAGING
PACK40D1_RUNTIME_WIRING_NOT_STARTED
PACK40D2_D3_STILL_REQUIRED
```

---

## 1. Verified master SHA

`85bff59e621fc571e0e75df3ceda76d8daf921d0`

## 2. PR #369 state and merge commit

| Field | Value |
|---|---|
| State | **MERGED** |
| Merge commit | `85bff59e621fc571e0e75df3ceda76d8daf921d0` |
| Merged at | **2026-07-15T17:49:36Z** |
| Title | `feat(viona): add Pack40D1 execution attempt foundation` |

## 3. Evidence branch and commit

- Branch: `docs/pack40d1-staging-execution-attempt-migration-apply`
- Commit: recorded at push time

## 4. Prisma and PostgreSQL versions

| Item | Value |
|---|---|
| Prisma CLI / Client | **6.19.3** |
| Database provider | PostgreSQL |
| Staging host (redacted) | `db.euqbfanilcssjiwwtcby.supabase.co` |

## 5. Redacted staging database identity

| Label | Value |
|---|---|
| Environment | staging |
| Fly app (context) | `viona-api-staging-eu` |
| Supabase project ref | `euqbfanilcssjiwwtcby` |
| Database host | `db.euqbfanilcssjiwwtcby.supabase.co` |
| Identity proof | staging ref present in local `DATABASE_URL` and `DIRECT_URL` (values not recorded); `prisma migrate status` targeted that host |

Production was not selected.

## 6. Exact migration path and checksum

| Item | Value |
|---|---|
| Path | `prisma/migrations/20260715120000_pack40d1_add_viona_request_execution_attempt/migration.sql` |
| SHA256 | `554D71392290D99ADE3804E9EE01D83512B0BFD345E584276174AA83E697F2F1` |

## 7. Merged-source integrity result

**PASS**

- Attempt-state enum: exactly 8 approved values
- Principal enum: `merchantService` only
- Trigger enum: three production triggers only; no test-harness/consumer principal
- Model has required request relation, unique execution key, unique `(requestId, attemptNumber)`, nullable unique provider idempotency key, snapshots, lease, provider outcome, bounded failure, timestamps
- Relation `onDelete: Restrict`
- No `VionaRequest.activeExecutionAttemptId`
- Partial unique index present in migration SQL with approved active states
- No request status or provenance enum change
- Repository unused by runtime callers (static suite)

## 8. Migration SQL safety result

**PASS** — additive only; creates approved enums/table/indexes/FK; no UPDATE/DELETE/INSERT/DROP/backfill; no credential literals; partial unique index migration-managed.

## 9. Local gate results

| Gate | Result |
|---|---|
| `prisma validate` | **PASS** |
| `prisma generate` | **PASS** |
| Pack40D1 schema/repository suite | **47/47 PASS** |
| `tsc --noEmit` | **PASS** |
| ESLint (Pack40D1 repository + test) | **PASS** |
| Pack40A | **39/39 PASS** |
| Pack40B | **81/81 PASS** |
| Pack40C | **93/93 PASS** |
| Pack40P1 | **21/21 PASS** |
| Pack31 orchestrator | **10/10 PASS** |

## 10. Pre-apply migration state

`npx prisma migrate status`:

- 17 migrations found
- **Exactly one pending:** `20260715120000_pack40d1_add_viona_request_execution_attempt`
- No unexpected later pending migration
- No failed Pack40D1 ledger record

## 11. Pre-apply schema-object state

| Object | Present before apply |
|---|---|
| Pack40D1 enums | **No** |
| `VionaRequestExecutionAttempt` table | **No** |
| `activeExecutionAttemptId` on VionaRequest | **No** |
| Failed `_prisma_migrations` Pack40D1 row | **No** |

### Pre-apply aggregates

| Metric | Value |
|---|---|
| VionaRequest count | **12** |
| Provenance | consumer **1** / merchant **6** / legacyUnresolved **5** |
| Status | submitted **5** / triage **6** / failed **1** |
| MerchantProfile count | **1** |
| Escrow hold count | **1** |

## 12. Exact migration command

```text
npx prisma migrate deploy --schema prisma/schema.prisma
```

## 13. Migration timestamps

| Event | Timestamp |
|---|---|
| Start | **2026-07-15T19:55:25+02:00** |
| Completion | **2026-07-15T19:55:30+02:00** |

## 14. Migration result

**SUCCESS** — applied only:

```text
20260715120000_pack40d1_add_viona_request_execution_attempt
```

Post-status: **Database schema is up to date!**

## 15. `_prisma_migrations` result

| Field | Value |
|---|---|
| Pack40D1 finished | **Yes** |
| Rolled back | **No** |
| Failed Pack40D1 records | **0** |

## 16. Table and enum verification

Enums present with exact values:

- `VionaRequestExecutionAttemptState` — claimed, providerPending, providerSucceeded, providerFailed, outcomeUncertain, completed, failed, abandoned
- `VionaRequestExecutionPrincipalType` — merchantService
- `VionaRequestExecutionTriggerType` — signedMerchantWebhook, internalAuthenticatedController, approvedInternalDispatch

Table `VionaRequestExecutionAttempt` exists with **29** columns (all reviewed fields present).

## 17. Constraint and index verification

Present:

- unique `executionKey`
- unique `(requestId, attemptNumber)`
- unique `providerIdempotencyKey`
- indexes on `requestId`, `(requestId, state)`, `(state, leaseExpiresAt)`, `correlationId`
- primary key

## 18. Partial unique index predicate

Index `VionaRequestExecutionAttempt_one_active_attempt_per_request` exists with exact active states:

```text
claimed, providerPending, providerSucceeded, providerFailed, outcomeUncertain
```

Terminal states excluded. Verified via `pg_indexes`.

## 19. Foreign-key verification

| Constraint | Delete | Update | Target |
|---|---|---|---|
| `VionaRequestExecutionAttempt_requestId_fkey` | **RESTRICT** | CASCADE | `VionaRequest.id` |

## 20. Execution-attempt row count

**0**

## 21. Request count / provenance / status preservation

| Metric | Pre | Post |
|---|---|---|
| VionaRequest count | 12 | 12 |
| consumer | 1 | 1 |
| merchant | 6 | 6 |
| legacyUnresolved | 5 | 5 |
| submitted | 5 | 5 |
| triage | 6 | 6 |
| failed | 1 | 1 |

Provenance enum values unchanged: consumer / merchant / legacyUnresolved.

## 22. MerchantProfile and escrow preservation

| Metric | Pre | Post |
|---|---|---|
| MerchantProfile count | 1 | 1 |
| Escrow hold count | 1 | 1 |

## 23–31. Confirmations

- No status/event/audit mutation by migration (DDL-only; attempt table empty)
- No application deployment (`fly deploy` not run)
- No API request
- No provider / Twilio / LLM / escrow / tool call
- No backfill / seed / execution-attempt creation
- No secret changed
- Production untouched
- Pack40A/B/C remain **CLOSED/GREEN**
- Pack40D2/D3 and Pack40S remain **unimplemented**
- No Prisma schema, migration SQL, or product source changed in this pack
- Migration evidence merge remains pending

## 32. Final classification

**`READY_FOR_PACK40D1_MIGRATION_APPLY_EVIDENCE_PR_REVIEW`**
