# Pack40D — Indirect-Path Tenant Enforcement Readiness Audit

Status: **READ-ONLY AUDIT COMPLETE — NO IMPLEMENTATION**

Operator phrase: `APPROVE_PACK40D_INDIRECT_PATH_READINESS_AUDIT`

Pack40D is **not** implemented or CLOSED/GREEN. This document records readiness only.

---

## 1. Verified master SHA

`e9ee2d75743675797c9fae34576a1bc47491cfe6` — includes Pack40C closure sync (PR #366 @ `e9ee2d7`)

## 2. Pack40A / Pack40B / Pack40C closure state

| Slice | State |
|---|---|
| Pack40A | **CLOSED / GREEN** — read enforcement, staging deploy v24, adversarial QA, closure sync PR #355 |
| Pack40B | **CLOSED / GREEN** — note enforcement PR #356+#357, Pack40BD deploy v25, Pack40BS QA PR #359, closure sync PR #360 |
| Pack40C | **CLOSED / GREEN** — implementation PR #363, Pack40CD deploy v26 PR #364, Pack40CS adversarial QA PR #365, closure sync PR #366 |
| Pack40D | **Unimplemented** — readiness audit only (this document) |
| Pack40S | **Unimplemented** |

## 3. Branch and audit commit

- Branch: `docs/pack40d-indirect-path-readiness-audit`
- Audit commit: recorded at push time

---

## 4. Scope boundary (Pack40C vs Pack40D)

| Surface | Owner | Transitions | Tenant enforcement today |
|---|---|---|---|
| **Pack40C direct** | `POST /api/viona/requests/:id/actions/status` → `transitionVionaRequestStatus` | `submitted → triage` only | **CLOSED/GREEN** — provenance-aware owner-only DB predicate (Pack40C) |
| **Pack40D indirect** | Orchestrator + execution pipelines that mutate status or invoke provider/tools without the direct status route | `triage → inProgress`, `inProgress → completed`, `inProgress → failed` (orchestrator only) | **Not enforced** — owner-only optimistic lock only; no `scopeKind` / tenant / active-profile gate |

Pack40D must **not** reuse Pack40C authenticated-user semantics for system execution.

---

## 5. Complete indirect-surface inventory

### 5.1 Status-changing paths (indirect)

| # | File / function | Classification | Trigger | Principal | Transitions | DB writes | External side effects | Retry | Failure |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `vionaRequestExecutionOrchestrator.ts` → `executeVionaRequestBusinessFlow` | **INTERNAL_SYNCHRONOUS_EXECUTION** | Test script / future internal caller (no production HTTP route today) | `AUTHENTICATED_USER_PRINCIPAL` via `authUserId` input | `triage→inProgress`, `inProgress→completed\|failed` | `vionaRequest.updateMany` (×2); `vionaRequestStatusEvent.create` (×2, best-effort); `stateTransition` audit (terminal only, best-effort) | Twilio test POC via `previewVionaExecutionPlanRealProviderPocRoute` (escrow hold/settle) | None at orchestrator layer; provider adapter has 1 network retry | Fail-closed `invalid_state` on claim miss; catch → finalize `failed` |
| 2 | `vionaRequestCreateService.ts` → `createVionaRequest` | **CREATE_ONLY_PATH** | Authenticated `POST /api/viona/requests` | `AUTHENTICATED_USER_PRINCIPAL` | Initial `submitted` only | Atomic create + `action.create` audit | None | Idempotent create via audit key | Invalid input denied |
| 3 | `vionaRequestCreateFromWebhookService.ts` → `createVionaRequestFromWebhookMessage` | **CREATE_ONLY_PATH** | Webhook `POST /api/viona/webhooks/merchant-agent` | `INTERNAL_SERVICE_PRINCIPAL` (channel-resolved merchant owner) | Initial `submitted` only | Atomic create + `webhookMessageAccepted` audit | None | Idempotent via `externalMessageId` | Invalid input denied |

**No other production `VionaRequest.status` mutators exist outside Pack40C direct service and the orchestrator above.**

### 5.2 Execution / side-effect paths (no status change today)

| # | File / function | Classification | Trigger | Principal | Status change | External side effects | Notes |
|---|---|---|---|---|---|---|---|
| 4 | `vionaExecutionPlanRouteService.ts` → `previewVionaExecutionPlanRoute` | **DIRECT_AUTHENTICATED_USER_PATH** | `POST .../actions/execution-plan-preview` | JWT `authUserId` | **None** | Mock adapter only (optional) | Pack30B preview |
| 5 | `vionaRequestExecutionGateService.ts` → `previewVionaRequestExecutionGate` | **DIRECT_AUTHENTICATED_USER_PATH** | `POST .../actions/execution-preview` | JWT `authUserId` | **None** | **None** | Pack29 dry-run only |
| 6 | `vionaExecutionPlanRouteService.ts` → `previewVionaExecutionPlanRealProviderPocRoute` | **INTERNAL_SYNCHRONOUS_EXECUTION** | Internal POC route; Pack32 dispatch; orchestrator Step 2 | Caller-supplied `authUserId` | **None** | Escrow hold; Twilio test SMS; settle/refund; audit rows | Uses legacy `getVionaRequestById` (requester\|owner\|participant scope) |
| 7 | `vionaAutonomousDispatchService.ts` → `dispatchVionaAutonomousRequest` | **WEBHOOK_OR_EXTERNAL_TRIGGER** (via controller) | Webhook controller after signed channel create | `authUserId` = channel `merchantOwnerUserId`; optional `merchantContext` | **None** | Twilio POC and/or merchant read-only query (LLM reply) | Service-layer; not directly HTTP-exposed |
| 8 | `VionaWebhookMerchantAgentController.ts` → `postVionaWebhookMerchantAgent` | **WEBHOOK_OR_EXTERNAL_TRIGGER** | Signed merchant webhook | Channel-resolved tenant/profile/owner | Create + dispatch only | Downstream dispatch side effects | No JWT; signature gate |
| 9 | `VionaInternalRealTwilioPocController.ts` → `postVionaInternalTriggerRealTwilioPoc` | **INTERNAL_SYNCHRONOUS_EXECUTION** | `POST /api/internal/viona/trigger-real-twilio-poc` (gated) | JWT `authUserId` | **None** | Full real-provider POC chain | Bypasses orchestrator status lifecycle |
| 10 | `vionaMerchantReadOnlyQueryExecutionService.ts` → `executeMerchantReadOnlyQuery` | **INTERNAL_SYNCHRONOUS_EXECUTION** | Dispatch switch only | Caller `tenantId` + `merchantProfileId` | **None** | LLM reply formatting (Tier 2 when key present) | Revalidates profile tenant match |
| 11 | `vionaMarketingContentDispatchService.ts` → `dispatchVionaMarketingContentRequest` | **UNKNOWN** (out of Pack40D — no `VionaRequest`) | Not HTTP-wired | N/A | **None** | MarketingPost draft | Pack40S boundary — not Pack40D |
| 12 | `scripts/test-e2e-real-flow.ts` | **TEST_ONLY** | Manual script | Script-supplied user | Via orchestrator | Twilio POC | Not production |

### 5.3 Background / queue / worker paths

**None found** for VionaRequest execution or status mutation. All indirect execution is **synchronous in-request** (HTTP handler or test script). No durable job queue, scheduler, or retry worker owns VionaRequest lifecycle transitions.

---

## 6. Caller and trigger inventory

### 6.1 Orchestrator (`executeVionaRequestBusinessFlow`)

| Caller | Trigger type | Original actor survives? |
|---|---|---|
| `scripts/test-e2e-real-flow.ts` | **TEST_ONLY** | Script passes `authUserId` explicitly |
| `scripts/provision-test-wallet.ts` | **TEST_ONLY** (comment/reference) | N/A |

**No production controller, webhook, queue, or scheduler invokes the orchestrator today.** Status transitions `triage→inProgress→completed|failed` are implemented but **not wired** to live traffic.

### 6.2 Real-provider execution (without orchestrator status)

| Caller | Trigger | Actor |
|---|---|---|
| `VionaWebhookMerchantAgentController` | Webhook after channel signature + gate | `merchantOwnerUserId` from resolved channel |
| `VionaInternalRealTwilioPocController` | Authenticated internal route | JWT user |
| `vionaAutonomousDispatchService` | Invoked by webhook controller | Same as webhook |
| Orchestrator Step 2 | Internal | `authUserId` input |

**Critical gap:** Provider/tool side effects can run **without** orchestrator claim/finalize when callers use `previewVionaExecutionPlanRealProviderPocRoute` directly (webhook dispatch, internal POC). Pack40D must treat **execution authorization** separately from **status-transition authorization**.

---

## 7. Execution-principal model

| Path | Effective principal | Identity source | Tenant binding | MerchantProfile binding | Revalidated at execution? | Client-influenced? |
|---|---|---|---|---|---|---|
| Orchestrator | `AUTHENTICATED_USER_PRINCIPAL` | `input.authUserId` | **None** — only `ownerUserId` on row | **None** | **No** `scopeKind`/profile check | `authUserId` is caller-supplied |
| Real-provider POC route | `AUTHENTICATED_USER_PRINCIPAL` | `input.authUserId` | **None** on write path | **None** | Lookup via legacy read scope only | `requestId`, consent flags, idempotency key |
| Webhook dispatch | `INTERNAL_SERVICE_PRINCIPAL` + merchant owner surrogate | Channel resolution after signature | Channel `tenantId` | Channel `merchantProfileId` | Channel gate at webhook entry; **not** revalidated inside dispatch for Twilio path | Webhook body does not carry tenant/profile (server-resolved) |
| Merchant read-only query | `MERCHANT_PROFILE_PRINCIPAL` (partial) | Dispatch `merchantContext` | Caller-supplied, profile reloaded | `findMerchantProfileById` + tenant equality check | **Partial** — profile tenant mismatch → default persona, not hard deny | `merchantContext` from webhook channel (trusted) |
| Execution previews | `AUTHENTICATED_USER_PRINCIPAL` | JWT | Legacy read scope only | **None** | Read-time only | Standard HTTP body fields |

**Pack40D must not invent a user identity for a system caller.** Webhook execution should use an **explicit internal execution principal** derived from server-resolved channel + current DB request row, not merely `merchantOwnerUserId` passed through as `authUserId`.

---

## 8. Job and execution-envelope trust classification

### 8.1 Orchestrator input (`ExecuteVionaRequestBusinessFlowInput`)

| Field | Classification |
|---|---|
| `authUserId` | **CLIENT_CONTROLLED** / caller-supplied — must not expand authority alone |
| `requestId` | **ADVISORY_ONLY** — must match authorized DB row |
| `fromNumber`, `toNumber`, `body` | **CLIENT_CONTROLLED** — provider payload |
| (no `scopeKind`, `tenantId`, `merchantProfileId`, `executionId`) | Missing authoritative execution envelope |

### 8.2 Dispatch input (`DispatchVionaAutonomousRequestInput`)

| Field | Classification |
|---|---|
| `authUserId` | **TRUSTED_SIGNED_INTERNAL_CONTEXT** when from webhook controller; **CLIENT_CONTROLLED** if ever HTTP-exposed |
| `requestId`, `requestStatus` | **STALE_SNAPSHOT_RISK** — not reloaded before Twilio path |
| `merchantContext.tenantId`, `merchantProfileId` | **TRUSTED_SIGNED_INTERNAL_CONTEXT** from channel resolution; must be recomputed against current DB |
| `operatorApprovalGranted`, `userConsentGranted` | **TRUSTED_SIGNED_INTERNAL_CONTEXT** (webhook gate derives); **CLIENT_CONTROLLED** on internal POC route |
| `idempotencyKey` | **ADVISORY_ONLY** — escrow idempotency, not execution-attempt lease |
| `precomputedIntentDecision` | **ADVISORY_ONLY** — still registry re-checked |

**Finding:** Unsigned job payload fields can influence merchant tool routing. Twilio path ignores `merchantContext` but uses `authUserId` + `requestId` only — **confused-deputy risk** if read scope or owner check is insufficient.

---

## 9. Provenance eligibility

### 9.1 Consumer requests

| Question | Finding |
|---|---|
| Intended for indirect execution? | **Partially** — authenticated preview/POC routes accept consumer rows via legacy read scope; orchestrator could claim any `triage` row owned by `authUserId` |
| Trigger | Pack40C direct `submitted→triage` for owner consumer; execution routes do not require prior orchestrator wiring |
| MerchantProfile relevance | Should be **null** for consumer |
| Product support | Consumer create path sets `scopeKind=consumer`, `merchantProfileId=null` |

**Recommendation:** `CONSUMER_INDIRECT_EXECUTION_REQUIRES_SEPARATE_DESIGN`

Consumer indirect execution must be explicitly authorized per trigger (e.g. owner JWT + post-triage eligibility + provenance revalidation). **Do not assume** webhook merchant dispatch rules apply to consumer rows.

### 9.2 Merchant requests

Execution eligibility must require at execution time:

```text
scopeKind = merchant
AND merchantProfileId = trusted current active profile id
AND tenantId = trusted current profile tenant
AND MerchantProfile.isActive = true (see lifecycle §10)
```

**Current source:** orchestrator and real-provider route **do not** enforce any of these.

### 9.3 Legacy unresolved

**Current source allows legacy execution:** orchestrator claim checks only `id`, `status=triage`, `ownerUserId=authUserId` — **no `scopeKind` exclusion**. A pre-existing `legacyUnresolved` row already in `triage` could be claimed and executed.

**Required Pack40D default:**

```text
scopeKind = legacyUnresolved → fail closed before execution
→ no provider/tool call
→ no indirect status transition
```

**Current-source classification:** `BLOCKED_LEGACY_EXECUTION_PATH` — orchestrator claim and real-provider POC lookup do not exclude `legacyUnresolved`; a pre-existing `triage` legacy row owned by the caller could be claimed and executed today. Pack40D implementation must fail closed.

---

## 10. MerchantProfile activity lifecycle policy (recommended)

| Scenario | Recommended Pack40D policy | Current source |
|---|---|---|
| **A — inactive before start** | Deny claim/start; no `inProgress`; no provider call | **Not enforced** |
| **B — deactivated after `inProgress`, before provider** | Revalidate immediately before external call; deny provider if inactive | **Not enforced** |
| **C — deactivated after provider success, before `completed`** | Finalize using immutable execution-attempt record; do not attach result to wrong tenant; prefer **complete if provider success durably recorded** vs blind fail — **requires product decision tied to escrow/settle records** | **Not defined** |
| **D — profile ownership/tenant drift mid-run** | Execution attempt must bind profile+tenant snapshot at claim; finalize must verify attempt ownership | **No attempt record exists** |

**Scenario C** must not be guessed in implementation; Pack40D should bind to existing escrow hold/settle semantics (`VionaRequestEscrowHold` idempotency) until an execution-lease table exists.

---

## 11. Indirect transition inventory (orchestrator — sole status writer)

| Transition | Condition | Principal | Provenance today | Transaction | Status event | Audit | Side effects |
|---|---|---|---|---|---|---|---|
| `triage → inProgress` | `updateMany` count=1 | `authUserId` owner lock | **None** | Single non-transactional update | Best-effort create **after** update | None at claim | None before event write |
| `inProgress → completed` | Provider success + finalize count=1 | Same owner lock | **None** | Non-transactional | Best-effort after update | Best-effort `stateTransition` | Provider **before** finalize |
| `inProgress → failed` | Provider fail/throw + finalize | Same | **None** | Non-transactional | Best-effort | Best-effort `stateTransition` | Provider may have run |

**No undocumented indirect transitions** in source. State machine also allows other transitions (e.g. `triage→completed`) via future writers — **not exercised** today.

---

## 12. External side-effect inventory

| Side effect | When | Idempotent? | Correlation key | Retry duplication risk | Tenant revalidation before invoke? |
|---|---|---|---|---|---|
| Twilio test SMS (`executeVionaTwilioTestPocReal`) | After plan+hold | Partial — adapter 1× network retry; idempotency via escrow key | `idempotencyKey` / `pack31-orchestrator-${requestId}` | **Yes** — same requestId key on replay | **No** |
| Escrow hold/settle | Before/after provider | Hold idempotent by key | `escrowIdempotencyKey` | Hold replay safe; settle coupling unclear on crash | **No** |
| LLM intent routing | Dispatch pre-tool | **No** | None | Webhook idempotency skips redispatch | N/A |
| LLM merchant reply (Tier 2) | Merchant query tool | **No** | Usage log only | Repeat dispatch with same externalMessageId blocked at create | Partial tenant check on persona |
| Audit ledger append | Multiple stages | Append-only | None | Duplicate audit rows possible | N/A |

**Finding:** Provider outcome uncertainty + non-transactional finalize → **`PACK40D_REQUIRES_SIDE_EFFECT_IDEMPOTENCY_PLAN`** as co-requisite (not primary).

---

## 13. Transaction-boundary map (current)

```text
Orchestrator (actual):
  claim updateMany → commit
  status event (separate, best-effort)
  previewVionaExecutionPlanRealProviderPocRoute (network + escrow, no DB tx)
  finalize updateMany → commit
  status event + stateTransition audit (separate, best-effort)
```

**No DB transaction spans provider call** — correct pattern.

**Gap:** Claim and start event are **not atomic**; finalize and terminal event/audit are **not atomic**. Failed event write leaves status/event divergence.

**Recommended Pack40D bounded transactions:**

1. **Start tx:** resolve trusted execution principal → provenance authorization → verify `triage` → create execution attempt/lease → `triage→inProgress` → start event/audit → commit  
2. **External:** revalidate authority → provider/tool with attempt-scoped idempotency key  
3. **Finalize tx:** reload attempt → verify ownership → `inProgress→terminal` → terminal event/audit → commit  

---

## 14. Execution claim and concurrency

| Mechanism | Present? |
|---|---|
| Conditional `updateMany` on expected status + owner | **Yes** (orchestrator) |
| Execution ID / lease / attempt record | **No** |
| Unique constraint on in-flight execution | **No** |
| Queue deduplication | **N/A** (no queue) |
| Worker stale-finalize protection | **No** — second worker with same owner could not reclaim from `inProgress` without race; concurrent **direct status** or manual DB change could strand or race |
| Provider idempotency scoped to attempt | **No** — keyed by `requestId` only |

**Finding:** **`PACK40D_REQUIRES_EXECUTION_LEASE_DESIGN`** — durable execution-attempt binding required before safe multi-worker or retry-heavy production use.

---

## 15. Retry and idempotency

| Concern | Current behavior |
|---|---|
| Orchestrator retry | None — caller must retry whole flow |
| Provider retry | Twilio adapter: one automatic network retry on 5xx/timeout |
| Duplicate HTTP webhook | Create idempotency prevents duplicate dispatch on replay |
| Crash after `inProgress` | Row may remain `inProgress` until manual/orchestrator retry — **no recovery worker** |
| Crash after provider success, before finalize | Provider may have succeeded; status still `inProgress`; retry may duplicate SMS unless provider idempotency holds |
| Stale payload retry | Dispatch `requestStatus` not reloaded — **stale snapshot risk** |

Conceptual crash matrix: **uncertain-outcome paths are not safely reconciled** without attempt record + provider idempotency plan.

---

## 16. Status / event / audit coherence

| Invariant | Current |
|---|---|
| Claim + start event atomic | **FAIL** — event is best-effort after commit |
| Terminal status + event atomic | **FAIL** |
| Terminal status + `stateTransition` audit atomic | **FAIL** |
| `action.status` audit for indirect transitions | **Not written** — orchestrator uses `stateTransition` only on terminal |
| Execution attempt binding on events | **Not possible** — no attempt schema |
| Replay duplicate terminal events | Possible if finalize retried after partial success |

**Schema gap:** No `VionaRequestExecutionAttempt` (or equivalent) → co-requisite **`PACK40D_REQUIRES_EXECUTION_RECORD_SCHEMA_PLAN`** if lease design adopted.

---

## 17. Confused-deputy analysis

| Attack / mismatch | Current defense | Pack40D requirement |
|---|---|---|
| Consumer job with merchant tenant fields | Twilio path ignores `merchantContext`; merchant tools require context | Recompute provenance from DB; ignore client tenant fields |
| Merchant job wrong tenant | Merchant query checks profile tenant; Twilio path **does not** | Fail closed on tenant/profile mismatch |
| Same-tenant wrong profile | **Not checked** on Twilio path | Exact profile match required for merchant rows |
| Actor owns profile but not request | Webhook sets owner=request merchant owner; JWT POC uses legacy read scope | Owner + provenance predicate on execution |
| Cross-tenant requestId | Legacy read scope may leak existence; execution uses `getVionaRequestById` | Provenance-aware execution lookup |
| Stale retry payload | `requestStatus` passed in dispatch input | Reload from DB at execution time |
| Legacy row merchant-like metadata | Orchestrator ignores `scopeKind` | **Fail closed** for `legacyUnresolved` |
| Provider callback with tenant fields | N/A today (no callback path) | Pack40S boundary |
| Execution key reuse across requests | `pack31-orchestrator-${requestId}` is per-request | Attempt-scoped keys |
| Admin/support triggering merchant execution | Internal POC uses JWT user as `authUserId` | Separate principal rules for internal routes |

---

## 18. Pack40C preservation result

Pack40D **must not modify:**

- Direct status route / controller
- `transitionVionaRequestStatus`
- Pack40C principal-context resolver / access-scope builder
- Pack40B note enforcement
- Pack40A read enforcement

**Confirmed:** Safe Pack40D design requires a **dedicated indirect execution status writer** and **execution-principal resolver** — **not** routing the orchestrator through Pack40C.

**Classification:** **`PACK40D_REQUIRES_DIRECT_INDIRECT_STATE_WRITER_SPLIT`**

---

## 19. Pack40S boundary (not in Pack40D)

Record only — do not implement:

- Staging adversarial QA for indirect execution (`Pack40S`)
- Marketing content dispatch (no `VionaRequest`)
- Tourism/booking/SOS/wallet paths (separate domains)
- Internal admin publish flows
- Future provider callback / webhook completion paths

---

## 20. Recommended design option

**Option C — direct/indirect writer split** (primary architecture)

**Co-requisites before implementation:**

- **Option B — execution-principal and lease refinement** (durable attempt/lease, stale-worker safety)
- Bounded **side-effect idempotency plan** for Twilio/escrow uncertain outcomes (Option D elements)
- Optional **execution record schema** if lease cannot be expressed with existing tables alone

**Not Option A:** multiple entry points, insufficient lease, provenance not recomputable from current execution lookups, non-atomic event writes.

**Not Option E:** paths are enumerable; authority is establishable with new principals — not blocked redesign.

---

## 21. Proposed Pack40D invariant (conceptual — not code)

```text
trusted execution trigger (webhook channel / authenticated owner / signed internal route)
→ load current request row by id (no client tenant/profile trust)
→ fail closed: legacyUnresolved, malformed provenance, inactive merchant profile
→ resolve execution principal (distinct from Pack40C user-status principal)
→ verify post-triage eligibility + tool-specific policy
→ atomic claim: expected status + provenance + create execution attempt lease
→ commit inProgress + start event/audit bound to attemptId
→ revalidate authority immediately before provider/tool
→ invoke external action with attempt-scoped idempotency key
→ atomic finalize same attempt: inProgress → completed|failed + terminal event/audit
```

---

## 22. Implementation file forecast (future — not authorized)

| Category | Expected files |
|---|---|
| **New** | `vionaRequestExecutionPrincipalContext.ts` (or equivalent) |
| **New** | `vionaRequestIndirectExecutionAccessScope.ts` |
| **New** | `vionaRequestIndirectStatusActionService.ts` (or orchestrator-local bounded writer) |
| **New** | `vionaRequestExecutionAttemptService.ts` (if schema added) |
| **Modified** | `vionaRequestExecutionOrchestrator.ts` |
| **Modified** | `vionaExecutionPlanRouteService.ts` (provenance-aware execution lookup gate) |
| **Modified** | `vionaAutonomousDispatchService.ts` (reload row; pass execution principal) |
| **Modified** | `VionaWebhookMerchantAgentController.ts` (minimal — delegate to shared gate) |
| **New tests** | `scripts/test-viona-pack40d-indirect-execution-enforcement.ts` |
| **Forbidden without separate packet** | Pack40C services; Prisma schema/migrations (unless lease refinement authorized); queue config |

**Schema/migration conclusion:** **Likely required** for durable execution-attempt/lease coherence. Escrow hold alone is **insufficient** as execution lease. Separate **`APPROVE_PACK40D_EXECUTION_LEASE_SCHEMA_REFINEMENT`** (or equivalent) recommended before implementation if lease cannot be done additively.

**Staging/deployment boundary:** No staging action in readiness audit. Future Pack40S adversarial QA is separate authorization.

---

## 23. Required implementation test plan (summary)

Full matrix: **71+ cases** as specified in operator brief — covering:

- Surface/trigger enumeration and separation from Pack40C/Pack40S
- Consumer / merchant / legacy provenance fail-closed rules
- Inactive-profile lifecycle scenarios A–D
- Execution claim atomicity and duplicate-job safety
- Crash / uncertain-outcome / retry idempotency
- Provider idempotency key scoped to attempt
- Status/event/audit coherence and rollback
- Pack40A/B/C preservation

Expand if new writers discovered during implementation refinement.

---

## 24. Final readiness classification

**Primary:** `PACK40D_REQUIRES_DIRECT_INDIRECT_STATE_WRITER_SPLIT`

**Co-requisites (must be addressed in refinement before or as part of implementation):**

- `PACK40D_REQUIRES_EXECUTION_PRINCIPAL_MODEL_REFINEMENT`
- `PACK40D_REQUIRES_EXECUTION_LEASE_DESIGN`
- `PACK40D_REQUIRES_SIDE_EFFECT_IDEMPOTENCY_PLAN`
- Possibly `PACK40D_REQUIRES_EXECUTION_RECORD_SCHEMA_PLAN`

---

## 25. Recommended next operator authorization

1. Review and merge this readiness-audit PR.  
2. Then issue a bounded refinement authorization (execution principal + lease/schema design packet) **or** combined phrase:

`APPROVE_PACK40D_TENANT_INDIRECT_PATH_REVIEW_AND_IMPLEMENTATION`

only after explicit acceptance of writer split + lease co-requisites documented above.

**Do not** begin Pack40D implementation or Pack40S from this audit alone.
