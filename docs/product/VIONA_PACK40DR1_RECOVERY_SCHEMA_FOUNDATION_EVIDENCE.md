# Pack40DR1 — Recovery Fencing and Provider Reference Schema Foundation Evidence

Operator authorization: `APPROVE_PACK40DR1_RECOVERY_SCHEMA_PACKET`

Classification: `READY_FOR_PACK40DR1_SCHEMA_PR_REVIEW`

## 1. Verified master SHA

`e50535907f9ea70fbb1d82689a92838278057e01`

## 2. PR #377 merge state and merge commit

| Field | Value |
|---|---|
| State | **MERGED** |
| Title | `docs(viona): audit Pack40D recovery readiness` |
| Merged at | `2026-07-15T22:05:40Z` |
| Merge commit | `e50535907f9ea70fbb1d82689a92838278057e01` |
| URL | https://github.com/laoton80-del/Ket-noi-eu/pull/377 |

## 3. Branch and implementation commit

- Branch: `feat/pack40dr1-recovery-schema-foundation`
- Starting HEAD = verified master: `e505359`
- Implementation commit: recorded at PR open time

## 4. Existing recovery-readiness decision

From Pack40DR audit (PR #377):

- Classification path: `READY_FOR_PACK40DR1_SCHEMA_PACKET`
- Schema decision: `PACK40DR_REQUIRES_RECOVERY_SCHEMA_PACKET`
- Gaps addressed here: monotonic `leaseGeneration` + exact durable `providerExternalReference`

## 5. Lease-generation rationale

`leaseGeneration Int @default(0)` provides a monotonic fence so future recovery ownership acquisition can compare-and-swap:

```text
exact attempt ID
+ expected attempt state
+ expected leaseGeneration
+ expired lease predicate
```

and atomically increment generation. Without it, an expired original worker can race a recoverer.

## 6. Stale-worker fencing semantics

Future Pack40DR2+ writers (not implemented here) must require the expected generation on:

- provider outcome record;
- escrow resolve;
- terminal finalize;
- attempt lifecycle mutations.

DR1 adds the column only; **no** generation-aware runtime writes.

## 7. Exact provider-reference rationale

`providerExternalReference String? @db.VarChar(191)` stores the exact opaque provider-issued identifier (e.g. Twilio MessageSid) so future exact-message status lookup can reconcile `outcomeUncertain` without broad listing or destination inference.

Digests remain for integrity; digests alone cannot reconstruct the SID.

## 8. Database storage vs evidence redaction

| Surface | Exact reference |
|---|---|
| Database at rest | May store exact opaque value (authorized by this pack) |
| Public API / ordinary logs / committed evidence | Must remain redacted; never print SID |

Operating protocol inspection did not prohibit storing an opaque provider operation id at rest. This pack therefore does **not** return `BLOCKED_PROVIDER_REFERENCE_STORAGE_POLICY`.

## 9. Provider-reference privacy rules

- Not a credential / not an access token
- No SMS body, destination, or phone stored in this field
- No provider request/response payload stored
- Never exposed on public DTOs
- Never printed in evidence fixtures

## 10. Partial unique index design

Migration-managed (Prisma cannot express partial unique indexes):

```sql
CREATE UNIQUE INDEX "VionaRequestExecutionAttempt_providerName_providerExternalReference_key"
ON "VionaRequestExecutionAttempt" ("providerName", "providerExternalReference")
WHERE "providerExternalReference" IS NOT NULL;
```

- Multiple null references allowed
- Same exact reference cannot bind two attempts for the same `providerName`
- Digest fields are not broadly uniqued

## 11. Existing-row safety

- `leaseGeneration` added `NOT NULL DEFAULT 0` (constant default; no UPDATE)
- `providerExternalReference` nullable; historical rows remain null
- No SID backfill
- Attempt/request enums unchanged
- Escrow / Pack40A/B/C tables untouched
- No automatic recovery acquisition

## 12. Migration path and checksum

| Item | Value |
|---|---|
| Path | `prisma/migrations/20260716010000_pack40dr1_add_recovery_fencing_and_provider_reference/migration.sql` |
| Name | `pack40dr1_add_recovery_fencing_and_provider_reference` |
| SHA-256 | `5e4d5d8e7d81c43c033919ab58e4671552023848a19db50b848f0e4acfe05118` |

## 13. Migration SQL safety result

| Check | Result |
|---|---|
| Additive ADD COLUMN only | PASS |
| One partial unique index | PASS |
| No UPDATE | PASS |
| No DELETE | PASS |
| No DROP | PASS |
| No backfill | PASS |
| Enums unchanged | PASS |

## 14. Prisma representation decision

- Normal fields in `schema.prisma` (`leaseGeneration`, `providerExternalReference` with `@db.VarChar(191)`)
- Partial unique index **migration SQL only**
- No unsupported preview features
- No unrelated model reformatting
- No `activeExecutionAttemptId`

## 15–18. Local gates

| Gate | Result |
|---|---|
| Pack40DR1 schema suite | **100/100 PASS** |
| `npx prisma validate` | **PASS** |
| `npx prisma generate` | **PASS** (client only; not a DB apply) |
| `npx tsc --noEmit` | **PASS** |
| ESLint Pack40DR1 script | **PASS** |
| Pack40D3B | **54/54 PASS** |
| Pack40D3A | **62/62 PASS** |
| Pack40D2 | **112/112 PASS** |
| Pack40D1 | **47/47 PASS** |
| Pack40A | **39/39 PASS** |
| Pack40B | **81/81 PASS** |
| Pack40C | **93/93 PASS** |
| Pack40P1/P2/P4/P5 | **PASS** |
| Pack31 orchestrator + escrow | **10/10 + 14/14 PASS** |
| Pack30D-5 / Pack30D-8 | **PASS** |
| Complete non-staging `test-viona-pack*.ts` | **TOTAL_FAILS=0** |

No DB connection, staging API, Twilio, escrow mutation, or deploy command during gates.

## 19. Exact files changed

1. `prisma/schema.prisma`
2. `prisma/migrations/20260716010000_pack40dr1_add_recovery_fencing_and_provider_reference/migration.sql`
3. `scripts/test-viona-pack40dr1-recovery-schema-foundation.ts`
4. `docs/product/VIONA_PACK40DR1_RECOVERY_SCHEMA_FOUNDATION_EVIDENCE.md`
5. `docs/product/VIONA_PACK40_TENANT_SCOPE_ENFORCEMENT_PLAN.md`
6. `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`
7. `Handoff_VIONA11726.txt`

## 20. Confirmation migration remains unapplied

**Migration applied: no**

No `prisma migrate deploy`, `migrate dev`, `db push`, `migrate reset`, or `migrate resolve` was run against any database.

## 21. Confirmation no DB/staging/provider/escrow/deploy action occurred

**Confirmed.**

## 22. Confirmation no recovery implementation exists

**Confirmed.** No recovery principal/service/endpoint/scheduler/worker. No repository CAS generation wiring.

## 23. Confirmation no additional trigger was enabled

**Confirmed.** Sole enabled Pack40D runtime trigger remains `internalAuthenticatedController`.

## 24. Confirmation initial controlled Pack40D remains CLOSED/GREEN

**Confirmed** (marker preserved).

## 25. Confirmation Pack40A/B/C remain CLOSED/GREEN

**Confirmed.**

## 26. Confirmation Pack40S remains unimplemented

**Confirmed.**

## 27. Final classification

`READY_FOR_PACK40DR1_SCHEMA_PR_REVIEW`

## 28. Recommended next authorization

After this schema PR merges:

```text
APPROVE_PACK40DR1_STAGING_RECOVERY_SCHEMA_MIGRATION_APPLY
```

(or the operator’s chosen migrate-apply phrase) — staging migration apply only.  
Then separately: `APPROVE_PACK40DR2_DORMANT_RECOVERY_SERVICES`.

Do **not** authorize recovery runtime, Twilio recon lookup, or Pack40S from this pack alone.
