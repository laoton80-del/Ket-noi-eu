# VIONA Request Engine — Pack18 Request Write/Action Planning

**Document type:** Request write/action layer planning (docs-only — no implementation).
**Baseline:** `origin/master @ 2ed1d29` — `feat(pack17): wire live read-only Viona request inbox to Pack16 API (#136)`.
**Related:** `docs/product/VIONA_REQUEST_PACK17_LIVE_READ_ONLY_REQUEST_INBOX_IMPLEMENTATION_RESULT.md`, `docs/product/VIONA_REQUEST_PACK16_READ_ONLY_REQUEST_API_IMPLEMENTATION_RESULT.md`, `docs/product/VIONA_REQUEST_INBOX_READONLY_FOUNDATION.md`, `src/domain/requests/vionaRequestStatusMachine.ts`

---

## 1. Baseline

| Field | Value |
| --- | --- |
| Remote | `origin/master` |
| Commit | `2ed1d29` |
| Message | `feat(pack17): wire live read-only Viona request inbox to Pack16 API (#136)` |
| Pack15C DB apply | **Green** (PR #131) |
| Pack15D verification | **Green** (PR #133) |
| Pack16 read-only API | **Green** on master (PR #135 @ `6ddbc59`) |
| Pack17 live read-only inbox | **Green** on master (PR #136 @ `2ed1d29`) |
| Pack18 planning authorized | **YES** — Nong Si Buong (planning only) |
| All write/actions | **Blocked** until separate implementation authorization |

---

## 2. Operator authorization

| Item | Value |
| --- | --- |
| Operator authorization present | **YES** |
| Operator | **Nong Si Buong** |
| Authorization scope | Pack18 request write/action **planning** on current master only |
| Mutations authorized in this pack | **NO** |
| Action endpoints authorized in this pack | **NO** |
| Write/action UI authorized in this pack | **NO** |
| Payments / booking / SOS / wallet / live AI changes | **NO** |

---

## 3. Pack18 objective

Pack18 plans the **next request mutation/action layer** after the verified read-only foundation:

| Layer | State on master |
| --- | --- |
| Pack15 schema + DB apply | Applied and verified |
| Pack16 read-only API | Implemented and verified |
| Pack17 live read-only inbox | Implemented and verified |
| Pack18 write/action | **Planning only** — not implemented |

Pack18 defines **what may be built later**, under **separate implementation authorization**, without changing Pack16 API behavior or Pack17 read-only UI.

---

## 4. Future action types

**Label:** `FUTURE IMPLEMENTATION ONLY — NOT BUILT IN THIS PACK`

| Action type | Future purpose | First mutation pack scope |
| --- | --- | --- |
| Status transition | Move request through workflow states per state machine | **Candidate for Pack20** (narrow first mutation) |
| Assign / unassign | Route request to operator/participant role | Later pack — after status/note proven |
| Confirm | Human confirmation checkpoint (not payment/booking truth) | Later pack — explicit human gate required |
| Cancel | Requester or authorized actor cancels workflow | Later pack — permission matrix required |
| Operator note | Append audit-visible note without status change | **Candidate for Pack20** (narrow first mutation) |
| Participant update | Add/update participant metadata (no contact secret export) | Later pack |
| Attachment reference update | Add opaque attachment metadata reference | Later pack |
| Audit event write | Mandatory side effect of every future write | **Required in every mutation pack** |
| Notification trigger | Plan outbound notification hooks | **Planning only** — no live notification in first mutation pack |

**Explicit exclusions for first mutation implementation pack(s):**

- No payment capture, wallet mutation, or ledger writes
- No booking confirmation or tourism/local fulfillment truth
- No SOS dispatch or emergency escalation side effects
- No live AI autonomous protected actions

---

## 5. Permission model

Future write/action authorization must use **server-side** enforcement aligned with `vionaRequestRoleTenantAccessMatrix` — not client-only role checks.

| Actor | Future allowed actions (subject to matrix + gates) | Deny rules |
| --- | --- | --- |
| Requester (`requesterUserId === authUserId`) | Cancel own draft/submitted where allowed; add note on own request | No cross-user reads/writes; no admin escalation |
| Owner / operator (future resolved role) | Status transition within allowed machine; assign/unassign; operator note | No silent privilege escalation; audit required |
| Participant (`userRef === authUserId`) | Read + limited note if explicitly granted in future pack | No status change unless matrix extended |
| Admin / support (server ADMIN gate) | Global ops actions with universe filter + audit | No bypass without auditRead; no fake production claims |
| Cross-tenant | **Denied by default** | Tenant isolation via `tenantId` + business ownership checks |

| Principle | Rule |
| --- | --- |
| Cross-user leakage | **Forbidden** |
| Cross-tenant leakage | **Forbidden** |
| Silent privilege escalation | **Forbidden** |
| Client-only authorization | **Insufficient** — server middleware + service boundary required |

Pack16 requester-owned read scope remains unchanged until a **separate** admin/operator write pack is authorized.

---

## 6. Future API design (NOT IMPLEMENTED)

**Label:** `FUTURE ROUTES ONLY — NOT IMPLEMENTED IN PACK18`

All routes below are **NOT IMPLEMENTED**. Subject to later implementation review and separate operator authorization.

| Method | Route | Future purpose | Status in Pack18 |
| --- | --- | --- | --- |
| `POST` | `/api/viona/requests/:id/actions/status` | Authorized status transition | **NOT IMPLEMENTED** |
| `POST` | `/api/viona/requests/:id/actions/assign` | Assign / unassign participant or operator | **NOT IMPLEMENTED** |
| `POST` | `/api/viona/requests/:id/actions/confirm` | Human confirmation checkpoint | **NOT IMPLEMENTED** |
| `POST` | `/api/viona/requests/:id/actions/cancel` | Authorized cancel | **NOT IMPLEMENTED** |
| `POST` | `/api/viona/requests/:id/actions/note` | Append operator/requester note (audit event) | **NOT IMPLEMENTED** |

### Future request body principles (planning)

| Field | Rule |
| --- | --- |
| `action` / `targetStatus` / `reason` | Explicit, validated enums/strings |
| `idempotencyKey` | Required for mutation endpoints (see §7) |
| `expectedUpdatedAt` or version token | Optimistic concurrency check where applicable |
| Secrets / tokens | **Never accepted or returned** |

Existing Pack16 read-only routes remain **GET-only** and unchanged:

- `GET /api/viona/requests`
- `GET /api/viona/requests/:id`

---

## 7. State machine planning

Reference domain machine: `src/domain/requests/vionaRequestStatusMachine.ts`.

### Future statuses (domain-aligned)

`draft`, `submitted`, `triage`, `needsHumanConfirmation`, `sentToPartner`, `partnerResponded`, `completed`, `cancelled`, `failed`

### Allowed transitions (summary)

| From | Allowed to |
| --- | --- |
| `draft` | `submitted`, `cancelled` |
| `submitted` | `triage`, `needsHumanConfirmation`, `cancelled`, `failed` |
| `triage` | `needsHumanConfirmation`, `sentToPartner`, `completed`, `cancelled`, `failed` |
| `needsHumanConfirmation` | `triage`, `sentToPartner`, `cancelled`, `failed` |
| `sentToPartner` | `partnerResponded`, `triage`, `cancelled`, `failed` |
| `partnerResponded` | `needsHumanConfirmation`, `completed`, `sentToPartner`, `cancelled`, `failed` |
| `completed` | *(terminal)* |
| `cancelled` | *(terminal)* |
| `failed` | `draft` (reopen path — ops only in future pack) |

### Blocked / invalid transitions

- Any transition not listed in the domain `transitionMap` → **reject with safe 409**
- Skip-ahead transitions (e.g. `draft` → `completed`) → **reject**
- Transitions implying payment/booking/SOS truth → **reject** regardless of status label

### Idempotency and duplicate submit

| Mechanism | Rule |
| --- | --- |
| `idempotencyKey` | Client-supplied key stored per `(requestId, actionType, idempotencyKey)` |
| Duplicate POST with same key | Return prior success payload — no double write |
| Conflicting duplicate key | Reject with safe error — no silent overwrite |

### Optimistic concurrency

| Strategy | Rule |
| --- | --- |
| `expectedUpdatedAt` | Client sends last known `VionaRequest.updatedAt`; server rejects if mismatch (409) |
| Status event append | Every successful status change writes `VionaRequestStatusEvent` + `VionaRequestAuditEvent` in one transaction |

---

## 8. Audit trail planning

Every future write/action **must** create at least one `VionaRequestAuditEvent` (and status change events where applicable).

| Audit field | Content rule |
| --- | --- |
| `requestId` | Target request UUID |
| `eventType` | Stable action enum (e.g. `status.transition`, `action.note`, `action.assign`) |
| `actorUserId` | Authenticated server user id |
| `actorRoleLabel` | Resolved role label (not secret) |
| `message` | Human-readable summary — no secrets |
| `payloadJson` | Previous/new values where safe — no tokens, credentials, env, or raw URLs |
| `createdAt` | Server timestamp |
| Safety flags | e.g. `readOnly: false`, `noPaymentCaptured: true`, `noBookingConfirmed: true` |

Audit events are **append-only** in first mutation packs — no delete or rewrite of audit history.

---

## 9. UI planning (NOT IMPLEMENTED)

**Label:** `FUTURE UI ONLY — PACK17 REMAINS READ-ONLY`

| Principle | Rule |
| --- | --- |
| Pack17 current behavior | **Unchanged** — live read-only inbox only |
| Future action UI location | Separate screen/modal behind feature flag — not mixed into read-only list without flag |
| Explicit confirmation | Required before status/cancel/confirm actions |
| Disabled states | Controls disabled when permission denied or request terminal |
| Permission-aware controls | Hide or disable based on server capability response — not client guess |
| Safe error display | Generic messages — no stack traces or DB errors |
| Fake success claims | **Forbidden** — use domain safety copy (`vionaRequestSafetyCopy`) |

Future UI must **not** imply payment settlement truth, booking fulfillment truth, emergency-service escalation, or production-ready automation.

---

## 10. Safety / rollback planning

| Topic | Plan |
| --- | --- |
| Stop-on-error | Any validation, permission, concurrency, or DB failure → abort transaction; return safe error; no partial mutation |
| Side-effect boundary | First mutation packs: **no** payment/booking/SOS/wallet/live AI side effects |
| Rollback / disable flag | Feature flag `vionaRequestWriteActionsEnabled` default **false** until verified; kill-switch to disable POST routes without schema change |
| Rate limiting | Apply path-aware rate limits on `/api/viona/requests/:id/actions/*` (mirror local mutation limiter pattern) |
| Abuse consideration | Idempotency + concurrency + per-actor rate limits; audit all attempts including failures |
| Logging | Structured logs without secrets; no raw JWT, env, or connection strings |
| Monitoring | Alert on mutation error rate spikes; dashboard for audit event volume by action type |

---

## 11. Implementation sequence recommendation

| Pack | Recommended lane | Notes |
| --- | --- | --- |
| **Pack18** (this pack) | Write/action planning | Docs-only — complete after merge/verify |
| **Pack19** | Action API implementation prep or narrow first-mutation authorization packet | Define exact first endpoint scope + test plan |
| **Pack20** | First safe mutation endpoint | Prefer **status transition** and/or **operator note** only |
| **Pack21** | UI action planning or implementation | Only after Pack20 API verified on master |
| **Later** | Notifications, assign/confirm/cancel breadth, payments/booking/SOS integrations | **Separate authorization each** |

---

## 12. Status flags

| Flag | Value |
| --- | --- |
| `pack16ReadOnlyApiImplemented` | `true` |
| `pack16ReadOnlyApiVerified` | `true` |
| `pack17LiveReadOnlyInboxImplemented` | `true` |
| `pack17LiveReadOnlyInboxVerified` | `true` |
| `pack18WriteActionPlanningAuthorized` | `true` |
| `pack18WriteActionPlanningPrepared` | `true` |
| `pack18MutationImplemented` | `false` |
| `pack18ActionEndpointsCreated` | `false` |
| `pack18WriteActionUiCreated` | `false` |
| `allWriteActionsRemainBlocked` | `true` |

---

## 13. Explicit non-authorization (this planning pack)

| Item | State |
| --- | --- |
| This pack implements mutations | **NO** |
| This pack creates action endpoints | **NO** |
| This pack creates write/action UI | **NO** |
| This pack modifies Pack17 runtime behavior | **NO** |
| This pack modifies Pack16 API runtime | **NO** |
| This pack modifies payments/booking/SOS/wallet/live AI | **NO** |
| This pack modifies Prisma schema or migrations | **NO** |
| This pack runs DB/Prisma/Supabase/SQL commands | **NO** |
| This pack inspects or prints secrets | **NO** |
| This pack authorizes global full automation claims | **NO** |
| Separate implementation authorization required | **YES** — for Pack19+ mutation work |

---

## 14. Still blocked

- Pack18 mutation implementation
- Pack18 action endpoint creation
- Pack18 write/action UI
- Payment capture / booking confirmation / SOS dispatch / wallet mutation / live AI protected actions via request actions
- Pack16 read-only route changes that add writes
- Pack17 inbox action buttons

---

## 15. Recommendation

| Recommendation | Status |
| --- | --- |
| **A) Safe to open PR** for docs-only Pack18 planning | **YES** — if gate-clean |
| Safe to implement mutations yet | **NO** |
| Safe to add write/action UI yet | **NO** |
| Next after merge/verify | **Pack19** — separate action API implementation prep or narrow first-mutation authorization |

---

**Evidence:** `docs/design/evidence/cursor-pack18-request-write-action-planning/README.md`
