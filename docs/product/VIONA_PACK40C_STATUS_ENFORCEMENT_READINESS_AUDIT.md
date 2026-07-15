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
- Initial audit: PR #361 @ `d64b782` (merged to master)
- Refinement commit: recorded at push time

## 3A. Refinement summary (replay-safe + owner-only DB predicate)

Corrective refinements applied after PR #361 merge:

1. **Owner-only authorization** enforced in the **database predicate** (`ownerUserId = authUserId` + provenance), not primarily via post-fetch `isOwnerActor()`.
2. **Replay-safe ordering** — state-aware in-transaction flow; replay after current authorization, **before** new-mutation `submitted→triage` validation.

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
| Actor requirement | **Owner only** — `ownerUserId = authUserId` in authorized DB lookup (primary boundary) |
| User-scope lookup (live) | `buildAuthorizedVionaRequestWhere` + post-fetch `isOwnerActor()` — **Pack40C must replace this** |
| Effective authorization (Pack40C target) | **Owner-only in DB predicate** — requester/participant never match authorized lookup |
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

## 7. Existing user scope (live) and Pack40C owner-only DB predicate

### 7.1 Live behavior today (must not be replicated as primary boundary)

```text
findFirst where buildAuthorizedVionaRequestWhere(authUserId)   // requester | owner | participant
→ isOwnerActor(row, authUserId) in application memory
→ request_not_found if not owner
```

This pattern is **not** the Pack40C target. Requester-only and participant-only actors must **never** fetch an authorized row.

### 7.2 Required Pack40C authorized lookup (primary boundary)

```text
id = requestId
AND ownerUserId = authUserId
AND provenance branch (consumer | active merchant)
```

Conceptual full predicate:

```text
AND: [
  { id: requestId, ownerUserId: authUserId },
  OR: [
    { scopeKind: consumer, merchantProfileId: null },
    { scopeKind: merchant, merchantProfileId: M.id, tenantId: M.tenantId, M.isActive: true }
  ]
]
```

### 7.3 Required conclusions

1. **Requester-only** actors cannot transition status.
2. **Participant-only** actors cannot transition status.
3. **MerchantProfile ownership** does not replace request `ownerUserId` equality.
4. **Tenant equality** does not replace request ownership.
5. Owner scope and provenance are applied in the **same database query**.
6. Unauthorized rows remain **not-found-safe** (`request_not_found` / HTTP 404).

### 7.4 Defensive assertion (optional, not primary)

Implementation **may** retain `isOwnerActor()` after retrieval as a defensive invariant check. It must **not** be the primary authorization boundary.

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

## 9. Recommended Pack40C transactional design (replay-safe)

### 9.1 In-transaction ordering (authoritative)

```text
Serializable transaction begins
→ resolve current MerchantProfile using transaction client
→ provenance-aware owner-only authorized request lookup
   (id + ownerUserId + provenance branch in same WHERE)
→ look up idempotency record for current actor/request/action/key
→ IF matching authorized replay exists:
     verify actor, request, action category, idempotency key, targetStatus binding
     verify payload fingerprint / equivalent existing binding (reason, note)
     verify replay state consistency (see §9.3)
     return existing replay result (HTTP 200, idempotentReplay: true)
→ ELSE validate new direct transition:
     confirm current request status
     enforce submitted → triage only (Pack25 allowlist + state machine)
     conditional updateMany (id + ownerUserId + fromStatus + authorized where)
     require exactly one updated row
     create VionaRequestStatusEvent + action.status audit atomically
→ commit
→ (post-tx) best-effort stateTransition hook (§9.6)
```

### 9.2 Authorization-before-replay (mandatory)

**Current** provenance and owner authorization must pass **before** any idempotency replay return.

A prior successful key must **not** bypass:

- a different actor;
- a different request;
- a different target status;
- a different action category;
- materially conflicting reason/note payload;
- inactive merchant profile;
- wrong-profile or tenant-mismatched merchant;
- legacy-unresolved request.

### 9.3 Why transition validation cannot always precede replay

**Concrete replay case:**

```text
First call:  submitted → triage  (commit)
Replay call: current row already triage; same authorized owner; same key/payload
```

If implementation requires `fromStatus === submitted` **before** checking the committed idempotency record, a **legitimate replay would incorrectly fail** (`invalid_transition`).

The implementation must distinguish:

| Outcome | Meaning |
|---|---|
| Valid replay | Authorized actor + bound key + state consistent with recorded target |
| New mutation | No valid replay; current status allows submitted → triage |
| Key conflict | Same key, different target/payload/request/actor → existing `invalid_input` |
| Unauthorized replay | Current authorization fails → `request_not_found` |

**New-mutation** transition validation (`submitted → triage`) runs **only after** confirming no valid authorized replay exists.

### 9.4 Replay state-consistency requirements

For an existing successful `action.status` record, safe replay requires:

```text
recorded fromStatus = submitted
recorded toStatus   = triage
current request.status = triage
```

**Must not silently return replay success when:**

- current status differs from recorded committed `toStatus`;
- linked `VionaRequestStatusEvent` is missing or disagrees;
- `action.status` payload binding incomplete;
- key bound to conflicting payload/target.

Classify inconsistencies using **existing** safe contracts:

- `invalid_input` — key exists with conflicting target/payload (already live for mismatched targetStatus);
- `invalid_transition` — authorized row present but state/event inconsistency prevents safe replay;
- `request_not_found` — current authorization fails (including replay after profile deactivation).

Do **not** invent new public error codes during readiness.

### 9.5 Concurrency requirements

- **Serializable** interactive transaction throughout authorization, idempotency, and mutation paths.
- MerchantProfile resolution, authorized lookup, idempotency lookup, conditional update, status event, and audit in the **same** transaction.
- No silent retry of write-capable transactions unless an already-approved bounded retry exists (none today).

Concurrent status transition must yield:

- one valid commit; or
- the other operation becomes valid replay or safe conflict;
- **never** two transition events for one logical operation.

### 9.6 Post-transaction `stateTransition` hook (Pack30D-2)

Current live behavior in `transitionVionaRequestStatus`:

| Property | Conclusion |
|---|---|
| Purpose | **Observability / audit-ledger hook** — additive `stateTransition` event; mock-only messaging |
| Atomicity boundary | **Outside** committed status/event transaction |
| Failure handling | Logged; **does not roll back** committed transition |
| Product side effect | **None mandatory** — failure must not make transition incomplete |
| Pack40D | Hook must **not** be broadened into execution/orchestration; indirect effects remain Pack40D |

**Conclusion:** Hook is **best-effort, non-mandatory**. Pack40C does **not** require `PACK40C_REQUIRES_TRANSACTIONAL_REFINEMENT_PLAN` on this basis.

Hook is **not fired** on idempotent replay (no new transition occurred) — preserve this.

---

## 10. Proposed Pack40C policies

### 10.1 Consumer status mutation

```text
ownerUserId = authUserId                    // DB predicate (primary)
AND scopeKind = consumer
AND merchantProfileId = null
```

Semantics: dual-role consumer transition allowed; inactive MerchantProfile does not block consumer branch; non-null merchantProfileId on consumer row fails closed.

### 10.2 Merchant status mutation

```text
ownerUserId = authUserId                    // DB predicate (primary)
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
| `scripts/test-viona-pack40c-tenant-status-enforcement.ts` | **NEW** — local fake-client suite (50 tests per §15) |
| Evidence + canonical docs | Post-implementation only |

**Must not modify for Pack40C:** `vionaRequestExecutionOrchestrator.ts`, state machine transition map, Prisma schema, Pack40A read scope, Pack40B note services.

---

## 15. Required local test plan (50 cases)

### Owner-only DB predicate (O1–O3)

O1. Owner-only predicate applied in DB authorization (no requester/participant branch in status where builder).
O2. Requester-only actor denied (`request_not_found`).
O3. Participant-only actor denied (`request_not_found`).

### Consumer (C1–C6)

C1. Consumer owner performs approved `submitted→triage`.
C2. Consumer replay idempotent (200, no duplicate events).
C3. Dual-role consumer transition succeeds.
C4. Inactive merchant profile does not block consumer transition.
C5. Wrong-owner consumer denied.
C6. Malformed consumer provenance denied.

### Merchant (M1–M8)

M1. Active exact merchant performs approved transition.
M2. Merchant replay idempotent.
M3. Inactive merchant denied.
M4. Wrong profile denied.
M5. Tenant mismatch denied.
M6. Missing MerchantProfile denied.
M7. Merchant relation without owner scope denied.
M8. Ambiguous profile resolution denied.

### Legacy (L1–L3)

L1. Legacy unresolved owner denied.
L2. Registry presence does not expose legacy.
L3. Webhook-looking legacy row remains denied.

### State machine (S1–S6)

S1. Only `submitted→triage` succeeds on direct path for new mutation.
S2. Invalid from-status rejected (new mutation path).
S3. Unapproved target rejected.
S4. Concurrent-state drift cannot produce invalid transition.
S5. Event from/to match committed state.
S6. Request update + event + audit atomic rollback on failure.

### Replay-safe idempotency (I1–I14)

I1. Valid first transition succeeds (201).
I2. Valid replay succeeds when current status is already `triage` (200).
I3. Replay checked only **after** current authorization passes.
I4. Inactive merchant cannot replay old successful transition.
I5. Wrong-profile actor cannot replay.
I6. Legacy-unresolved owner cannot replay.
I7. Same key + different target status → `invalid_input`.
I8. Same key + different request → no match / safe denial.
I9. Same key + different actor → no match / `request_not_found`.
I10. Same key + materially different payload → existing conflict behavior.
I11. Replay record present but current status ≠ recorded target → safe failure (not silent success).
I12. Incomplete event/audit linkage → safe failure.
I13. New mutation validates `submitted→triage` only when no valid replay exists.
I14. Concurrent conditional update cannot create duplicate transition events.

### Post-transaction hook (H1–H2)

H1. Hook failure does not roll back committed transition or change HTTP success.
H2. Hook does not fire on idempotent replay; cannot implement Pack40D execution.

### Client control (X1–X5)

X1–X4. Client tenant/profile/scopeKind/policy fields cannot expand access.
X5. Client cannot request unauthorized transition target.

### Preservation (P1–P7)

P1. Pack40A reads unchanged.
P2. Pack40B notes unchanged.
P3. Request creation unchanged.
P4. Webhook creation unchanged.
P5. Pack40D/S unimplemented.
P6. No schema/migration change.
P7. No deployment/DB path in tests.

**Total: 50 tests** (O3 + C6 + M8 + L3 + S6 + I14 + H2 + X5 + P7 = 50).

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

Refinement confirms:

1. Owner-only DB predicate is explicit (§7.2).
2. Replay-safe ordering is explicit (§9.1–§9.3).
3. Idempotency binding is sufficient (§9.2).
4. Replay state-consistency behavior is defined (§9.4).
5. Serializable transaction design is bounded (§9.5).
6. Post-transaction hook is confirmed non-mandatory/best-effort (§9.6).
7. No schema change required (§16).
8. Direct and indirect callers remain separated (§5).

Implementation must include replay-safe transactional design in the initial Pack40C PR.

## 20. Recommended next authorization phrase

```text
APPROVE_PACK40C_TENANT_STATUS_ENFORCEMENT
```

Do not authorize staging deploy, Pack40D, or Pack40S with this phrase alone.
