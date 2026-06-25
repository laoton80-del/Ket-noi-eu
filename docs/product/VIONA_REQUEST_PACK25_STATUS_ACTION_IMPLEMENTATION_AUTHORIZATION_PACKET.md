# VIONA Request Engine — Pack25 Status Action Implementation Authorization Packet

**Document type:** Narrow status action implementation authorization packet (docs-only — no code execution).
**Packet ID:** `CURSOR_PACK25_STATUS_ACTION_IMPLEMENTATION_AUTHORIZATION_PACKET_DOCS_ONLY`
**Baseline:** `origin/master @ ef71c35` — `docs(pack25): record status implementation planning result (#157)`.
**Related:** `docs/product/VIONA_REQUEST_PACK25_STATUS_IMPLEMENTATION_PLANNING_RESULT.md`, `docs/product/VIONA_REQUEST_PACK25_NEXT_STATUS_ACTION_PLANNING_AUTHORIZATION.md`, `docs/product/VIONA_REQUEST_PACK25_REQUEST_NOTE_LOOP_CLOSURE_SIGNOFF_EVIDENCE.md`, `docs/product/VIONA_REQUEST_PACK20_FIRST_NARROW_NOTE_ACTION_IMPLEMENTATION_RESULT.md`, `src/domain/requests/vionaRequestStatusMachine.ts`

---

## 1. Packet summary

| Field | Value |
| --- | --- |
| Operating Protocol read | **YES** (required before any future execution) |
| Docs-only authorization packet | **YES** |
| Verified master | **`ef71c35`** |
| Pack25 request-note loop | **GREEN on master** |
| Status planning authorization | **GREEN** (PR #156) |
| Status implementation planning result | **GREEN** (PR #157) |
| Status endpoint on master | **NOT IMPLEMENTED** |
| Code/execution authorized by this packet | **NO** |
| Pack24 failed | **NO** |
| Pack26 opened | **NO** |
| All non-note write/actions remain blocked | **YES** |

**This packet prepares implementation scope only.** It does **not** authorize code merge, staging mutation, deploy, or live QA unless the operator issues a **separate explicit implementation authorization** (see §9).

---

## 2. Current gate context (green on master)

| Gate | Status |
| --- | --- |
| Pack25 request-note live QA loop closure | **GREEN** (PR #155) |
| Pack24 note live submit + operator visual | **GREEN** (PR #154) |
| Pack20 note action | **Implemented + live-verified** |
| Pack25 next status planning authorization | **GREEN** (PR #156) |
| Pack25 status implementation planning result | **GREEN** (PR #157) |
| Pilot scoped row for User A | **1** row — status **`submitted`** |
| Notes on scoped row | **Exactly 1** |
| `POST /api/viona/requests/:id/actions/status` | **NOT IMPLEMENTED** |

---

## 3. Future implementation candidate (planning lock — not executed)

| Field | Value |
| --- | --- |
| Environment | **Staging pilot only** |
| Route | `POST /api/viona/requests/:id/actions/status` |
| First transition | **`submitted` → `triage`** |
| Actor scope | **Owner-only** (`ownerUserId === authUserId`) |
| Request scope | Existing `buildAuthorizedVionaRequestWhere` |
| State machine | `canTransitionRequestStatus('submitted', 'triage')` must pass |

**Not in first implementation candidate:** any other transition, requester/participant actors, production deploy, UI controls.

---

## 4. Proposed future code boundaries (when separately authorized)

Future implementation pack may touch **only**:

| Area | Allowed |
| --- | --- |
| Route handler | `POST .../actions/status` registration in `vionaRoutes.ts` |
| Controller | Thin handler delegating to service |
| Service | Permission check, transition validation, idempotency, transaction |
| DTO | Request/response types aligned with planning result |
| Audit writes | `VionaRequestStatusEvent` + `VionaRequestAuditEvent` |
| Response | Pack16-compatible `VionaRequestDetailDto` + action metadata |
| Tests / smoke | Unit/integration coverage for narrow transition only |

**Explicitly out of scope for first implementation:**

| Area | Forbidden |
| --- | --- |
| UI status controls | **NO** |
| Assign / confirm / cancel endpoints | **NO** |
| Payment / booking / SOS / wallet / live AI | **NO** |
| Prisma schema / migrations | **NO** |
| Broad transition matrix | **NO** — only `submitted` → `triage` |
| Production deploy | **NO** |

---

## 5. Explicitly forbidden in future implementation

| Category | Rule |
| --- | --- |
| Assign / unassign | **Forbidden** |
| Confirm endpoint | **Forbidden** |
| Cancel endpoint (dedicated) | **Forbidden** |
| Payment confirmation semantics | **Forbidden** — no ledger truth |
| Booking confirmation semantics | **Forbidden** — safety copy only |
| SOS dispatch / rescue implication | **Forbidden** — no emergency side effects |
| Wallet mutation | **Forbidden** |
| Live AI mutation | **Forbidden** |
| Production deploy | **Forbidden** without separate production authorization |
| Fake fulfillment copy | **Forbidden** — use `getRequestStatusSafetyLabel` |

---

## 6. Stop-on-error conditions (future implementation)

Stop immediately if any of the following occur:

| # | Condition |
| --- | --- |
| 1 | Missing separate operator implementation authorization |
| 2 | Permission ambiguity (owner vs requester vs participant) |
| 3 | Tenant / user scope ambiguity |
| 4 | Status machine mismatch — invalid transition accepted |
| 5 | Idempotency conflict — same key, different `targetStatus` |
| 6 | Audit event failure — status updated without events |
| 7 | Prisma / schema mismatch requiring migration |
| 8 | Test or smoke failure |
| 9 | Secret / env exposure risk in logs or responses |
| 10 | Any bundled assign/confirm/cancel/payment/booking/SOS/wallet/live AI |

---

## 7. Future live QA plan (staging only — not executed in this pack)

| # | Check | Expected |
| --- | --- | --- |
| 1 | Target | Staging API only — boolean REST base check |
| 2 | Scope | Pilot User A scoped row only |
| 3 | Precondition | Status **`submitted`** before transition |
| 4 | Action | One `POST .../actions/status` with `targetStatus: triage` as **owner** |
| 5 | Response | **201** (or **200** idempotent replay) |
| 6 | Detail DTO | Pack16 GET detail **200**; status **`triage`** |
| 7 | Audit | New `VionaRequestStatusEvent` + `action.status` audit event |
| 8 | Status change only | **`submitted` → `triage`** — no other field mutation |
| 9 | Note preservation | Existing note count unchanged — no duplication |
| 10 | Assign/confirm/cancel | **Not used** |
| 11 | Invalid transition probe | e.g. `triage` → `completed` rejected **400** |
| 12 | Non-owner probe | Requester/participant denied |

**No live QA executed in this authorization packet.**

---

## 8. Rollback / fallback

| Scenario | Action |
| --- | --- |
| Local tests fail before merge | **STOP** — do not open implementation PR |
| Implementation PR merged with defect | Revert implementation commit — docs remain |
| Staging bad transition during QA | **STOP** — evidence-first; no ad-hoc DB fix without separate authorization |
| Deploy regression | Redeploy prior staging image — separate deploy authorization only |
| Blocked mid-pack | Record evidence; do not workaround with unauthorized DB commands |

---

## 9. Operator authorization model

### 9.1 What this packet authorizes

| Item | Status |
| --- | --- |
| Document narrow status implementation scope | **YES** |
| Open PR for docs-only authorization packet | **YES** |
| Implement `POST .../actions/status` | **NO** |
| Mutate staging/production requests | **NO** |
| Deploy to staging or production | **NO** |

### 9.2 Required future implementation authorization (template — not active)

Future code implementation requires a **separate explicit operator message**. Example scope-lock template:

> I, [Operator name], authorize **staging-only** implementation of the narrow status action `POST /api/viona/requests/:id/actions/status` for **owner-only** transition **`submitted` → `triage`** on scoped pilot requests, per Pack25 status implementation planning result and authorization packet on master. Enforce state machine, permission checks, idempotency, and dual audit events. Do not implement assign, confirm, cancel, UI controls, payment, booking, SOS, wallet, or live AI. Do not touch production. Do not change Prisma schema or migrations. Stop on error. Run staging live QA before implementation sign-off.

---

## 10. Status flags

| Flag | Value |
| --- | --- |
| `pack25StatusImplementationPlanningResultVerified` | `true` |
| `pack25StatusActionImplementationAuthorizationPacketPrepared` | `true` |
| `pack25StatusActionImplementationAuthorized` | `false` |
| `pack25StatusActionExecutionPerformed` | `false` |
| `pack24Failed` | `false` |
| `pack26NoteWriteUiHardeningOpened` | `false` |
| `allNonNoteWriteActionsBlocked` | `true` |

---

## 11. Required next steps

| Step | Action |
| --- | --- |
| 1 | Merge this docs-only authorization packet |
| 2 | Post-merge verify on master |
| 3 | Operator reviews owner-only `submitted` → `triage` candidate |
| 4 | Operator issues **separate explicit implementation authorization** |
| 5 | Implementation pack (code) — staging narrow scope only |
| 6 | **Do not** open Pack26; **do not** bundle deferred write categories |

---

**Evidence:** `docs/design/evidence/cursor-pack25-status-action-implementation-authorization-packet/README.md`
