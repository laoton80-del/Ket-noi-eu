# VIONA Request Engine — Pack25 Next Status Action Planning Authorization

**Document type:** Next write/action category planning and authorization packet (docs-only — no implementation).
**Packet ID:** `CURSOR_PACK25_NEXT_STATUS_ACTION_PLANNING_AUTHORIZATION_DOCS_ONLY`
**Baseline:** `origin/master @ 15b8715` — `docs(pack25): record request note loop closure signoff evidence (#155)`.
**Related:** `docs/product/VIONA_REQUEST_PACK25_REQUEST_NOTE_LOOP_CLOSURE_SIGNOFF_EVIDENCE.md`, `docs/product/VIONA_REQUEST_PACK18_REQUEST_WRITE_ACTION_PLANNING.md`, `docs/product/VIONA_REQUEST_PACK20_FIRST_NARROW_NOTE_ACTION_IMPLEMENTATION_RESULT.md`, `src/domain/requests/vionaRequestStatusMachine.ts`, `src/domain/requests/vionaRequestSafetyCopy.ts`

---

## 1. Packet summary

| Field | Value |
| --- | --- |
| Operating Protocol read | **YES** (required before any future implementation) |
| Docs-only planning/authorization | **YES** |
| Verified master | **`15b8715`** |
| Pack25 request-note loop | **GREEN on master** |
| Pack24 failed | **NO** |
| Pack26 opened | **NO** |
| All non-note write/actions remain blocked | **YES** |
| Next candidate category | **Request status lifecycle** (planning only) |
| Implementation authorized by this packet | **NO** |

**This packet prepares planning scope only.** It does **not** authorize status mutation, routes, UI controls, DB execution, or live QA unless the operator issues **separate explicit implementation authorization** after the future gates in §8 pass.

---

## 2. Current gate context (green on master)

| Gate | Status |
| --- | --- |
| Pack25 request-note live QA loop closure | **GREEN** (PR #155) |
| Pack24 note live submit + operator visual | **GREEN** (PR #154) |
| Scoped pilot row execution | **GREEN** (PR #153) |
| Pack20 note action (`POST .../actions/note`) | **Implemented + verified live** |
| Staging pilot scoped row | **1** visible row for pilot User A |
| Notes on scoped row | **Exactly 1** |
| Current request status | **`submitted`** (unchanged) |
| Status events on scoped row | **0** |
| Assign / confirm / cancel used | **NO** |

---

## 3. Proposed next category: request status lifecycle

### 3.1 Planning-only boundary

| Boundary | State |
| --- | --- |
| Status action implemented in this pack | **NO** |
| Server/API routes added | **NO** |
| UI status controls added | **NO** |
| Any request status mutated | **NO** |
| Assign / confirm / cancel | **NO** |
| Payment / booking / SOS / wallet / live AI | **NO** |

### 3.2 Purpose of future status category (when separately authorized)

Enable **authorized, audited, server-enforced** transitions of `VionaRequest.status` along the existing domain state machine — without implying payment captured, booking confirmed, SOS dispatch, wallet settlement, or production readiness.

**Future narrow first scope (planning proposal — not authorized here):**

| From status (pilot row today) | Candidate first transitions | Rationale |
| --- | --- | --- |
| `submitted` | `triage`, `needsHumanConfirmation`, `cancelled`, `failed` | Matches `vionaRequestStatusMachine` from current pilot row state |

**Full status vocabulary (design/planning reference only — from repo domain):**

`draft`, `submitted`, `triage`, `needsHumanConfirmation`, `sentToPartner`, `partnerResponded`, `completed`, `cancelled`, `failed`

**Transition rules:** Governed by `src/domain/requests/vionaRequestStatusMachine.ts` — invalid skips must be rejected server-side.

**Safety copy:** All user-visible status labels must use `getRequestStatusSafetyLabel` patterns — e.g. *submitted* means **not paid**; *completed* means **not ledger/fulfillment truth**.

### 3.3 Proposed future route (NOT IMPLEMENTED)

| Method | Route | Purpose | Status |
| --- | --- | --- | --- |
| `POST` | `/api/viona/requests/:id/actions/status` | Authorized status transition + audit | **NOT IMPLEMENTED** |

Per Pack18 planning — subject to separate implementation pack review.

---

## 4. Safety risks (must be mitigated before implementation)

| # | Risk | Mitigation requirement |
| --- | --- | --- |
| 1 | **Fake fulfillment** — UI/API implies booking/payment/dispatch complete | Safety copy review; no "confirmed" language without separate authorized systems |
| 2 | **Accidental booking confirmation** — status names misread as tourism/local fulfillment | Status labels must use VIONA safety copy; no LocalServiceRequest status reuse |
| 3 | **User-visible false progress** — status jumps skip human gates | Enforce `canTransitionRequestStatus`; reject invalid transitions with safe errors |
| 4 | **Tenant-crossing status changes** — actor mutates request outside scope | `buildAuthorizedVionaRequestWhere` + server-side actor matrix; no cross-tenant writes |
| 5 | **Audit gaps** — status changes without trace | Every transition writes `VionaRequestStatusEvent` + `VionaRequestAuditEvent` in one transaction |

---

## 5. Explicitly deferred categories

The following remain **blocked** until **separate** planning + authorization packs after status lifecycle is proven (if product proceeds):

| Category | State |
| --- | --- |
| Assign / unassign | **Deferred** |
| Confirm (human checkpoint action) | **Deferred** |
| Cancel (as dedicated action endpoint) | **Deferred** — may overlap status transition to `cancelled` in status pack |
| Payment | **Deferred / forbidden without payment pack** |
| Booking | **Deferred / forbidden without booking pack** |
| SOS | **Deferred / forbidden without SOS pack** |
| Wallet | **Deferred / forbidden without wallet pack** |
| Live AI mutation | **Deferred / forbidden without AI safety pack** |
| Pack26 UI hardening | **NOT opened as failure pack** |

---

## 6. Required future gates before implementation

Future status implementation requires **all** of the following before any code merge:

| # | Gate | Required artifact |
| --- | --- | --- |
| 1 | Explicit operator authorization | Separate operator message authorizing status implementation scope only |
| 2 | Route design | Docs: request/response contract, error codes, no secret leakage |
| 3 | Permission model | Server-side matrix aligned with requester/owner/participant scope |
| 4 | Idempotency design | `idempotencyKey` replay for same transition; no double status events |
| 5 | Audit event design | `VionaRequestStatusEvent` + `VionaRequestAuditEvent` payload schema |
| 6 | Rollback / stop-on-error plan | No partial writes; transaction boundary documented |
| 7 | UI copy review | All status labels and success/error strings reviewed for fake-production risk |
| 8 | Live QA plan | Staging-only matrix: allowed transition, denied transition, scope denial, audit visibility |

---

## 7. Stop-on-error conditions (future implementation)

Stop immediately if any of the following occur during future status implementation or live QA:

| # | Condition |
| --- | --- |
| 1 | Missing separate operator implementation authorization |
| 2 | Invalid transition accepted (state machine bypass) |
| 3 | Status change without audit events |
| 4 | Cross-user or cross-tenant visibility/mutation |
| 5 | UI copy implies payment/booking/SOS/wallet truth |
| 6 | Assign/confirm/cancel/payment/booking/SOS/wallet/live AI bundled without authorization |
| 7 | Production target without explicit production authorization |
| 8 | Secrets/database URLs printed in evidence or logs |

---

## 8. Operator authorization model

### 8.1 What this packet authorizes

| Item | Status |
| --- | --- |
| Document next status lifecycle planning scope | **YES** |
| Open PR for docs-only planning packet | **YES** |
| Implement status routes/UI/behavior | **NO** |
| Mutate staging/production requests | **NO** |

### 8.2 Required future implementation authorization (template — not active)

> I, [Operator name], authorize **staging-only** implementation of the **narrow first status transition** category for scoped Viona requests under the existing state machine, with server-side permission checks, idempotency, and dual audit events. Do not implement assign, confirm, cancel endpoints, payment, booking, SOS, wallet, or live AI mutation. Do not touch production. Stop on error. Live QA required before merge sign-off.

---

## 9. Status flags

| Flag | Value |
| --- | --- |
| `pack25RequestNoteLoopClosureSignOff` | `green` |
| `pack25NextStatusActionPlanningPrepared` | `true` |
| `pack25NextStatusActionImplementationAuthorized` | `false` |
| `pack24Failed` | `false` |
| `pack26NoteWriteUiHardeningOpened` | `false` |
| `allNonNoteWriteActionsBlocked` | `true` |

---

## 10. Recommended next lane

| Step | Action |
| --- | --- |
| 1 | Merge this docs-only planning authorization packet |
| 2 | Post-merge verify on master |
| 3 | If product proceeds — separate **implementation planning result** pack (route contract, permission matrix draft) |
| 4 | Operator issues **separate implementation authorization** only after §6 gates are satisfied |
| 5 | **Do not** open Pack26; **do not** implement assign/confirm/cancel/payment/booking/SOS/wallet/live AI by default |

---

**Evidence:** `docs/design/evidence/cursor-pack25-next-status-action-planning-authorization/README.md`
