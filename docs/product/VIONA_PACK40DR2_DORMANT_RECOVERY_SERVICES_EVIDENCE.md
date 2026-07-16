# Pack40DR2 — Dormant Recovery and Reconciliation Services Evidence

Operator authorization: `APPROVE_PACK40DR2_DORMANT_RECOVERY_SERVICES`

Classification: `READY_FOR_PACK40DR2_DORMANT_RECOVERY_PR_REVIEW`

## Deployed-runtime markers

```text
PACK40DR1_RECOVERY_SCHEMA_APPLIED_TO_STAGING
PACK40DR2_DORMANT_RECOVERY_SERVICES_IMPLEMENTED
PACK40DR2_RECOVERY_RUNTIME_NOT_WIRED
PACK40DR2_PROVIDER_REFERENCE_RUNTIME_POPULATION_NOT_WIRED
PACK40D_INITIAL_CONTROLLED_MERCHANT_EXECUTION_REMAINS_CLOSED_GREEN
```

## 1. Verified master SHA

`f184120bb70927fbb699e43a80bae22ec0e0ad32`

## 2. PR #379 state and merge commit

| Field | Value |
|---|---|
| State | **MERGED** |
| Title | `docs(viona): record Pack40DR1 staging migration apply` |
| Merged at | `2026-07-15T22:31:15Z` |
| Merge commit | `f184120bb70927fbb699e43a80bae22ec0e0ad32` |
| URL | https://github.com/laoton80-del/Ket-noi-eu/pull/379 |

## 3. Branch and implementation commit

- Branch: `feat/pack40dr2-dormant-recovery-services`
- Starting HEAD = verified master: `f184120`
- Implementation commit: recorded at PR open time

## 4. Pack40DR1 staging schema state

- Migration `20260716010000_pack40dr1_add_recovery_fencing_and_provider_reference` **APPLIED TO STAGING** (evidence PR #379)
- `leaseGeneration` integer NOT NULL default 0
- `providerExternalReference` varchar(191) nullable
- Partial unique index present (PG name truncated to 63 chars; columns + predicate correct)
- **No schema or migration change in Pack40DR2**

## 5. System-recovery principal design

Dormant service-level principal (`vionaRequestSystemRecoveryPrincipal.ts`):

- `principalType: systemRecovery`
- `triggerType: operatorInternalRecovery`
- `triggeringUserId` + `correlationId` required
- Trusted internal constructor only; rejects public customer, merchant execution, and tenant/profile authority inputs
- **Not** a Prisma execution-principal enum value
- Audit representable via existing `vionaRequestAuditEvent` metadata (`actorRoleLabel: execution_recovery_service`)
- Cannot create attempts or start provider sends

## 6. Recovery lease CAS design

`acquireRecoveryLease` / `acquireVionaRequestExecutionAttemptRecoveryLease`:

```text
exact attempt ID
AND expected recoverable attempt state
AND leaseGeneration = expectedLeaseGeneration
AND (lease expired OR leaseOwner null)
```

On success atomically: new lease owner, new lease expiry, `leaseGeneration` incremented by exactly 1. Zero-row CAS observable. No request-status or attempt-state mutation during lease acquisition alone.

## 7. Lease-generation fencing

All post-lease DR2 mutations require exact attempt ID + recovery lease owner + current `leaseGeneration` + non-expired lease + expected attempt state. Stale generation produces no state/event/audit/escrow side effect.

## 8. Recoverable-state policy

| State | DR2 behavior |
|---|---|
| `claimed` (expired lease) | Operator review: `unstarted_attempt_requires_operator_decision` — no provider invoke, no abandon |
| `providerPending` / `outcomeUncertain` | Requires exact persisted `providerExternalReference`; missing → `provider_reference_missing_operator_review` |
| `providerSucceeded` | Eligible for escrow-success reconciliation + recovered completion |
| `providerFailed` | Eligible for escrow-failure reconciliation + recovered failure |
| `outcomeUncertain` (with reference) | Provider reconciliation only; no escrow/finalization |
| `completed` / `failed` / `abandoned` | Terminal immutable |

## 9. Claimed-attempt operator-review policy

Expired `claimed` attempts return operator review classification. No automatic provider invocation, abandonment, second attempt, or terminal finalization.

## 10. Exact provider-reference lookup design

Injected read-only `VionaProviderStatusLookupAdapter` (`vionaProviderStatusLookupContract.ts`):

- Lookup only by exact persisted `providerExternalReference`
- No listing, destination search, send, retry, or credential exposure
- Bounded digests only (`knownSuccess` / `knownFailure` / `stillUncertain`)
- Provider lookup occurs **outside** database transactions

## 11. No-provider-send guarantee

No send method on the provider-status contract. Recovery services never invoke Twilio or any live provider adapter. Fake adapter used only in DR2 tests.

## 12. Provider reconciliation result rules

Inside Serializable transaction with generation fence:

- `knownSuccess`: `providerPending | outcomeUncertain → providerSucceeded`
- `knownFailure`: `providerPending | outcomeUncertain → providerFailed` (proven failure only)
- `stillUncertain`: preserve or transition to `outcomeUncertain`
- Never rewrite known success as failure; never infer from escrow/timeout; caller-supplied reference rejected

## 13. Escrow reconciliation rules

Injected `VionaRecoveryEscrowAdapter` (`vionaRecoveryEscrowAdapterContract.ts`):

- Attempt-scoped hold key: `escrow:{requestId}:{attemptId}:{operation}`
- Success path: inspect + idempotent settle only
- Failure path: inspect + idempotent release/refund only
- `outcomeUncertain`: no escrow mutation
- No live escrow implementation invoked in DR2

## 14. Outcome-uncertain behavior

No escrow mutation and no terminal finalization while outcome remains uncertain.

## 15. Recovered completion transaction

`finalizeRecoveredExecutionCompleted` (separate from Pack40D2 finalize):

- Preconditions: `providerSucceeded`, recovery lease owner + generation, non-expired lease, request `inProgress`
- After durable escrow settlement: atomic request `inProgress → completed`, attempt `providerSucceeded → completed`, status event, recovery audit
- Serializable transaction; event/audit failure rolls back terminal writes

## 16. Recovered failure transaction

`finalizeRecoveredExecutionFailed`:

- Preconditions: `providerFailed`, recovery lease owner + generation, non-expired lease, request `inProgress`
- After durable escrow release/refund: atomic request `inProgress → failed`, attempt `providerFailed → failed`, status event, recovery audit

## 17. Event/audit binding

Recovery audits bind: exact request, execution attempt ID, recovery principal category, correlation ID, lease generation, reconciliation/terminal classification via structured `payloadJson`. No raw Twilio SID, escrow ID, or lease owner in committed evidence.

## 18. Stale-generation protections

Lease CAS, provider result recording, escrow-driven finalization, and recovered terminal finalization all reject stale `leaseGeneration` or wrong lease owner with zero side effects.

## 19. Runtime non-wiring proof

Content scan + DR2 suite (cases 79–88):

- No route, controller, orchestrator, webhook, dispatch, scheduler, worker, or application entry point imports DR2 recovery services
- No live Twilio adapter or live escrow runtime path invoked
- Only `scripts/test-viona-pack40dr2-dormant-recovery-services.ts` executes recovery services locally

## 20. Provider-reference population non-wiring

```text
PACK40DR2_PROVIDER_REFERENCE_RUNTIME_POPULATION_NOT_WIRED
```

Pack40D3A/D3B runtime paths unchanged; `providerExternalReference` is read/conditionally written only in dormant DR2 repository helpers — not populated by the currently enabled controlled execution path.

## 21. Test results

| Suite | Result |
|---|---|
| Pack40DR2 dormant recovery | **85/85 PASS** |
| Pack40DR1 schema foundation | **99/99 PASS** (isolation asserts narrowed only for approved dormant DR2 modules + repository CAS helpers; wired-runtime negative coverage preserved) |
| Pack40D3B | **54/54 PASS** |
| Pack40D3A | **62/62 PASS** |
| Pack40D2 | **112/112 PASS** |
| Pack40D1 | **47/47 PASS** |
| Pack40A / B / C | PASS |
| Pack40P1 / P2 / P4 / P5 | PASS |
| Pack31 + Pack30 (+ Pack29–39 local) | PASS |
| Complete non-staging `scripts/test-viona-pack*.ts` | **35/35 PASS** (staging QA scripts excluded) |

## 22. Prisma / typecheck / lint results

| Gate | Result |
|---|---|
| `prisma validate` | PASS |
| `prisma generate` | PASS |
| `tsc --noEmit` | PASS |
| ESLint (touched TypeScript) | PASS (0 errors) |

## 23. Regression results

All required local gates PASS. No database, staging, provider, escrow, deployment, secret, or production action during verification.

## 24. Exact files changed

| Path | Role |
|---|---|
| `src/services/viona/vionaRequestSystemRecoveryPrincipal.ts` | System-recovery principal |
| `src/services/viona/vionaRequestRecoveryLeaseService.ts` | Generation-fenced lease acquisition |
| `src/services/viona/vionaProviderStatusLookupContract.ts` | Read-only provider-status adapter contract |
| `src/services/viona/vionaRequestProviderReconciliationService.ts` | Dormant provider reconciliation |
| `src/services/viona/vionaRecoveryEscrowAdapterContract.ts` | Escrow reconciliation adapter contract |
| `src/services/viona/vionaRequestEscrowReconciliationService.ts` | Dormant escrow reconciliation |
| `src/services/viona/vionaRequestRecoveredFinalizationService.ts` | Generation-fenced recovered finalization |
| `src/repositories/vionaRequestExecutionAttemptRepository.ts` | Narrow CAS / recovery projection helpers |
| `scripts/test-viona-pack40dr2-dormant-recovery-services.ts` | Fake-dependency DR2 test suite |
| `scripts/test-viona-pack40dr1-recovery-schema-foundation.ts` | DR1 isolation allowlist for dormant DR2 |
| `docs/product/VIONA_PACK40DR2_DORMANT_RECOVERY_SERVICES_EVIDENCE.md` | This evidence |
| `docs/product/VIONA_PACK40_TENANT_SCOPE_ENFORCEMENT_PLAN.md` | Canonical plan sync |
| `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md` | Kernel sync |
| `Handoff_VIONA11726.txt` | Handoff sync |

**Not changed:** routes, controllers, orchestrator, webhook handlers, live Twilio adapter, live escrow runtime, scheduler, worker, environment, deployment, `prisma/schema.prisma`, `prisma/migrations/*`.

## 25. Confirmation — no schema / DB / staging / provider / escrow / deploy

**CONFIRMED.** Pack40DR2 is local dormant services + fake-adapter tests only.

## 26. Initial controlled Pack40D remains CLOSED/GREEN

**CONFIRMED.** Pack40D2/D3A/D3B wired runtime paths unchanged.

## 27. Signed-webhook / internal-dispatch status

- Signed-webhook execution: **DISABLED**
- `approvedInternalDispatch`: **UNWIRED**

## 28. Consumer / legacy execution

**UNSUPPORTED** (unchanged).

## 29. Pack40S

**UNIMPLEMENTED / NOT AUTHORIZED** (unchanged).

## 30. Final classification

`READY_FOR_PACK40DR2_DORMANT_RECOVERY_PR_REVIEW`

## 31. Recommended next authorization

Separately authorize **Pack40DR3** (runtime wiring decisions: recovery endpoint, scheduler/worker, `leaseGeneration` propagation in live D2/D3 writers, and `providerExternalReference` persistence on controlled execution). Do **not** auto-continue. Pack40S remains unauthorized.
