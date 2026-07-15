# Pack40C — Status Enforcement Readiness Audit

Status: **READ-ONLY AUDIT COMPLETE — NO IMPLEMENTATION**

Operator phrase: `APPROVE_PACK40C_STATUS_ENFORCEMENT_READINESS_AUDIT`

Pack40C is **not** implemented or CLOSED/GREEN. This document records readiness only.

---

## 1. Verified master SHA

`107be5f3a9916ae0096a7cffadb06f21c16215ee` — includes Pack40B closure sync (PR #360 @ `107be5f`)

## 2. Pack40A and Pack40B closure state

| Slice | State |
|---|---|
| Pack40A | **CLOSED / GREEN** — implementation, staging deploy v24, adversarial QA |
| Pack40B | **CLOSED / GREEN** — PR #356+#357, Pack40BD deploy v25, Pack40BS QA PR #359 @ `8c038de`, closure sync PR #360 @ `107be5f` |
| Pack40C | **Unimplemented** — readiness audit only |
| Pack40D / Pack40S | **Unimplemented** |

## 3. Branch and audit commit

- Branch: `docs/pack40c-status-enforcement-readiness-audit`
- Commit: recorded at PR open time

## 4. Complete status surface inventory

### 4.1 Direct user status action (Pack40C scope)

| Layer | Location | Role |
|---|---|---|
| Public route | `POST /api/viona/requests/:id/actions/status` | `src/routes/vionaRoutes.ts` |
| Controller | `postVionaRequestStatusAction` | `src/controllers/VionaRequestController.ts` |
| Service | `transitionVionaRequestStatus` | `src/services/viona/vionaRequestStatusActionService.ts` |
| DTO / constants | `TransitionVionaRequestStatusInput`, `VIONA_REQUEST_STATUS_ACTION_ALLOWED_TRANSITION` | `src/services/viona/vionaRequestStatusActionDto.ts` |
| State machine | `canTransitionRequestStatus`, `getAllowedRequestStatusTransitions` | `src/domain/requests/vionaRequestStatusMachine.ts` |
| Legacy user scope | `buildAuthorizedVionaRequestWhere` | `src/services/viona/vionaRequestAccessScope.ts` |
| UI client gate | `transitionVionaRequestStatusControlled`, `canPerformVionaRequestStatusAction` | `src/services/vionaRequestControlledWriteApi.ts`, `src/lib/viona/requests/vionaRequestControlledWritePolicy.ts` |
| UI component | `VionaRequestStatusActionWrite` | `src/components/viona/requests/VionaRequestStatusActionWrite.tsx` |
| HTTP client | `transitionVionaRequestStatus` | `src/services/vionaRequestApi.ts` |

### 4.2 Indirect status mutation paths (Pack40D scope — out of Pack40C)

| Caller | Classification | Mechanism |
|---|---|---|
| `vionaRequestExecutionOrchestrator.ts` | **INDIRECT_EXECUTION_CALLER** | Direct Prisma `updateMany` + separate `VionaRequestStatusEvent` / audit writes; **does not** import `transitionVionaRequestStatus` |
| `vionaRequestCreateService.ts` | **INTERNAL_PRODUCT_CALLER** | Sets initial `status: submitted` on create only |
| `vionaRequestCreateFromWebhookService.ts` | **INTERNAL_PRODUCT_CALLER** | Sets initial webhook status on create only |

No webhook, background worker, or tool path invokes `transitionVionaRequestStatus`.

### 4.3 Test-only / static callers

| Caller | Classification |
|---|---|
| `scripts/test-viona-pack30d2-state-machine-audit-hooks.ts` | **TEST_ONLY** — imports builders from status service |
| `scripts/test-viona-pack40a-tenant-context-read-enforcement.ts` | **TEST_ONLY** — asserts status service unchanged |
| Pack18/Pack16/Pack17/Pack19 static check scripts | **TEST_ONLY** — structural guards |

---

## 5. Caller classification summary

| Classification | Count | Pack40C action |
|---|---|---|
| DIRECT_USER_STATUS_ACTION | 1 service surface (`transitionVionaRequestStatus` via one HTTP route) | **Enforce provenance here** |
| INTERNAL_PRODUCT_CALLER | 2 (create paths — initial status only) | **Unchanged** |
| INDIRECT_EXECUTION_CALLER | 1 (Pack31 orchestrator) | **Defer to Pack40D** |
| TEST_ONLY | multiple | **Unchanged** |

**Direct/indirect boundary recommendation: Option A — direct policy opt-in.**

Apply provenance-aware authorization only to `transitionVionaRequestStatus` (direct authenticated status action). Leave `vionaRequestExecutionOrchestrator` and other indirect Prisma status writers for Pack40D review with incompatible principal models (execution-time owner lock, non-transactional external calls).

---

## 6. Approved transition inventory

### 6.1 Pack25 direct status action allowlist (live)

| From | To | Enforced by |
|---|---|---|
| `submitted` | `triage` | `VIONA_REQUEST_STATUS_ACTION_ALLOWED_TRANSITION` + `isPack25AllowedTransition()` |

This is the **only** transition the direct status endpoint can commit. Additional transitions exist in `vionaRequestStatusMachine.ts` for other product paths (orchestrator, future flows) but are **rejected** by `isPack25AllowedTransition()` before the state machine is reached for unauthorized targets.

### 6.2 Per-transition behavior (direct path)

| Property | Value |
|---|---|
| Actor requirement | **Owner only** — `isOwnerActor(row, authUserId)` after legacy user-scope lookup |
| User-scope lookup | `buildAuthorizedVionaRequestWhere(authUserId)` (requester \| owner \| participant) |
| Effective authorization | **Owner-only** — non-owners matching user scope still receive `request_not_found` |
| Idempotency key source | Client body `idempotencyKey` (optional) |
| Uniqueness boundary | `(requestId, eventType=action.status, payloadJson.idempotencyKey)` with matching `targetStatus` |
| First-write HTTP | **201** when `idempotentReplay: false` |
| Replay HTTP | **200** when `idempotentReplay: true` |
| Audit type | `action.status` + optional post-commit `stateTransition` hook (Pack30D-2) |
| External side effect | **None** — no payment/booking/SOS/wallet/orchestration |
| Atomicity | Request `updateMany` + `VionaRequestStatusEvent` + `action.status` audit in **one** `$transaction` |
| Conditional update | `updateMany({ id, status: fromStatus, ownerUserId: authUserId })` — concurrency-safe |

Pack40C must **not** authorize or introduce a new transition.

---

## 7. Existing user scope

**Effective direct status scope today:**

```text
buildAuthorizedVionaRequestWhere(authUserId)
AND ownerUserId = authUserId   // enforced by isOwnerActor after findFirst
```

Underlying `buildAuthorizedVionaRequestWhere` OR-clause includes requester and participants, but the service rejects any row where `ownerUserId !== authUserId`. Pack40C must preserve this **owner-only** effective semantics while layering provenance — it must not broaden to requester/participant mutation.

No support/admin role, no merchant-owner shortcut outside owner check, no client-supplied tenant filter on the status path today.

---

## 8. Existing transaction flow

Current ordering in `transitionVionaRequestStatus`:

```text
[PRE-TX] auth identity trim/validate
[PRE-TX] optional text validation (reason, note)
[PRE-TX] request findFirst (legacy user scope only — no provenance)
[PRE-TX] owner check
[PRE-TX] read fromStatus from request row
[PRE-TX] idempotency lookup (findIdempotentStatusAuditEvent) — BEFORE transition validation
[PRE-TX] idempotency replay short-circuit return (200)
[PRE-TX] Pack25 allowlist check (submitted→triage)
[PRE-TX] state machine check (canTransitionRequestStatus)
[IN-TX] conditional updateMany (status fromStatus → targetStatus)
[IN-TX] VionaRequestStatusEvent.create
[IN-TX] vionaRequestAuditEvent.create (action.status)
[POST-TX] appendVionaExecutionAuditEvent (stateTransition hook — best-effort, non-blocking)
[POST-TX] getVionaRequestById for response envelope
```

### 8.1 Isolation level

Write `$transaction` uses **Prisma default** (PostgreSQL Read Committed). **Not Serializable.**

### 8.2 MerchantProfile resolution

**None** on the status path today.

### 8.3 Known gaps (mirror pre-correction Pack40B)

| Gap | Risk |
|---|---|
| Pre-transaction request lookup | Stale provenance / status read |
| Pre-transaction idempotency fast path | Replay before current authorization; documented Pack25 replay ordering bug when row already triage |
| No provenance predicate | Legacy/merchant/consumer rows authorized by owner scope alone |
| No in-transaction principal | MerchantProfile activity/tenant drift between lookup and write |
| Idempotency replay uses `getVionaRequestById` (Pack40A read path) | Replay response may succeed even when provenance would deny a fresh write |

---

## 9. Recommended Pack40C transactional design

Mirror corrected Pack40B pattern:

```text
Serializable $transaction
→ resolveVionaRequestStatusPrincipalContext(tx, authUserId)
→ buildAuthorizedVionaRequestStatusWhere(principal)
→ findFirst authorized request row (includes current status)
→ owner check (preserve existing effective scope)
→ Pack25 allowlist + state machine on current fromStatus
→ idempotency lookup/replay (only after authorization passes)
→ conditional updateMany (id + fromStatus + authorized where)
→ VionaRequestStatusEvent.create
→ action.status audit create
→ commit
→ (optional) post-commit stateTransition hook unchanged
```

**Authorization-before-idempotency** is mandatory. An old successful idempotency key must not bypass current provenance authorization.

---

## 10. Proposed Pack40C policies

### 10.1 Consumer status mutation

```text
existingStatusUserScope (owner-only effective)
AND scopeKind = consumer
AND merchantProfileId = null
```

Semantics: dual-role consumer transition allowed; inactive MerchantProfile does not block consumer branch; non-null merchantProfileId on consumer row fails closed.

### 10.2 Merchant status mutation

```text
existingStatusUserScope (owner-only effective)
AND scopeKind = merchant
AND merchantProfileId = currentMerchantProfile.id
AND tenantId = currentMerchantProfile.tenantId
AND currentMerchantProfile.isActive = true
```

### 10.3 Legacy unresolved

```text
scopeKind = legacyUnresolved → never authorize
```

Denial: `request_not_found`; no status change; no status event; no idempotency record on denied path.

---

## 11. Client-input audit

### 11.1 Legitimate approved input (direct POST body)

| Field | Role |
|---|---|
| `targetStatus` | **Required** — must be `triage` for live Pack25 path |
| `reason`, `note` | Optional text |
| `idempotencyKey`, `clientCorrelationId` | Optional replay markers |

### 11.2 Not accepted today (forbidden for authorization)

Controller reads only the fields above. Body cannot supply `tenantId`, `merchantProfileId`, `scopeKind`, or policy flags — **but** unknown JSON fields are silently ignored by Express parsing. Pack40C implementation should explicitly ignore/reject authorization-related fields if added to body (defense in depth), matching Pack40B posture.

Client cannot choose `fromStatus` — server reads current row status inside authorized lookup.

UI client (`vionaRequestControlledWritePolicy`) additionally gates `targetStatus === triage` and `requestStatus === submitted` before POST.

---

## 12. Response and existence-leak policy

| Case | Recommended HTTP | Public error |
|---|---|---|
| Wrong owner / wrong provenance / legacy / inactive merchant | **404** | `Request not found` |
| Invalid transition (authorized row, wrong from/to) | **400** | `Invalid status transition` (existing) |
| Invalid input / unsafe content | **400** | existing messages |
| Nonexistent request | **404** | `Request not found` |

Authorization denials must not leak profile, tenant, activity, provenance, or existence distinctions.

---

## 13. State-machine coherence requirements

Pack40C implementation must guarantee:

1. Authorization and transition validation use the **same** in-transaction request row.
2. `fromStatus` verified inside the write transaction.
3. `updateMany` conditional on expected `fromStatus` (already present — preserve).
4. Concurrent transition → `invalid_transition` (0 rows updated), not silent corruption.
5. Idempotent replay distinguishable from conflicting transition (`invalid_input` when key exists with different target).
6. Status event `fromStatus`/`toStatus` match committed request state.
7. Request update + status event + audit roll back together (already in one tx — preserve and extend).

No schema change required.

---

## 14. Implementation file forecast

| File | Action |
|---|---|
| `src/services/viona/vionaRequestStatusPrincipalContext.ts` | **NEW** — tx-scoped profile resolver (mirror Pack40B) |
| `src/services/viona/vionaRequestStatusAccessScope.ts` | **NEW** — provenance-aware status where builder |
| `src/services/viona/vionaRequestStatusActionService.ts` | **MODIFY** — Serializable in-tx flow, auth-before-idempotency |
| `src/controllers/VionaRequestController.ts` | **UNCHANGED** expected |
| `src/services/viona/vionaRequestStatusActionDto.ts` | **UNCHANGED** expected |
| `scripts/test-viona-pack40c-tenant-status-enforcement.ts` | **NEW** — local fake-client suite (41+ tests per §15) |
| Evidence + canonical docs | Post-implementation only |

**Must not modify for Pack40C:** `vionaRequestExecutionOrchestrator.ts`, state machine transition map, Prisma schema, Pack40A read scope, Pack40B note services.

---

## 15. Required local test plan (41 cases)

### Consumer (1–6)

1. Consumer owner performs approved `submitted→triage`.
2. Consumer replay idempotent (200, no duplicate events).
3. Dual-role consumer transition succeeds.
4. Inactive merchant profile does not block consumer transition.
5. Wrong-owner consumer denied (`request_not_found`).
6. Malformed consumer provenance denied.

### Merchant (7–14)

7. Active exact merchant performs approved transition.
8. Merchant replay idempotent.
9. Inactive merchant denied.
10. Wrong profile denied.
11. Tenant mismatch denied.
12. Missing MerchantProfile denied.
13. Merchant relation without owner scope denied.
14. Ambiguous profile resolution denied.

### Legacy (15–17)

15. Legacy unresolved owner denied.
16. Registry presence does not expose legacy.
17. Webhook-looking legacy row remains denied.

### State machine (18–23)

18. Only `submitted→triage` succeeds on direct path.
19. Invalid from-status rejected.
20. Unapproved target rejected.
21. Concurrent-state drift cannot produce invalid transition.
22. Event from/to match committed state.
23. Request update + event + audit atomic.

### Idempotency (24–29)

24. Authorization before replay.
25. Inactive merchant cannot use prior successful key.
26. Wrong-profile actor cannot use another actor's key.
27. Legacy actor cannot use prior key.
28. Replay creates no duplicate status event.
29. Conflicting payload under same key → `invalid_input`.

### Client control (30–34)

30–33. Client tenant/profile/scopeKind/policy fields cannot expand access.
34. Client cannot request unauthorized transition target.

### Preservation (35–41)

35. Pack40A reads unchanged.
36. Pack40B notes unchanged.
37. Request creation unchanged.
38. Webhook creation unchanged.
39. Pack40D/S unimplemented.
40. No schema/migration change.
41. No deployment/DB path in tests.

---

## 16. No-schema conclusion

**PASS** — Pack40C can use existing `scopeKind`, `merchantProfileId`, `tenantId` columns (Pack40P). No migration required.

---

## 17. Confirmations

| Action | Status |
|---|---|
| No Pack40C implementation | **CONFIRMED** |
| No status mutation | **CONFIRMED** |
| No database / staging access | **CONFIRMED** |
| No deployment | **CONFIRMED** |
| Pack40D / Pack40S untouched | **CONFIRMED** |

---

## 18. Pack40D / Pack40S boundary

- **Pack40C:** `POST /api/viona/requests/:id/actions/status` only.
- **Pack40D:** orchestrator and any future indirect status writers.
- **Pack40S:** staging adversarial QA after Pack40C deploy evidence.

---

## 19. Final readiness classification

**`READY_FOR_PACK40C_DIRECT_STATUS_IMPLEMENTATION`**

Rationale:

- Complete direct status surface enumerated.
- Existing owner-only effective scope is unambiguous.
- Direct and indirect callers safely separable (Option A).
- Transaction/idempotency gaps are bounded and correctable using proven Pack40B Serializable pattern without schema change.
- Approved transition remains single `submitted→triage`.

Implementation should include transactional refinement as part of the initial Pack40C PR (not a separate undocumented gap).

---

## 20. Recommended next authorization phrase

```text
APPROVE_PACK40C_TENANT_STATUS_ENFORCEMENT
```

Do not authorize staging deploy, Pack40D, or Pack40S with this phrase alone.
