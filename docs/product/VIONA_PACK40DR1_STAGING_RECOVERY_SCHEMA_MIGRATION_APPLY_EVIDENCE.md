# Pack40DR1 — Staging Recovery Schema Migration Apply Evidence

Operator authorization: `APPROVE_PACK40DR1_STAGING_RECOVERY_SCHEMA_MIGRATION_APPLY`

Classification: `READY_FOR_PACK40DR1_MIGRATION_EVIDENCE_PR_REVIEW`

## Deployed-schema markers

```text
PACK40DR1_RECOVERY_SCHEMA_APPLIED_TO_STAGING
PACK40DR2_RECOVERY_RUNTIME_NOT_STARTED
PACK40D_INITIAL_CONTROLLED_MERCHANT_EXECUTION_REMAINS_CLOSED_GREEN
```

## 1. Verified master SHA

`0e05f1576e3030ecd335ddd507b8416cd0037bf7`

## 2. PR #378 state and merge commit

| Field | Value |
|---|---|
| State | **MERGED** |
| Title | `feat(viona): add Pack40DR1 recovery schema foundation` |
| Merged at | `2026-07-15T22:20:58Z` |
| Merge commit | `0e05f1576e3030ecd335ddd507b8416cd0037bf7` |
| URL | https://github.com/laoton80-del/Ket-noi-eu/pull/378 |

## 3. Evidence branch and commit

- Branch: `docs/pack40dr1-staging-recovery-schema-migration-apply`
- Starting HEAD = verified master: `0e05f15`
- Evidence commit: recorded at PR open time

## 4. Prisma / PostgreSQL versions

| Item | Value |
|---|---|
| Prisma CLI / Client | **6.19.3** |
| Database provider | PostgreSQL |
| Staging host (redacted) | `db.euqbfanilcssjiwwtcby.supabase.co` |

## 5. Redacted staging database identity

| Label | Value |
|---|---|
| Environment | staging |
| Supabase project ref | `euqbfanilcssjiwwtcby` |
| Database host | `db.euqbfanilcssjiwwtcby.supabase.co` |
| Identity proof | staging ref present in local `DATABASE_URL` / `DIRECT_URL` (values not recorded); `prisma migrate deploy` targeted that host |

Production was not selected. No Fly app deploy.

## 6. Migration path and SHA-256

| Item | Value |
|---|---|
| Path | `prisma/migrations/20260716010000_pack40dr1_add_recovery_fencing_and_provider_reference/migration.sql` |
| SHA-256 | `5e4d5d8e7d81c43c033919ab58e4671552023848a19db50b848f0e4acfe05118` |

## 7. Merged-source integrity result

**PASS**

- `leaseGeneration Int @default(0)` present; non-null
- `leaseOwner` / `leaseExpiresAt` remain
- `providerExternalReference String? @db.VarChar(191)` present
- Digest fields remain (`providerResultDigest`, `providerExternalReferenceDigest`)
- No SMS body / phone / credential fields
- Attempt-state enum unchanged (8 values)
- `VionaRequest.status` remains string lifecycle (no recovery statuses)
- No recovery runtime / D2–D3 behavior change
- Initial controlled Pack40D CLOSED/GREEN marker intact

## 8. Migration SQL safety result

**PASS** — additive only:

- `ADD COLUMN "leaseGeneration" INTEGER NOT NULL DEFAULT 0`
- `ADD COLUMN "providerExternalReference" VARCHAR(191)`
- one partial unique index
- no UPDATE / DELETE / DROP / backfill / enum change / escrow change / recovery tables / triggers

## 9. Local-gate results

| Gate | Result |
|---|---|
| `prisma validate` | PASS |
| `prisma generate` | PASS |
| Pack40DR1 schema suite | **100/100 PASS** |
| `tsc --noEmit` | PASS |
| ESLint Pack40DR1 test | PASS |
| Pack40D3B / D3A / D2 / D1 | PASS |
| Pack40A / B / C | PASS |
| Pack40P + Pack31/30 regressions | PASS |
| Complete non-staging `test-viona-pack*.ts` | **TOTAL_FAILS=0** |

No DB mutation / staging API / provider / escrow during local gates.

## 10. Pre-apply migration state

`npx prisma migrate status`:

- 18 migrations found
- **Exactly one pending:** `20260716010000_pack40dr1_add_recovery_fencing_and_provider_reference`
- Latest successful prior: `20260715120000_pack40d1_add_viona_request_execution_attempt`

## 11. Pre-apply schema-object state

| Object | Pre-apply |
|---|---|
| `leaseGeneration` column | absent |
| `providerExternalReference` column | absent |
| Partial unique reference index | absent |
| Failed/partial DR1 migration record | none |

## 12. Pre-apply aggregate invariants

| Metric | Value |
|---|---|
| Execution attempts | 1 (`completed`) |
| Active attempts | 0 |
| Requests | 12 |
| Provenance | merchant 6 / consumer 1 / legacyUnresolved 5 |
| Statuses | submitted 5 / triage 5 / completed 1 / failed 1 |
| MerchantProfile | 1 |
| Escrow | 2 (SETTLED 1 / REFUNDED 1) |
| Transition events | 10 |
| Audits | 39 |

## 13. Exact migration command

```text
npx prisma migrate deploy --schema prisma/schema.prisma
```

## 14. Migration timestamps

| Event | Timestamp |
|---|---|
| Command start (local) | `2026-07-16T00:27:07+02:00` |
| Command end (local) | `2026-07-16T00:27:11+02:00` |
| `_prisma_migrations.finished_at` | `2026-07-15T22:27:11.756Z` |

## 15. Migration result

**SUCCESS** — exit code 0. Applied exactly:

```text
20260716010000_pack40dr1_add_recovery_fencing_and_provider_reference
```

Post-status: **Database schema is up to date!**

## 16. `_prisma_migrations` result

| Field | Value |
|---|---|
| migration_name | `20260716010000_pack40dr1_add_recovery_fencing_and_provider_reference` |
| finished_at | set |
| rolled_back_at | null |
| Failed DR1 records | **0** |

## 17. leaseGeneration verification

| Check | Result |
|---|---|
| Exists | YES |
| Type | integer |
| NOT NULL | YES |
| Default | `0` |

## 18. providerExternalReference verification

| Check | Result |
|---|---|
| Exists | YES |
| Nullable | YES |
| Max length | **191** |

## 19. Partial unique index verification

| Check | Result |
|---|---|
| Exists | YES |
| Columns | `providerName`, `providerExternalReference` |
| Predicate | `providerExternalReference IS NOT NULL` |
| Catalog name note | PostgreSQL truncated the SQL identifier to 63 chars: `VionaRequestExecutionAttempt_providerName_providerExternalRefer` (definition columns + `WHERE` predicate remain correct) |

Multiple null references remain allowed.

## 20. Existing-row generation result

| Check | Result |
|---|---|
| `leaseGeneration <> 0` count | **0** |
| `leaseGeneration IS NULL` count | **0** |

All existing attempts have `leaseGeneration = 0`.

## 21. Existing-row provider-reference result

| Check | Result |
|---|---|
| `providerExternalReference IS NOT NULL` count | **0** |

## 22. Request / provenance / status preservation

Unchanged vs pre-apply (12 requests; same provenance and status distributions).

## 23. MerchantProfile / escrow preservation

Unchanged (profiles=1; escrow=2 SETTLED/REFUNDED).

## 24. Event / audit preservation

Unchanged (events=10; audits=39).

## 25. Confirmation no runtime recovery occurred

**Confirmed.**

## 26. Confirmation no application deployment occurred

**Confirmed.** No `fly deploy` / restart.

## 27. Confirmation no API / provider / escrow action occurred

**Confirmed.** No authenticated staging API, Twilio, or escrow mutate.

## 28. Confirmation no secret or production action occurred

**Confirmed.**

## 29. Confirmation initial controlled Pack40D remains CLOSED/GREEN

**Confirmed.**

## 30. Confirmation Pack40A/B/C remain CLOSED/GREEN

**Confirmed.**

## 31. Confirmation Pack40DR2 and Pack40S remain unimplemented

**Confirmed.**

## 32. Deployed-schema markers

Recorded above.

## 33. Final classification

`READY_FOR_PACK40DR1_MIGRATION_EVIDENCE_PR_REVIEW`

## Recommended next operator action

Merge this evidence PR, then separately authorize Pack40DR2 dormant recovery services only if desired. Do **not** implement recovery runtime, providers recon HTTP, scheduler, or Pack40S from this apply alone.
