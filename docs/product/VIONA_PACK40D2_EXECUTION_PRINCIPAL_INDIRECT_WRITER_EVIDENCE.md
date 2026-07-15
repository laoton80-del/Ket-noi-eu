# Pack40D2 — Execution Principal and Indirect Status Writer Evidence

Status: **LOCAL IMPLEMENTATION COMPLETE — DORMANT / NOT RUNTIME-WIRED**

Operator phrase: `APPROVE_PACK40D2_EXECUTION_PRINCIPAL_INDIRECT_WRITER`

Classification: **`READY_FOR_PACK40D2_PRINCIPAL_WRITER_PR_REVIEW`**

---

## 1. Verified master SHA

`a4dc273780eef61c994af8cbcef686ca56d7f294`

## 2. PR #370 state and merge commit

| Field | Value |
|---|---|
| State | **MERGED** |
| Merge commit | `a4dc273780eef61c994af8cbcef686ca56d7f294` |
| Merged at | **2026-07-15T18:07:31Z** |
| Title | `docs(viona): record Pack40D1 staging migration apply` |

PR #369 (schema foundation) remains merged @ `85bff59e621fc571e0e75df3ceda76d8daf921d0`.

## 3. Branch and implementation commit

- Branch: `feat/pack40d2-execution-principal-indirect-writer`
- Created from verified `origin/master` @ `a4dc273`
- Implementation commit: recorded at push time

## 4. Pack40D1 staging schema state

Unchanged by Pack40D2 (no DB/staging action):

```text
PACK40D1_EXECUTION_ATTEMPT_SCHEMA_APPLIED_TO_STAGING
PACK40D1_RUNTIME_WIRING_NOT_STARTED
PACK40D2_D3_STILL_REQUIRED
```

Staging attempt table remains empty pending Pack40D3. Pack40D2 does not create staging rows.

## 5. Runtime non-wiring boundary

Pack40D2 services are **not** imported by:

- `vionaRequestExecutionOrchestrator.ts`
- webhook controllers / dispatch
- provider POC controllers / Twilio adapters
- escrow services
- routes / controllers

Static suite scan (test 112) asserts no production caller outside the D2 allowlist.

## 6. Execution-principal design

File: `src/services/viona/vionaRequestExecutionPrincipalContext.ts`

- Distinct from Pack40C status principal (not reused/modified)
- Input: bounded `TrustedExecutionTrigger` only (`triggerType`, `triggeringUserId`, `requestId`, `correlationId`)
- No authoritative client tenant / profile / scope / owner fields
- Resolve `MerchantProfile` via **transaction client** `findUnique({ ownerUserId })`
- Result: `principalType: merchantService` + current profile fields

## 7. Trusted-trigger input

Approved persisted triggers only:

- `signedMerchantWebhook`
- `internalAuthenticatedController`
- `approvedInternalDispatch`

Unsupported / missing user / empty ids → `invalid_trusted_trigger`.

## 8. Current MerchantProfile resolution

Inside Serializable claim transaction only:

1. Validate trigger shape
2. `tx.merchantProfile.findUnique` by trusted `triggeringUserId`
3. Missing → `merchant_execution_not_authorized`
4. Inactive → denied by access-scope builder before claim predicate use

No pre-transaction profile lookup. No global profile scan.

## 9. Merchant-only eligibility

Claim predicate (exact):

```text
id = requestId
status = triage
ownerUserId = currentProfile.ownerUserId
scopeKind = merchant
merchantProfileId = currentProfile.id
tenantId = currentProfile.tenantId
```

Plus: profile `isActive = true` and `triggeringUserId = profile.ownerUserId`.

## 10. Consumer fail-closed behavior

`scopeKind = consumer` → `request_not_eligible_for_claim`. No attempt, status change, event, audit, or lease.

## 11. Legacy and malformed-provenance behavior

Fail closed for `legacyUnresolved`, unsupported scope, null/wrong profile, tenant mismatch, owner mismatch, consumer carrying profile id, inactive/missing profile. No partial side effects.

## 12. Indirect access predicate

File: `src/services/viona/vionaRequestIndirectExecutionAccessScope.ts`

- Merchant-only WHERE builder
- No consumer / legacy / requester / participant OR branches
- No client policy flags

## 13. Attempt-number allocation

`findMaxAttemptNumberForRequest(tx, requestId)` inside the Serializable claim transaction → `next = max + 1`. No `count + 1` outside a transaction. Unique `(requestId, attemptNumber)` remains authoritative with the partial unique active-attempt index.

## 14. Execution-key and lease design

Injectable factories for tests; production defaults:

- execution key: server-generated unique string
- lease owner: server-generated worker identity
- lease expiration: clock + bounded duration (default 15m)
- `providerIdempotencyKey` remains **null** after claim (Pack40D3)

## 15. Serializable claim transaction

```text
validate trigger
→ BEGIN Serializable
→ resolve MerchantProfile through tx
→ require active profile + merchant predicate
→ load authorized triage request
→ verify no active attempt
→ allocate attemptNumber
→ create attempt (claimed) + snapshots + lease
→ conditional update triage → inProgress (exactly one row)
→ status event + stateTransition audit bound to attempt
→ COMMIT
```

No provider/network call inside the transaction. No automatic retry.

## 16. Claim status/event/audit atomicity

Attempt create + request update + status event + audit succeed or roll back together (fake-tx and Prisma error paths covered).

## 17. Attempt snapshot population

Snapshots from current trusted DB/principal state at claim:

- principalType, triggerType, triggeringUserId
- ownerUserIdSnapshot, scopeKindSnapshot, merchantProfileIdSnapshot, tenantIdSnapshot
- correlationId

Not overwritten on finalization.

## 18. Active-attempt conflict behavior

Pre-create active-attempt lookup returns `active_attempt_exists`. Partial unique / serialization conflicts map to `claim_conflict` with rollback. Zero-row request update → rollback of attempt/event/audit.

## 19. Completion transaction

`finalizeVionaRequestExecutionCompleted` — requires attempt `providerSucceeded`, request `inProgress`, matching `requestId` + lease owner, non-expired lease. Atomic:

```text
inProgress → completed (request)
providerSucceeded → completed (attempt)
status event + audit
```

Inactive profile after provider success does **not** block completion (Policy A).

## 20. Failure transaction

`finalizeVionaRequestExecutionFailed` — requires attempt `providerFailed`, same lease/request binding. Atomic `inProgress → failed`.

## 21. Stale-worker protection

Finalization binds `attemptId` + `requestId` + `expectedLeaseOwner`; expired `leaseExpiresAt` fails as `stale_lease_owner`. Wrong/changed lease owner cannot finalize. No lease stealing in D2.

## 22. Outcome-uncertain behavior

`outcomeUncertain` → `uncertain_provider_outcome` (no auto complete/fail). `claimed` / `providerPending` cannot finalize.

## 23. Event/audit attempt binding

| Store | Binding |
|---|---|
| `VionaRequestStatusEvent.reason` | `pack40d2.executionAttemptId=<id>;category=<category>` |
| `VionaRequestAuditEvent` | `eventType=stateTransition`, `actorRoleLabel=execution_service`, `payloadJson.executionAttemptId` + `eventCategory` |

No schema change. No Pack40C/Pack30 post-commit hook as authoritative D2 mechanism.

## 24. No provider-idempotency implementation

`providerIdempotencyKey` not generated or set in D2.

## 25. No provider call

D2 does not import Twilio, POC routes, escrow, or orchestrator provider paths.

## 26. No orchestrator or runtime wiring

Confirmed by static import scan across `src/` (test 112) and targeted runtime-file checks (tests 83–89).

## 27. Test results

| Suite | Result |
|---|---|
| Pack40D2 | **112/112 PASS** |
| Pack40D1 | **47/47 PASS** |
| Pack40A | **39/39 PASS** |
| Pack40B | **81/81 PASS** |
| Pack40C | **93/93 PASS** |
| Pack40P1 | **21/21 PASS** |
| Pack31 orchestrator | **10/10 PASS** |
| Pack30D2 state-machine audit hooks | **11/11 PASS** |
| Pack30D3 frontend audit timeline | **11/11 PASS** |
| Full local non-staging `scripts/test-viona-pack*.ts` | **0 failures** |

## 28. Prisma validation/generation

- `npx prisma validate` — PASS
- `npx prisma generate` — PASS (client 6.19.3)

## 29. Typecheck and lint

- `npx tsc --noEmit` — PASS
- ESLint on touched TS files — PASS

## 30. Regression results

See §27. Pack40A/B/C CLOSED/GREEN preserved. No orchestrator behavior change.

## 31. Exact files changed

1. `src/services/viona/vionaRequestExecutionPrincipalContext.ts` **(new)**
2. `src/services/viona/vionaRequestIndirectExecutionAccessScope.ts` **(new)**
3. `src/services/viona/vionaRequestIndirectStatusActionService.ts` **(new)**
4. `src/repositories/vionaRequestExecutionAttemptRepository.ts` **(narrow):** optional create `id`; `findMaxAttemptNumberForRequest`; transition `expectedRequestId` / `expectedLeaseOwner`
5. `scripts/test-viona-pack40d2-execution-principal-indirect-writer.ts` **(new)**
6. `docs/product/VIONA_PACK40D2_EXECUTION_PRINCIPAL_INDIRECT_WRITER_EVIDENCE.md` **(new)**
7. `docs/product/VIONA_PACK40_TENANT_SCOPE_ENFORCEMENT_PLAN.md` **(state)**
8. `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md` **(state)**
9. `Handoff_VIONA11726.txt` **(state)**

## 32. Confirmation no schema or migration changed

`prisma/schema.prisma` and migrations untouched. D2 uses existing event `reason` + audit `payloadJson` for attempt binding.

## 33. Confirmation no DB or staging action occurred

No `migrate deploy`, no staging HTTP, no DATABASE_URL usage in D2 product code.

## 34. Confirmation Pack40A/B/C remain CLOSED/GREEN

Local suites 39/81/93 PASS; Pack40C sources not modified.

## 35. Confirmation Pack40D3 and Pack40S remain unimplemented

No execution gateway; no Pack40S QA pack. Next step after D2 merge: separately authorize Pack40D3 gateway/provider integration.

## 36. Final classification

`READY_FOR_PACK40D2_PRINCIPAL_WRITER_PR_REVIEW`
