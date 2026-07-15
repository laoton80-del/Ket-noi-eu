# Pack40D — Execution Foundation Refinement

Status: **ARCHITECTURE REFINEMENT COMPLETE — NO IMPLEMENTATION**

Operator phrase: `APPROVE_PACK40D_EXECUTION_FOUNDATION_REFINEMENT`

Pack40D implementation is **not** authorized by this document. No schema, migration, product code, DB, staging, provider, or deployment action was performed.

---

## 1. Verified master SHA

`21e7663497ad2ddf2cea4e669e0988cdc951fc78` — includes Pack40D readiness audit (PR #367 @ `21e7663`)

## 2. PR #367 state

| Field | Value |
|---|---|
| State | **MERGED** |
| Merge commit | `21e7663497ad2ddf2cea4e669e0988cdc951fc78` |
| Merged at | **2026-07-15T17:11:10Z** |
| Title | `docs(viona): audit Pack40D indirect execution readiness` |

## 3. Pack40A / Pack40B / Pack40C closure state

| Slice | State |
|---|---|
| Pack40A | **CLOSED / GREEN** |
| Pack40B | **CLOSED / GREEN** |
| Pack40C | **CLOSED / GREEN** |
| Pack40D readiness audit | **COMPLETE** (PR #367) |
| Pack40D implementation | **UNIMPLEMENTED** |
| Pack40S | **UNIMPLEMENTED** |

## 4. Readiness-audit blockers resolved by this refinement

| Blocker from PR #367 | Refinement resolution |
|---|---|
| `PACK40D_REQUIRES_DIRECT_INDIRECT_STATE_WRITER_SPLIT` | Dedicated `vionaRequestIndirectStatusActionService` (§6) |
| `PACK40D_REQUIRES_EXECUTION_PRINCIPAL_MODEL_REFINEMENT` | `VionaRequestExecutionPrincipal` contract (§7) |
| `PACK40D_REQUIRES_EXECUTION_LEASE_DESIGN` | `VionaRequestExecutionAttempt` model + active-attempt uniqueness (§8–9) |
| `PACK40D_REQUIRES_SIDE_EFFECT_IDEMPOTENCY_PLAN` | Attempt-scoped provider keys + durable invocation record (§13) |
| `PACK40D_REQUIRES_EXECUTION_RECORD_SCHEMA_PLAN` | Schema required (§18) |
| `BLOCKED_LEGACY_EXECUTION_PATH` | Fail-closed eligibility (§5) |
| Provider paths bypass orchestrator claim | Gateway routing table (§14) |

---

## 5. Initial execution eligibility (Design Decision 1)

### Merchant requests — **SUPPORTED (initial Pack40D scope)**

Eligible for **status-changing indirect execution** only when **all** hold at claim time:

```text
scopeKind = merchant
AND merchantProfileId = current MerchantProfile.id
AND tenantId = current MerchantProfile.tenantId
AND MerchantProfile.ownerUserId = trusted trigger principal's triggeringUserId
AND MerchantProfile.isActive = true
AND VionaRequest.ownerUserId = MerchantProfile.ownerUserId
AND VionaRequest.status = triage
AND no other active execution attempt exists
```

Revalidated **immediately before provider invocation**: profile still active; `scopeKind`, `merchantProfileId`, and `tenantId` still match current DB row and attempt snapshot.

### Consumer requests — **NOT SUPPORTED (initial Pack40D)**

```text
CONSUMER_INDIRECT_EXECUTION_NOT_SUPPORTED
```

Consumer rows **fail closed** at the execution gateway before claim, provider call, or indirect status transition. Request ownership alone does not authorize indirect execution.

A future dedicated consumer execution packet must define trusted triggers, consent, provider categories, billing, and recovery before consumer indirect execution is enabled.

### Legacy and malformed provenance — **DENIED**

| Condition | Result |
|---|---|
| `scopeKind = legacyUnresolved` | Deny before claim |
| Unsupported `scopeKind` | Deny |
| Merchant row with missing `merchantProfileId` | Deny |
| Merchant row with tenant mismatch vs current profile | Deny |
| Consumer row with non-null `merchantProfileId` | Deny |
| Caller-supplied tenant/profile fields disagreeing with DB | Deny (fields advisory only) |

---

## 6. Writer-split architecture (Design Decision 2)

### Chosen architecture: **one dedicated indirect status service**

**Service:** `vionaRequestIndirectStatusActionService.ts`

**Rationale:** Pack40C's `transitionVionaRequestStatus` wraps status + audit in a single Serializable transaction suited to a short direct-user transition. Indirect execution requires **claim → external provider (no open DB tx) → finalize** with attempt binding. A single dedicated service owning claim and finalize transactions matches the orchestrator's existing step shape while preserving Pack40C isolation.

### Boundary

| Writer | Principal | Transitions | Owns |
|---|---|---|---|
| **Pack40C** `vionaRequestStatusActionService` | Authenticated owner | `submitted → triage` | Direct user status action + `action.status` audit |
| **Pack40D** `vionaRequestIndirectStatusActionService` | Trusted execution principal | `triage → inProgress`, `inProgress → completed\|failed` | Claim, attempt binding, indirect status events, execution audits, stale-attempt rejection, terminal finalization |

**Forbidden:** Pack40D writer calling or importing Pack40C's `transitionVionaRequestStatus`, principal-context resolver, or access-scope builder.

**Orchestrator role after Pack40D:** Thin coordinator — resolve principal → call indirect writer claim → call provider gateway → call indirect writer finalize. No direct Prisma status writes in orchestrator.

### Supporting modules (forecast)

| Module | Role |
|---|---|
| `vionaRequestExecutionPrincipalContext.ts` | Resolve trusted principal from trigger + current DB |
| `vionaRequestIndirectExecutionAccessScope.ts` | Provenance/tenant DB predicate for execution eligibility |
| `vionaRequestExecutionAttemptRepository.ts` | Attempt CRUD inside transactions |
| `vionaRequestExecutionGatewayService.ts` | Single entry for provider-capable execution (§14) |

---

## 7. Execution-principal contract (Design Decision 3)

Trusted principals are **created only after trigger authentication** and **recomputed tenant/profile from current DB**. Unsigned envelope fields are advisory.

### Conceptual type

```ts
type VionaRequestExecutionPrincipal = Readonly<{
  principalType: 'merchant_service';
  triggerType:
    | 'signed_merchant_webhook'
    | 'internal_authenticated_controller'
    | 'approved_internal_dispatch'
    | 'approved_test_harness';
  triggeringUserId: string; // MerchantProfile.ownerUserId for merchant triggers
  merchantProfileId: string;  // From current DB after channel/JWT resolution
  tenantId: string;           // From current DB
  requestId: string;
  correlationId: string;      // Server-generated per gateway invocation
}>;
```

### Rules

1. Trigger authenticated before principal creation (webhook signature + channel gate; JWT for internal controller; test harness explicitly gated).
2. `merchantProfileId` and `tenantId` loaded from `MerchantProfile` row, not from dispatch envelope alone.
3. Envelope `merchantContext`, `authUserId`, `requestStatus` are **advisory** — gateway reloads request row.
4. Principal cannot convert consumer or legacy rows into merchant execution — eligibility predicate runs on current request row.
5. Principal bound to exactly one `requestId` and one `executionAttemptId` after claim.
6. Provider path receives principal + attemptId; cannot broaden authority.
7. No provider callback path exists today; future callbacks (Pack40S) must not accept tenant/profile from callback body.
8. Support/admin JWT does not automatically acquire merchant execution authority.
9. Distinct from Pack40C authenticated-owner model — no reuse of Pack40C resolver.

### Initial entry-point principal derivation

| Entry point | Trigger type | Principal derivable? |
|---|---|---|
| Signed merchant webhook → execution gateway | `signed_merchant_webhook` | **Yes** — channel → profile reload |
| Internal real-Twilio POC controller → gateway | `internal_authenticated_controller` | **Yes** — JWT user must match merchant profile owner + request eligibility |
| Orchestrator / test harness → gateway | `approved_test_harness` | **Yes** — explicit test-only gate; same eligibility rules |
| Autonomous dispatch direct POC call | — | **Removed** — must route through gateway (§14) |

**Result:** Trusted principal derivable for every initial Pack40D entry point after bypass removal.

---

## 8. Attempt and lease model (Design Decision 4)

### Decision: **new `VionaRequestExecutionAttempt` record required**

`VionaRequestEscrowHold` cannot serve as execution lease (§16). No existing table provides stale-worker protection, attempt-terminal binding, or provider-outcome reconciliation.

### Minimum attempt fields

| Field | Rationale |
|---|---|
| `id` | Primary key; referenced by events, audits, provider keys |
| `requestId` | Request binding |
| `executionKey` | Stable external correlation (`correlationId` from principal) |
| `attemptNumber` | Monotonic per request for audit clarity |
| `principalType` | `'merchant_service'` (initial enum) |
| `triggerType` | Same enum as principal |
| `triggeringUserId` | Immutable snapshot |
| `merchantProfileIdSnapshot` | Immutable at claim |
| `tenantIdSnapshot` | Immutable at claim |
| `scopeKindSnapshot` | Immutable at claim |
| `state` | Attempt lifecycle (below) |
| `leaseOwner` | Worker/process token set at claim |
| `leaseExpiresAt` | Optional stale-lease recovery horizon |
| `claimedAt` | Claim timestamp |
| `providerStartedAt` | Before external call |
| `providerCompletedAt` | After known provider outcome |
| `finalizedAt` | Terminal attempt timestamp |
| `failedAt` | Terminal failure timestamp |
| `providerIdempotencyKey` | Stable per attempt (§13) |
| `providerResultDigest` | Hash/summary of provider outcome for reconciliation |
| `failureClass` | `claim_denied \| profile_inactive \| provider_timeout \| provider_failed \| finalize_failed \| stale_lease \| …` |
| `correlationId` | Matches gateway correlation |
| `escrowHoldId` | Optional link to `VionaRequestEscrowHold` |
| `createdAt`, `updatedAt` | Standard |

Omit until needed: generic JSON blobs, provider raw response (use digest + audit ledger).

### Attempt state machine (minimum)

```text
pending_claim → claimed → provider_pending → provider_succeeded | provider_failed | outcome_uncertain
→ completed | failed | abandoned
```

| State | Meaning |
|---|---|
| `pending_claim` | Transient within claim transaction only |
| `claimed` | `triage→inProgress` committed; provider not started |
| `provider_pending` | External call in flight |
| `provider_succeeded` | Durable provider success recorded |
| `provider_failed` | Known provider failure |
| `outcome_uncertain` | Timeout / lost response — no blind retry |
| `completed` | Terminal; request `inProgress→completed` committed |
| `failed` | Terminal; request `inProgress→failed` committed |
| `abandoned` | Stale lease expired; operator/recovery may intervene |

**No new VionaRequest status values.** Recovery conditions live on attempt state only.

---

## 9. Request-to-attempt binding (Design Decision 4 cont.)

### Chosen: **Option 2 — unique active attempt constraint** (+ optional denormalized FK)

**Primary enforcement:** Partial unique index on `VionaRequestExecutionAttempt(requestId)` where `state IN ('claimed', 'provider_pending', 'provider_succeeded', 'provider_failed', 'outcome_uncertain')`.

**Optional denormalization:** `VionaRequest.activeExecutionAttemptId` nullable FK, set in claim transaction, cleared on terminal finalization — fast lookup only; constraint authority remains on attempt table.

**Rejected Option 3 (execution key only):** Cannot prove stale-worker rejection without durable attempt row and terminal state.

### Required properties — satisfied by Option 2

1. Only one active attempt per request — **unique partial index**
2. Claim + `triage→inProgress` atomic — **claim transaction (§10)**
3. Start event + execution audit atomic with claim — **same transaction**
4. Stale attempt cannot finalize — **finalize verifies attemptId + state + leaseOwner**
5. Duplicate job cannot double-claim — **conditional status update + unique active attempt**
6. Terminal attempt cannot reopen — **terminal states excluded from active index**
7. Provider result binds one attempt — **`providerIdempotencyKey` + attemptId on record**
8. Terminal event binds one attempt — **`executionAttemptId` on status event and audit payload**

---

## 10. Transaction boundaries (Design Decision 5)

### Claim transaction (Serializable)

```text
BEGIN (Serializable)
→ resolve execution principal from authenticated trigger
→ load current VionaRequest + current MerchantProfile
→ enforce merchant eligibility (§5); reject consumer/legacy/malformed
→ verify request.status = triage
→ insert VionaRequestExecutionAttempt (state → claimed after status write)
→ conditional update VionaRequest: triage → inProgress WHERE id + status + provenance predicate
→ set activeExecutionAttemptId (if denormalized)
→ insert VionaRequestStatusEvent (triage → inProgress, executionAttemptId)
→ insert execution audit (category: execution.claimed)
COMMIT
```

On any failure: **ROLLBACK** — no `inProgress`, no attempt row, no provider call.

### Provider phase (no open DB transaction)

```text
→ reload active attempt by id
→ verify attempt state = claimed
→ revalidate MerchantProfile.isActive + provenance match
→ transition attempt → provider_pending
→ invoke provider with attempt-scoped idempotencyKey
→ durably record provider outcome on attempt (provider_succeeded | provider_failed | outcome_uncertain)
→ append provider audit rows (best-effort after attempt update, or in short follow-up tx)
```

### Finalization transaction (Serializable)

```text
BEGIN (Serializable)
→ load attempt + request
→ verify attempt is active non-terminal and matches request.activeExecutionAttemptId
→ verify provider outcome recorded (not provider_pending unless policy allows fail-from-timeout)
→ conditional update VionaRequest: inProgress → completed | failed
→ insert terminal VionaRequestStatusEvent
→ insert execution audit (execution.completed | execution.failed)
→ mark attempt terminal (completed | failed)
→ clear activeExecutionAttemptId
COMMIT
```

All status/event/audit writes for each transition **must** be in the same transaction. Best-effort post-commit writes are **removed** for Pack40D indirect transitions.

---

## 11. MerchantProfile lifecycle policy (Design Decision 6)

| Scenario | Policy |
|---|---|
| **Inactive before claim** | Deny claim; no `inProgress`; no provider; attempt not created |
| **Deactivated after claim, before provider** | Revalidate fails → finalize attempt **failed** (`failureClass: profile_inactive`); request `inProgress→failed`; **no provider call** |
| **Deactivated after provider success** | **Policy A — finalize committed provider result** — provider success durably recorded → finalize attempt **completed**; request `inProgress→completed`; audit notes authority drift; **do not repeat provider** |
| **Tenant/profile drift before provider** | Deny provider; finalize failed |
| **Drift after provider success** | Finalize per Policy A; drift recorded on attempt/audit; result stays bound to original attempt snapshot |

Authority required: **current exact at claim**; **current active at provider**; **finalization binds to immutable attempt + recorded provider outcome**.

---

## 12. Provider idempotency design (Design Decision 7)

### Stable key per attempt

```text
providerIdempotencyKey = "{provider}:{requestId}:{executionAttemptId}:{operationCategory}"
```

Example: `twilio_test_sms:{requestId}:{attemptId}:send`

### Required properties

| # | Property | Mechanism |
|---|---|---|
| 1 | Retry same attempt reuses key | Key derived from `attemptId` |
| 2 | New attempt → new key | New `attemptId` |
| 3–5 | Cross-request/tenant/operation isolation | Key includes requestId + attemptId + provider + category |
| 6 | Response-loss reconciliation | Durable `providerResultDigest` + audit before finalize |
| 7 | Timeout ≠ automatic failure | Attempt → `outcome_uncertain`; no blind retry |
| 8 | Uncertain → no blind provider retry | Recovery job or operator only |
| 9 | Duplicate callback idempotent | Lookup by attempt + digest |
| 10 | Provider result before terminal status when possible | Provider phase updates attempt before finalize tx |

### Twilio test SMS

Current adapter uses **process-local** idempotency store — insufficient for production. Pack40D3 adds:

- Durable invocation record on attempt row (`providerResultDigest`, timestamps)
- Escrow hold keyed to **attempt-scoped** idempotency key (not `externalMessageId` alone)
- Replace in-memory Twilio store with attempt-backed reconciliation for gateway calls

**Not** `PACK40D_PROVIDER_IDEMPOTENCY_BLOCKED` — solvable with attempt record + gateway enforcement.

---

## 13. Provider-bypass path treatment (Design Decision 8)

| Path | Treatment | Rationale |
|---|---|---|
| `previewVionaExecutionPlanRoute` | **Preview-only** | Mock-only; no Twilio/escrow/status |
| `previewVionaRequestExecutionGate` | **Preview-only** | Dry-run; no side effects |
| `previewVionaExecutionPlanRealProviderPocRoute` (direct callers) | **Route through Pack40D execution gateway** | Becomes internal implementation detail of gateway provider phase |
| `VionaWebhookMerchantAgentController` → dispatch Twilio | **Route through gateway** | Claim → provider → finalize for status-changing tools |
| `VionaWebhookMerchantAgentController` → merchant read-only query | **Route through gateway (read-only branch)** | Provenance gate; no status transition; no Twilio/escrow |
| `VionaInternalRealTwilioPocController` | **Route through gateway** with `internal_authenticated_controller` OR **disable** until gateway wired | Must not bypass claim |
| `executeVionaRequestBusinessFlow` orchestrator | **Route through gateway** | Orchestrator delegates to indirect writer + gateway |
| `scripts/test-e2e-real-flow.ts` | **Route through gateway** via `approved_test_harness` | Test-only principal |

**No path may invoke Twilio/escrow outside attempt boundary after Pack40D3.**

---

## 14. Webhook and dispatch boundary

### Initial Pack40D policy

Signed merchant webhook:

1. **Creates** request (`submitted`) — unchanged create path
2. **Does not** auto-transition to `triage` in Pack40D
3. **Status-changing execution** (Twilio POC path): gateway **denies claim** until request is `triage` (owner or authorized path must reach triage via Pack40C or future auto-triage packet)
4. **Read-only merchant tools**: gateway provenance gate only; may execute without status lifecycle change (no claim/finalize)

Immediate full webhook→Twilio→status lifecycle requires triage first. Current production webhook dispatches on `submitted` rows — Pack40D3 gateway will fail closed for Twilio until triage unless a separately authorized auto-triage is added.

Stale `requestStatus` in dispatch envelope **ignored** — gateway reloads DB.

---

## 15. Escrow boundary

| Question | Answer |
|---|---|
| Reserves value? | **Yes** — hold before provider |
| Identifies provider operation? | **Partially** — by `actionId` + idempotencyKey, not attemptId today |
| Acts as idempotency record? | **Yes** for hold deduplication (`VionaRequestEscrowHold.idempotencyKey` unique) |
| Binds execution attempt? | **No** — no attemptId FK; cannot prove stale-worker or claim ownership |
| Supports uncertain-outcome reconciliation? | **Partial** — settle/refund states; no attempt coupling |

**Escrow is not an execution lease.**

### Placement (unchanged timing, attempt-scoped keys)

```text
claim transaction (triage → inProgress)
→ escrow hold (attempt-scoped idempotencyKey, escrowHoldId on attempt)
→ provider call
→ escrow settle/refund (in provider phase)
→ finalize transaction (inProgress → terminal)
```

No escrow mutation authorized during this refinement.

---

## 16. Indirect status and event contract

### VionaRequest statuses (unchanged)

```text
triage → inProgress → completed | failed
```

No new request statuses (`blocked`, `retrying`, `uncertain`, etc.).

### Audit / event categories (new execution-specific)

| Category | When |
|---|---|
| `execution.claimed` | Claim transaction committed |
| `execution.provider_invoked` | Provider call started |
| `execution.provider_outcome` | Outcome recorded |
| `execution.completed` | Successful finalize |
| `execution.failed` | Failed finalize |
| `execution.outcome_uncertain` | Timeout / lost response |
| `execution.duplicate_attempt_denied` | Second claim rejected |
| `execution.stale_attempt_denied` | Stale worker finalize rejected |

Use **`stateTransition`** audit type for indirect lifecycle with `actorRoleLabel: 'execution_service'` and `executionAttemptId` in payload — **not** `action.status` (Pack40C direct-user category).

`VionaRequestStatusEvent` rows include `executionAttemptId` in payload or dedicated nullable column (implementation choice in D1/D2).

---

## 17. Failure and recovery matrix

| # | Scenario | Provider? | Retry? | Attempt state | Request status | Operator? |
|---|---|---|---|---|---|---|
| 1 | Crash before claim | No | Safe retry claim | none / rolled back | `triage` | No |
| 2 | Crash after attempt insert, before inProgress | No | Claim tx rolls back | none | `triage` | No |
| 3 | Crash after inProgress, before provider | No | Recovery detects `claimed` | `claimed` | `inProgress` | Maybe — lease expiry → abandoned |
| 4 | Provider timeout | Unknown | **No blind retry** | `outcome_uncertain` | `inProgress` | Maybe |
| 5 | Provider accepts, response lost | Unknown | Reconcile via idempotency lookup | `outcome_uncertain` → resolved | `inProgress` until finalize | Maybe |
| 6 | Provider succeeds, local record fails | No repeat if digest exists | Retry finalize only | `provider_succeeded` | `inProgress` | Maybe |
| 7 | Provider recorded, finalize fails | No | Retry finalize tx | `provider_succeeded` | `inProgress` | No |
| 8 | Duplicate job during active execution | No | Deny second claim | active unchanged | `inProgress` | No |
| 9 | Duplicate job after completion | No | Idempotent deny | terminal | terminal | No |
| 10 | Stale worker finalize | No | Reject | active owned by other lease | unchanged | No |
| 11 | Inactive before provider | No | Finalize failed | `failed` | `failed` | No |
| 12 | Drift before provider | No | Finalize failed | `failed` | `failed` | No |
| 13 | Drift after provider success | No repeat | Finalize completed (Policy A) | `completed` | `completed` | Audit only |
| 14 | Legacy at gateway | No | Deny at eligibility | none | unchanged | No |
| 15 | Consumer at merchant gateway | No | Deny at eligibility | none | unchanged | No |

---

## 18. Schema decision

### **`PACK40D_EXECUTION_ATTEMPT_SCHEMA_REQUIRED`**

Current schema **cannot** prove unique claim, stale-worker protection, attempt-bound provider idempotency, or atomic terminal finalization.

### Conceptual model: `VionaRequestExecutionAttempt`

**Relations:**

- `requestId` → `VionaRequest.id` (Restrict on delete)
- Optional `escrowHoldId` → `VionaRequestEscrowHold.id` (SetNull)

**Uniqueness:**

- Partial unique: one active attempt per `requestId` (DB partial index or equivalent application-enforced check inside Serializable tx — prefer DB partial index where supported)
- Unique: `providerIdempotencyKey`
- Unique: `(requestId, attemptNumber)`

**Indexes:**

- `(requestId, state)`
- `(leaseExpiresAt)` where active — recovery scans
- `(correlationId)`

**Optional VionaRequest addition:**

- `activeExecutionAttemptId String?` FK → `VionaRequestExecutionAttempt.id` (SetNull)

**Enum:** `VionaRequestExecutionAttemptState` matching §8 state machine

**Migration safety:**

- Additive nullable columns on `VionaRequest` — no backfill required
- New table — empty initial
- No change to existing escrow rows
- Deploy order: migration → D1 repository tests → D2 writer (feature-flagged) → D3 gateway routing
- Rollback: disable gateway flag; new table unused; nullable FK ignored

**Existing rows:** Legacy `inProgress` requests without attempts require one-time operator/recovery script (separate authorization) — not in D1 scope.

---

## 19. Pack decomposition

| Pack | Authorization phrase (proposed) | Scope |
|---|---|---|
| **Pack40D1** | `APPROVE_PACK40D1_EXECUTION_ATTEMPT_SCHEMA` | Prisma model + migration + repository + model tests only |
| **Pack40D2** | `APPROVE_PACK40D2_INDIRECT_WRITER_ENFORCEMENT` | Principal resolver, access scope, indirect writer, atomic claim/finalize, eligibility fail-closed, **no live provider** |
| **Pack40D3** | `APPROVE_PACK40D3_PROVIDER_GATEWAY_INTEGRATION` | Execution gateway, attempt-scoped keys, bypass removal, Twilio/escrow integration, uncertain-outcome handling |
| **Pack40DD** | `APPROVE_PACK40DD_STAGING_INDIRECT_ENFORCEMENT_DEPLOY` | Deploy-only |
| **Pack40DS** | `APPROVE_PACK40DS_STAGING_INDIRECT_ADVERSARIAL_QA` | Staging adversarial QA (Pack40S boundary) |

Each pack requires **separate operator authorization**. Do not combine schema + live provider in one pack.

---

## 20. Implementation file forecast

| File | Pack |
|---|---|
| `prisma/schema.prisma` (+ migration) | D1 |
| `vionaRequestExecutionAttemptRepository.ts` | D1 |
| `vionaRequestExecutionPrincipalContext.ts` | D2 |
| `vionaRequestIndirectExecutionAccessScope.ts` | D2 |
| `vionaRequestIndirectStatusActionService.ts` | D2 |
| `vionaRequestExecutionGatewayService.ts` | D3 |
| `vionaRequestExecutionOrchestrator.ts` (thin delegate) | D3 |
| `vionaExecutionPlanRouteService.ts` (gateway-internal provider phase) | D3 |
| `vionaAutonomousDispatchService.ts` (gateway entry) | D3 |
| `VionaWebhookMerchantAgentController.ts` (minimal) | D3 |
| `VionaInternalRealTwilioPocController.ts` (gateway or disable) | D3 |
| `scripts/test-viona-pack40d1-execution-attempt-schema.ts` | D1 |
| `scripts/test-viona-pack40d2-indirect-writer-enforcement.ts` | D2 |
| `scripts/test-viona-pack40d3-provider-gateway-integration.ts` | D3 |

**Untouched:** Pack40C services, Pack40B note services, Pack40A read services.

---

## 21. Required test plan (summary)

**60+ cases** minimum across:

- **Principal/eligibility (11):** merchant trigger, ignore client tenant/profile, consumer/legacy/malformed fail-closed, inactive/wrong profile/tenant, stale envelope
- **Attempt/lease (9):** single active attempt, atomic claim, duplicate deny, stale finalize, terminal immutability, lease expiry
- **Provider (10):** attempt-scoped keys, retry/reuse rules, timeout uncertain, no blind repeat, bypass removed
- **Lifecycle drift (7):** deactivation before claim/provider, Policy A after success, drift cannot transfer
- **Transactions/events (8):** atomic claim/complete/fail, rollback on event/audit failure
- **Recovery (8):** crash matrix scenarios 1–10
- **Preservation (7):** Pack40A/B/C unchanged, no new request status, Pack40S unimplemented

Full matrix expands Pack40D readiness audit §23 with attempt-state and gateway cases.

---

## 22. Pack40C preservation

Pack40D refinement confirms **no change** to:

- Direct status route / controller
- `transitionVionaRequestStatus` semantics
- Pack40C principal-context resolver / access-scope builder
- Pack40B note enforcement
- Pack40A read enforcement

---

## 23. Pack40S boundary

Not in scope: staging adversarial execution QA, provider callbacks, marketing/tourism/SOS paths, operator recovery tooling beyond documented matrix.

---

## 24. No-implementation confirmation

This refinement performed **read-only** source and schema inspection only. **No** product code, test code, Prisma edit, migration, DB access, staging call, provider call, execution, deployment, or secret action occurred.

---

## 25. Final classification

**`READY_FOR_PACK40D1_EXECUTION_ATTEMPT_SCHEMA_PACKET`**

---

## 26. Recommended next operator authorization

**Review and merge this refinement PR**, then issue:

```text
APPROVE_PACK40D1_EXECUTION_ATTEMPT_SCHEMA
```

to implement the `VionaRequestExecutionAttempt` model, migration, and repository foundation only — no provider calls, no orchestrator wiring, no deployment.

Do not issue `APPROVE_PACK40D3_PROVIDER_GATEWAY_INTEGRATION` until D1 and D2 are CLOSED/GREEN.
