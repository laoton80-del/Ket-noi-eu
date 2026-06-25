# VIONA Request Engine — Pack25 Status Implementation Planning Result

**Document type:** Status action implementation planning result (docs-only — no implementation).
**Packet ID:** `CURSOR_PACK25_STATUS_IMPLEMENTATION_PLANNING_RESULT_DOCS_ONLY`
**Baseline:** `origin/master @ 17fb8b7` — `docs(pack25): prepare next status action planning authorization (#156)`.
**Related:** `docs/product/VIONA_REQUEST_PACK25_NEXT_STATUS_ACTION_PLANNING_AUTHORIZATION.md`, `docs/product/VIONA_REQUEST_PACK20_FIRST_NARROW_NOTE_ACTION_IMPLEMENTATION_RESULT.md`, `docs/product/VIONA_REQUEST_PACK18_REQUEST_WRITE_ACTION_PLANNING.md`, `src/domain/requests/vionaRequestStatusMachine.ts`, `src/domain/requests/vionaRequestSafetyCopy.ts`

---

## 1. Planning result summary

| Field | Value |
| --- | --- |
| Operating Protocol read | **YES** (required before any future implementation) |
| Docs-only planning result | **YES** |
| Verified master | **`17fb8b7`** |
| Pack25 request-note loop | **GREEN on master** |
| Planning authorization packet | **GREEN** (PR #156) |
| Status implementation authorized by this packet | **NO** |
| Pack24 failed | **NO** |
| Pack26 opened | **NO** |
| All non-note write/actions remain blocked | **YES** |

**This packet records the design contract and gates for a future status implementation pack.** It does **not** add routes, UI, schema changes, or mutate any request.

---

## 2. Preconditions satisfied on master

| Gate | Status |
| --- | --- |
| Pack25 request-note live QA loop closure | **GREEN** (PR #155) |
| Pack24 note live submit + operator visual | **GREEN** (PR #154) |
| Pack20 note action live-verified | **YES** |
| Pack25 next status planning authorization | **GREEN** (PR #156) |
| Pilot scoped row + one note | **YES** — status **`submitted`** |
| `POST .../actions/status` on master | **NOT IMPLEMENTED** |

---

## 3. Proposed future endpoint contract (design only — NOT IMPLEMENTED)

| Field | Value |
| --- | --- |
| Method | `POST` |
| Route | `/api/viona/requests/:id/actions/status` |
| Auth | Existing `authMiddleware` on `/api/viona` — JWT required |
| Scope | Authorized request visible via `buildAuthorizedVionaRequestWhere` |
| Behavior | Validate transition → update `VionaRequest.status` → append `VionaRequestStatusEvent` + `VionaRequestAuditEvent` in **one transaction** |

**Not in scope:** assign, confirm, cancel endpoints, payment, booking, SOS, wallet, live AI.

---

## 4. Proposed request payload (design only)

| Field | Required | Rule |
| --- | --- | --- |
| `targetStatus` | **YES** | Must be a valid `VionaRequestStatus` enum value |
| `reason` | Optional | Trimmed string; max 500 chars; no URLs/secrets; stored in audit payload |
| `note` | Optional | Trimmed string; max 4000 chars; same unsafe-content rules as Pack20 note |
| `idempotencyKey` | Optional | When provided, dedupes replay for same `(requestId, targetStatus, idempotencyKey)` |
| `clientCorrelationId` | Optional | Opaque trace id in audit payload only |

**Rejected inputs:**

- Invalid or unknown `targetStatus`
- Transition not allowed by `canTransitionRequestStatus(from, to)`
- Empty `targetStatus` equal to current status without idempotent replay semantics
- Unsafe `reason` / `note` content (URLs, bearer tokens, credentials patterns)

---

## 5. Proposed response contract (design only)

Success response mirrors Pack20 note action pattern — Pack16-compatible detail DTO plus action metadata.

### 5.1 HTTP status codes (planning)

| Case | Status |
| --- | --- |
| New transition applied | **201** |
| Idempotent replay (same key + same target) | **200** |
| Unauthorized | **401** |
| Request not found / not in scope | **404** |
| Invalid input / invalid transition | **400** |
| Server error | **500** (generic message — no secret leak) |

### 5.2 Response body shape (planning)

```json
{
  "success": true,
  "data": {
    "request": { "...": "VionaRequestDetailDto.request (Pack16 list item shape)" },
    "participants": [],
    "sourceLinks": [],
    "statusEvents": [],
    "auditEvents": [],
    "attachmentReferences": [],
    "safety": { "readOnly": false, "noPaymentCaptured": true, "...": "..." },
    "action": {
      "statusEventId": "<uuid>",
      "auditEventId": "<uuid>",
      "eventType": "action.status",
      "fromStatus": "submitted",
      "toStatus": "triage",
      "idempotentReplay": false
    },
    "safety": {
      "statusActionOnly": true,
      "noPaymentSettlement": true,
      "noBookingFulfillment": true,
      "noEmergencyEscalation": true,
      "notProductionReady": true
    }
  }
}
```

**Note:** Exact nesting to align with existing `jsonOk` controller patterns during implementation review. Detail DTO must reflect **post-transition** state including new `statusEvents` entry.

---

## 6. Permission matrix draft (server-side — design only)

| Actor | Read scoped request | Proposed first-transition allow | Deny |
| --- | --- | --- | --- |
| **Requester** (`requesterUserId`) | **YES** (Pack16) | `submitted` → `cancelled` only (narrow pilot) | `triage`, `needsHumanConfirmation`, `failed` without operator role |
| **Owner** (`ownerUserId`) | **YES** | `submitted` → `triage`, `needsHumanConfirmation`, `cancelled`, `failed` | Transitions outside state machine |
| **Participant** (`userRef` in participants) | **YES** (if in scope) | **None** in first narrow pack — read + note only unless matrix extended | All status transitions in v1 |
| **Internal / operator** (future server role gate) | **YES** when explicitly authorized | Same as owner for pilot staging QA | Cross-tenant; production without authorization |
| **Admin / support** (ADMIN middleware) | Future pack | Not in first narrow implementation | Silent bypass without audit |
| **Cross-tenant** | **NO** | **NO** | Always |
| **Unauthenticated** | **NO** | **NO** | Always |

**First narrow implementation recommendation:** Allow **owner-only** status transitions from `submitted` for staging pilot QA; requester limited to `cancelled` only if product requires — **final matrix requires operator sign-off before implementation**.

---

## 7. Allowed first status transition candidate (design only)

Pilot row today: **`submitted`**.

| Priority | From | To | Actor (draft) | Rationale |
| --- | --- | --- | --- | --- |
| **P0 (staging live QA)** | `submitted` | `triage` | Owner | Valid per state machine; ops workflow step; safety copy explicit |
| P1 | `submitted` | `needsHumanConfirmation` | Owner | Human gate status — no fulfillment implied |
| P2 | `submitted` | `cancelled` | Requester or owner | User-initiated close |
| P3 | `submitted` | `failed` | Owner | Ops failure path — requires careful copy |

**Deferred in first pack:** `sentToPartner`, `partnerResponded`, `completed` — higher fake-fulfillment risk.

---

## 8. Explicitly forbidden status meanings

All UI and API copy must **not** imply:

| Forbidden implication | Required safety posture |
| --- | --- |
| Fake fulfillment | `completed` = workflow closed, **not** service delivered |
| Booking confirmation | Use `getRequestStatusSafetyLabel` — e.g. *not booking confirmed* |
| Payment confirmation | *no payment captured* on `submitted`; no ledger truth on any status |
| SOS dispatch / rescue | No emergency escalation side effects; SOS universe copy unchanged |
| Production readiness | `notProductionReady: true` on action safety block |

---

## 9. Idempotency plan

| Rule | Detail |
| --- | --- |
| Key field | Optional `idempotencyKey` (max 128 chars) |
| Dedup scope | `(requestId, eventType: action.status, idempotencyKey, targetStatus)` |
| Replay behavior | Return **200** with `idempotentReplay: true`; no duplicate status/audit rows |
| Missing key | Each call is a new attempt — invalid duplicate transition rejected |
| Storage | Query existing `VionaRequestAuditEvent` by `payloadJson.idempotencyKey` + `targetStatus` (same pattern as Pack20 note) |
| No schema change | Use existing audit `payloadJson` — no migration required for idempotency |

---

## 10. Audit event plan

| Event | When | Fields (planning) |
| --- | --- | --- |
| `VionaRequestStatusEvent` | Every successful transition | `fromStatus`, `toStatus`, `changedByUserId`, `reason` |
| `VionaRequestAuditEvent` | Every successful transition | `eventType: action.status`, `actorUserId`, `actorRoleLabel`, `message`, `payloadJson` with `targetStatus`, `reason`, `note`, `idempotencyKey`, `clientCorrelationId` |
| Transaction | Atomic | Update `VionaRequest.status` + insert both events — rollback on any failure |
| Read path | Pack16 detail | New events visible in `statusEvents` and `auditEvents` after refresh |

---

## 11. Stop-on-error plan

| # | Stop condition |
| --- | --- |
| 1 | Missing separate operator implementation authorization |
| 2 | `canTransitionRequestStatus` returns false — return **400**, no DB write |
| 3 | Actor not permitted per matrix — return **404** or **403** (prefer **404** for scope hiding) |
| 4 | Transaction partial failure — full rollback; no orphan status without events |
| 5 | Idempotency collision with different `targetStatus` — reject, do not replay |
| 6 | Unsafe reason/note content — **400** |
| 7 | Any assign/confirm/cancel/payment/booking/SOS bundled without authorization — **STOP pack** |
| 8 | Live QA shows fake-production copy — **STOP** before merge sign-off |

---

## 12. UI copy risk notes (future UI pack — not authorized here)

| Surface | Risk | Mitigation |
| --- | --- | --- |
| Status badge after transition | User reads as booking or payment completion | Use `getRequestStatusSafetyLabel` only |
| Success toast | Overclaims ops outcome | e.g. *Status updated — preview only, not production* |
| Error toast | Leaks server internals | Generic safe messages; no stack traces |
| Status picker (if added later) | Shows invalid transitions | Server is SoT; UI may hide disallowed targets |
| Timeline coexistence | Note vs status confusion | Separate Pack22 note timeline vs status events section |

**No UI controls authorized in this planning result.**

---

## 13. Live QA plan (future — staging only)

| # | Scenario | Expected |
| --- | --- | --- |
| A1 | Owner transitions `submitted` → `triage` | **201**; detail shows new status; 1 new status event |
| A2 | Repeat with same `idempotencyKey` | **200**; `idempotentReplay: true`; no duplicate events |
| A3 | Invalid `submitted` → `completed` | **400**; status unchanged |
| A4 | Participant attempts transition | **404** or **403** per matrix |
| A5 | Cross-user request id | **404** |
| A6 | Detail refresh | Pack16 GET shows updated `status` + `statusEvents` |
| A7 | Note action still works | Pack20 note append unaffected |
| A8 | UI copy review | No payment/booking/SOS claims |

**No live QA executed in this pack.**

---

## 14. Rollback / fallback plan

| Scenario | Action |
| --- | --- |
| Bad implementation merge | Revert implementation PR; docs remain |
| Staging bad transition during QA | Manual ops correction via controlled DB pack **only** with separate authorization — not default |
| API deploy regression | Redeploy prior `viona-api-staging-eu` image — separate deploy authorization |
| Idempotency bug | Disable route via feature flag or revert — planning for kill switch in implementation pack |
| Partial transaction bug | **STOP** — fix transaction boundary before any live use |

---

## 15. Explicitly deferred

| Category | State |
| --- | --- |
| Assign / unassign | **Deferred** |
| Confirm endpoint | **Deferred** |
| Cancel endpoint (dedicated) | **Deferred** — may use status → `cancelled` only |
| Payment | **Deferred / forbidden** |
| Booking | **Deferred / forbidden** |
| SOS | **Deferred / forbidden** |
| Wallet | **Deferred / forbidden** |
| Live AI mutation | **Deferred / forbidden** |
| Pack26 | **NOT opened** |

---

## 16. Required next gate

**Separate explicit operator implementation authorization** required before any code:

> I, [Operator name], authorize **staging-only** implementation of the **narrow first status transition** endpoint `POST /api/viona/requests/:id/actions/status` per Pack25 status implementation planning result on master. Enforce state machine, permission matrix, idempotency, and dual audit events. Do not implement assign, confirm, cancel endpoints, UI controls, payment, booking, SOS, wallet, or live AI. Do not touch production. Stop on error. Live QA required before implementation sign-off.

---

## 17. Status flags

| Flag | Value |
| --- | --- |
| `pack25StatusImplementationPlanningResultPrepared` | `true` |
| `pack25StatusImplementationAuthorized` | `false` |
| `pack25NextStatusActionPlanningPrepared` | `true` |
| `pack24Failed` | `false` |
| `pack26NoteWriteUiHardeningOpened` | `false` |
| `allNonNoteWriteActionsBlocked` | `true` |

---

## 18. Recommended next lane

| Step | Action |
| --- | --- |
| 1 | Merge this docs-only planning result |
| 2 | Post-merge verify on master |
| 3 | Operator reviews permission matrix + first transition candidate |
| 4 | Operator issues **separate implementation authorization** |
| 5 | Implementation pack (code) — staging only, narrow scope, live QA |

---

**Evidence:** `docs/design/evidence/cursor-pack25-status-implementation-planning-result/README.md`
