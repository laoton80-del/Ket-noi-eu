# VIONA Request Engine — Pack19 First Write/Action Implementation Planning

**Document type:** Narrow first write/action implementation planning/prep (docs-only — no implementation).
**Baseline:** `origin/master @ 2b850c6` — `docs(requests): prepare Pack18 request write/action planning (#137)`.
**Related:** `docs/product/VIONA_REQUEST_PACK18_REQUEST_WRITE_ACTION_PLANNING.md`, `docs/product/VIONA_REQUEST_PACK17_LIVE_READ_ONLY_REQUEST_INBOX_IMPLEMENTATION_RESULT.md`, `docs/product/VIONA_REQUEST_PACK16_READ_ONLY_REQUEST_API_IMPLEMENTATION_RESULT.md`, `src/domain/requests/vionaRequestStatusMachine.ts`

---

## 1. Baseline

| Field | Value |
| --- | --- |
| Remote | `origin/master` |
| Commit | `2b850c6` |
| Message | `docs(requests): prepare Pack18 request write/action planning (#137)` |
| Pack15C DB apply | **Green** (PR #131) |
| Pack15D verification | **Green** (PR #133) |
| Pack16 read-only API | **Green** on master (PR #135 @ `6ddbc59`) |
| Pack17 live read-only inbox | **Green** on master (PR #136 @ `2ed1d29`) |
| Pack18 write/action planning | **Green** on master (PR #137 @ `2b850c6`) |
| Pack19 planning authorized | **YES** — Nong Si Buong (planning/prep only) |
| All write/actions | **Blocked** until separate Pack20 implementation authorization |

---

## 2. Operator authorization

| Item | Value |
| --- | --- |
| Operator authorization present | **YES** |
| Operator | **Nong Si Buong** |
| Authorization scope | Pack19 first request write/action **implementation planning/prep** on current master only |
| Mutations authorized in this pack | **NO** |
| Action endpoints authorized in this pack | **NO** |
| Write/action UI authorized in this pack | **NO** |
| Payments / booking / SOS / wallet / live AI changes | **NO** |
| Prisma schema / migration changes | **NO** |
| DB / Prisma / Supabase / SQL commands | **NO** |

**Operator quote (scope lock):**

> I, Nong Si Buong, authorize Pack19 first request write/action implementation planning on current master only. Prepare the narrow first implementation pack after verified Pack18 planning, likely limited to status/note actions. Do not implement mutations yet, do not create action endpoints yet, do not create write/action UI, do not modify payments/booking/SOS/wallet/live AI, do not print secrets, do not modify Prisma schema or migrations, and keep all write/actions blocked until a separate implementation authorization pack is reviewed, merged, and verified.

---

## 3. Pack19 objective

Pack19 prepares the **narrow first future implementation pack** after verified Pack18 planning — without implementing mutations, endpoints, or UI.

| Layer | State on master |
| --- | --- |
| Pack15 schema + DB apply | Applied and verified |
| Pack16 read-only API | Implemented and verified |
| Pack17 live read-only inbox | Implemented and verified |
| Pack18 write/action planning | Verified (docs-only) |
| Pack19 first write/action implementation | **Planning/prep only** — not implemented |

Pack19 narrows Pack18’s broad future action catalog to the **safest first write/action candidates** and defines what a later **Pack20 implementation authorization** must explicitly allow.

---

## 4. Recommended first implementation scope (future only)

**Label:** `FUTURE IMPLEMENTATION ONLY — NOT BUILT IN PACK19`

| Priority | Action | Future purpose | First Pack20 candidate |
| --- | --- | --- | --- |
| **1 (preferred)** | Operator / requester **note** | Append audit-visible note **without** status change | **YES** — safest first mutation |
| **2 (optional, narrow)** | **Status transition** | Allowlisted workflow move only | **Maybe** — only if scope is narrower than assign/confirm/cancel |
| **Deferred** | Assign / unassign | Route to operator/participant | **NO** in first implementation |
| **Deferred** | Confirm | Human confirmation checkpoint | **NO** in first implementation |
| **Deferred** | Cancel | Authorized cancel workflow | **NO** in first implementation |

**First implementation preference:**

1. **`note`** — preferred first endpoint; no status mutation; audit-only side effect.
2. **`status`** — optional second endpoint only if allowlisted transitions are strictly bounded and proven safer than deferred actions.
3. **assign / confirm / cancel** — explicitly deferred to later packs unless separately authorized.

**Explicit exclusions for first implementation (Pack20 target):**

- No payment settlement truth, wallet mutation, or ledger writes
- No booking fulfillment truth or tourism/local fulfillment side effects
- No SOS dispatch or emergency-service escalation side effects
- No live AI autonomous protected actions
- No notification fan-out in first mutation pack (plan hooks only)

---

## 5. Future endpoint candidates (NOT IMPLEMENTED)

**Label:** `FUTURE IMPLEMENTATION ONLY — NOT IMPLEMENTED IN PACK19`

All routes below are **NOT IMPLEMENTED**. Subject to Pack20 implementation review and separate operator authorization.

| Method | Route | Future purpose | Status in Pack19 |
| --- | --- | --- | --- |
| `POST` | `/api/viona/requests/:id/actions/note` | Append operator/requester note (audit event) | **NOT IMPLEMENTED** — **preferred first candidate** |
| `POST` | `/api/viona/requests/:id/actions/status` | Narrow allowlisted status transition | **NOT IMPLEMENTED** — optional later candidate in Pack20 |

**Deferred routes (not in first implementation scope):**

| Method | Route | Status |
| --- | --- | --- |
| `POST` | `/api/viona/requests/:id/actions/assign` | **NOT IMPLEMENTED** — deferred |
| `POST` | `/api/viona/requests/:id/actions/confirm` | **NOT IMPLEMENTED** — deferred |
| `POST` | `/api/viona/requests/:id/actions/cancel` | **NOT IMPLEMENTED** — deferred |

Existing Pack16 read-only routes remain **GET-only** and unchanged:

- `GET /api/viona/requests`
- `GET /api/viona/requests/:id`

---

## 6. Permission model for first action

Future write/action authorization must use **server-side** enforcement aligned with `vionaRequestRoleTenantAccessMatrix` — not client-only role checks.

| Check | Rule |
| --- | --- |
| Authentication | Valid JWT via existing `authMiddleware` — **required** |
| Actor resolution | Server resolves `authUserId` from token; never trust client-supplied user id |
| Requester access | `requesterUserId === authUserId` may append note on own request where matrix allows |
| Owner / operator access | Future resolved operator role may append note / narrow status where matrix allows |
| Participant access | `userRef === authUserId` — read + limited note only if explicitly granted in Pack20 matrix extension |
| Cross-user access | **Denied** — no read/write across unrelated users |
| Cross-tenant access | **Denied by default** — `tenantId` + business ownership checks |
| Privilege escalation | **Forbidden** — no client-trusted role claims without server validation |
| Admin / support | Server ADMIN gate + universe filter + mandatory audit only |

| Principle | Rule |
| --- | --- |
| Client-only authorization | **Insufficient** |
| Silent privilege escalation | **Forbidden** |
| Cross-user leakage | **Forbidden** |
| Cross-tenant leakage | **Forbidden** |

Pack16 requester-owned read scope and Pack17 read-only UI remain unchanged until Pack20 is separately authorized and verified.

---

## 7. Request body plan

### 7.1 Note action (preferred first candidate)

**Label:** `FUTURE REQUEST BODY — NOT IMPLEMENTED IN PACK19`

| Field | Required | Rule |
| --- | --- | --- |
| `noteText` | **YES** | Non-empty bounded string; sanitized; no secrets |
| `idempotencyKey` | **YES** | Client-supplied; dedupe per `(requestId, actionType, idempotencyKey)` |
| `expectedUpdatedAt` | Recommended | Optimistic concurrency — reject mismatch with safe 409 |
| `clientCorrelationId` | Optional | Opaque client trace id — logged/audited without secrets |

**Excluded from request body (always):**

- Secrets, tokens, raw credentials
- Payment, booking, SOS, wallet, or live AI side-effect payloads
- Env values, connection strings, or raw third-party URLs

### 7.2 Status action (optional narrow candidate)

| Field | Required | Rule |
| --- | --- | --- |
| `targetStatus` | **YES** | Must be allowlisted enum from domain machine |
| `reason` | Recommended | Bounded human-readable reason — no secrets |
| `idempotencyKey` | **YES** | Same dedupe rules as note |
| `expectedUpdatedAt` | **YES** | Required for status mutation — concurrency guard |

---

## 8. State machine boundary

Reference domain machine: `src/domain/requests/vionaRequestStatusMachine.ts`.

### Note action boundary

| Rule | Detail |
| --- | --- |
| Status impact | **None** — note action must not change `VionaRequest.status` |
| Terminal requests | Notes may still append where permission allows — no fake reopen |
| Duplicate submit | Same `idempotencyKey` → idempotent success payload; no double audit write |

### Status action boundary (if included in Pack20)

| Rule | Detail |
| --- | --- |
| Allowlist only | Transitions must match domain `transitionMap` exactly |
| Invalid transition | **Fail safely** — safe 409; no partial write |
| Skip-ahead | **Reject** (e.g. `draft` → `completed`) |
| Side-effect implication | Transitions implying payment/booking/SOS truth → **reject** regardless of label |
| Duplicate submit | Idempotent replay or safe rejection — never silent overwrite |

### Idempotency and optimistic concurrency

| Mechanism | Rule |
| --- | --- |
| `idempotencyKey` | Stored per `(requestId, actionType, idempotencyKey)` |
| Duplicate POST | Return prior success payload — no double write |
| Conflicting duplicate | Reject with safe error |
| `expectedUpdatedAt` | Server rejects if request row changed since client read (409) |

---

## 9. Audit trail plan

Every future write/action **must** create at least one `VionaRequestAuditEvent`. Status changes also require `VionaRequestStatusEvent` where applicable.

| Audit field | Content rule |
| --- | --- |
| Request id | Target request UUID |
| Actor reference | `actorUserId` from server auth — not client claim |
| Action type | Stable enum (e.g. `action.note`, `status.transition`) |
| Safe previous value | Prior status or note count snapshot where applicable — no secrets |
| Safe new value | New note summary or target status — no secrets |
| Timestamp | Server `createdAt` |
| Correlation / idempotency | `idempotencyKey` + optional `clientCorrelationId` |
| Safety flags | e.g. `noPaymentSettlement: true`, `noBookingFulfillment: true`, `noEmergencyEscalation: true` |

Audit events are **append-only** — no delete or rewrite in first mutation packs.

Failed permission or validation attempts should be auditable where consistent with existing patterns — without logging secrets.

---

## 10. Read model impact

| Topic | Plan |
| --- | --- |
| Pack16 list/detail | Future audit events and notes must be visible through existing read serializers after Pack20 — no Pack19 runtime change |
| Pack17 inbox | **Remains read-only** after Pack19 planning and until separate UI authorization |
| Action UI | **Not added in Pack19** — no buttons, forms, or POST calls in client |
| Fake success | **Forbidden** — use domain safety copy (`vionaRequestSafetyCopy`) in future UI |

Users continue to consume request state via existing GET endpoints only until Pack20+ is verified.

---

## 11. Safety / rollback / monitoring

| Topic | Plan |
| --- | --- |
| Stop-on-error | Any validation, permission, concurrency, or DB failure → abort transaction; return safe error; **no partial mutation** |
| Feature flag / disable switch | `vionaRequestWriteActionsEnabled` default **false** until Pack20 verified; kill-switch disables POST routes without schema change |
| Rate limiting | Path-aware limits on `/api/viona/requests/:id/actions/*` (mirror local mutation limiter pattern) |
| Abuse protection | Idempotency + concurrency + per-actor rate limits |
| Safe error messages | Generic client messages — no stack traces, SQL, or internal ids beyond request id |
| Safe logging | Structured logs without JWT, env, credentials, or connection strings |
| Monitoring | Alert on mutation error rate spikes; track audit event volume by action type |
| Side-effect boundary | **No** automatic payment/booking/SOS/wallet/live AI side effects |
| Fake production claims | **Forbidden** — honest readiness labels only |

---

## 12. Future verification plan (Pack20 post-merge)

When Pack20 implementation is merged, verification must confirm:

| Check | Requirement |
| --- | --- |
| Docs-only boundary respected in Pack19 | Pack19 changed only planning docs |
| Allowed endpoints only | At most `note` (+ optional narrow `status`) — no assign/confirm/cancel unless separately authorized |
| Permission enforcement | Cross-user/cross-tenant denied; server-side auth only |
| Idempotency | Duplicate key returns prior result — no double write |
| Concurrency | Stale `expectedUpdatedAt` rejected safely |
| Audit | Every successful action creates audit event — no secrets in payload |
| Read model | Pack16 GET reflects new audit data; Pack17 still read-only unless UI pack authorized |
| Pack16/Pack17 runtime | Unchanged except explicitly authorized Pack20 service/route files |
| Forbidden domains | No payment/booking/SOS/wallet/live AI changes |
| Schema | No migration unless separately authorized |
| Gates | `viona-forbidden-claims-check` (strict), `tsc`, smoke, conflict grep |

---

## 13. Future Pack20 implementation authorization requirements

A later **Pack20 implementation authorization** from Nong Si Buong must **explicitly** state:

| Requirement | Must be explicit in authorization |
| --- | --- |
| Exact action endpoint(s) allowed | e.g. `POST .../actions/note` only, or note + narrow status |
| DB writes allowed | **YES/NO** — if YES, scope to existing Prisma models only |
| Prisma non-migration client writes | **YES/NO** — append audit/status rows only; no schema change |
| Schema / migration changes | **NO** unless separately authorized pack |
| UI write controls | **NO** unless separately authorized UI pack |
| Payments / booking / SOS / wallet / live AI | **NO** |
| Assign / confirm / cancel endpoints | **NO** unless explicitly listed and deferred rationale documented |
| Feature flag default | Must remain disabled until post-merge verification passes |
| Verification pack | Separate post-merge verify on master required before UI or breadth expansion |

Without this explicit Pack20 authorization, **all write/actions remain blocked**.

---

## 14. Status flags

| Flag | Value |
| --- | --- |
| `pack16ReadOnlyApiVerified` | `true` |
| `pack17LiveReadOnlyInboxVerified` | `true` |
| `pack18WriteActionPlanningVerified` | `true` |
| `pack19FirstWriteActionImplementationPlanningAuthorized` | `true` |
| `pack19FirstWriteActionImplementationPlanningPrepared` | `true` |
| `pack19MutationImplemented` | `false` |
| `pack19ActionEndpointsCreated` | `false` |
| `pack19WriteActionUiCreated` | `false` |
| `allWriteActionsRemainBlocked` | `true` |

---

## 15. Explicit non-authorization (this planning pack)

| Item | State |
| --- | --- |
| This pack implements mutations | **NO** |
| This pack creates action endpoints | **NO** |
| This pack creates write/action UI | **NO** |
| This pack modifies Pack16 runtime | **NO** |
| This pack modifies Pack17 runtime | **NO** |
| This pack modifies payments/booking/SOS/wallet/live AI | **NO** |
| This pack modifies Prisma schema | **NO** |
| This pack creates or edits migrations | **NO** |
| This pack runs DB/Prisma/Supabase/SQL commands | **NO** |
| This pack inspects or prints secrets | **NO** |
| This pack authorizes global full automation claims | **NO** |
| Separate Pack20 implementation authorization required | **YES** |

---

## 16. Still blocked

- Pack19 mutation implementation
- Pack19 action endpoint creation
- Pack19 write/action UI
- Assign / confirm / cancel in first implementation (deferred)
- Payment settlement / booking fulfillment / SOS escalation / wallet mutation / live AI protected actions via request actions
- Pack16 read-only route changes that add writes
- Pack17 inbox action buttons
- Prisma schema or migration edits

---

## 17. Recommendation

| Recommendation | Status |
| --- | --- |
| **A) Safe to open PR** for docs-only Pack19 planning/prep | **YES** — if gate-clean |
| Safe to implement mutations yet | **NO** |
| Safe to add write/action UI yet | **NO** |
| Next after merge/verify | **Pack20** — separate narrow first-mutation implementation authorization |

---

**Evidence:** `docs/design/evidence/cursor-pack19-first-write-action-implementation-planning/README.md`
