# VIONA Request Engine — Pack16 Read-Only Request API Implementation Planning

**Document type:** Read-only request API implementation planning (docs-only — no implementation).
**Baseline:** `origin/master @ a3f3461` — `docs(requests): record Pack15D post-DB-apply verification pass (#133)`.
**Related:** `docs/product/VIONA_REQUEST_PACK15D_POST_DB_APPLY_VERIFICATION_RESULT.md`, `docs/product/VIONA_REQUEST_PACK16_READ_ONLY_PERSISTENCE_API_PLANNING_PACKET.md`, `docs/product/VIONA_REQUEST_INBOX_READONLY_FOUNDATION.md`

---

## 1. Baseline

| Field | Value |
| --- | --- |
| Remote | `origin/master` |
| Commit | `a3f3461` |
| Message | `docs(requests): record Pack15D post-DB-apply verification pass (#133)` |
| Pack15C DB apply success | **Green** on master (PR #131 @ `f1a5d37`) |
| Pack15D post-DB-apply verification | **Green** on master (PR #133 @ `a3f3461`) |
| Target DB (applied schema) | `viona-staging-eu` / `euqbfanilcssjiwwtcby` (staging only) |
| Pack16 planning authorized | **YES** — Nong Si Buong (planning only) |
| Pack17 | **Blocked** until Pack16 is reviewed, merged, and verified |

---

## 2. Operator authorization

| Item | Value |
| --- | --- |
| Operator authorization present | **YES** |
| Operator | **Nong Si Buong** |
| Authorization scope | Pack16 read-only request API **implementation planning** on current master only |
| Mutations authorized | **NO** |
| Action endpoints authorized | **NO** |
| Payments / booking / SOS / wallet / live AI changes | **NO** |
| Pack17 unlock | **NO** |

---

## 3. Pack16 objective

Pack16 is the **first read-only API layer** for Viona request data — a narrow persistence read surface over the Pack15 schema already applied and verified on staging.

| Principle | Rule |
| --- | --- |
| Purpose | Expose existing Viona request records for authorized read-only consumers |
| Writes | **Forbidden** — no create, update, delete |
| Status | **Forbidden** — no status transition endpoints |
| Assignment | **Forbidden** — no assignment or routing actions |
| Actions | **Forbidden** — no confirm, cancel, accept, reject, or other action endpoints |
| Scope | Read-only list and detail only |

### Read-only data in scope (future implementation)

Future Pack16 may include safe read-only projections of:

| Entity | Read-only inclusion |
| --- | --- |
| `VionaRequest` | Core request record |
| `VionaRequestParticipant` | Participants linked to a request |
| `VionaRequestSourceLink` | Source links and link status |
| `VionaRequestStatusEvent` | Historical status events |
| `VionaRequestAuditEvent` | Audit trail entries |
| `VionaRequestAttachmentReference` | Attachment references (metadata only — not raw storage secrets) |

Dedicated Viona Request Store remains source-of-truth direction. Direct `LocalServiceRequest` reuse as Viona source-of-truth remains **disallowed**.

---

## 4. Proposed future API shape

**Label:** `FUTURE IMPLEMENTATION ONLY — NOT BUILT IN THIS PLANNING PACK`

Suggested routes (subject to repo controller/service architecture — e.g. patterns used by `LocalRequestController` / `localUserRequestApi`):

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/viona/requests` | List requests visible to authenticated caller |
| `GET` | `/api/viona/requests/:id` | Request detail with related read-only child data |

### Optional future filters (list route)

| Filter | Notes |
| --- | --- |
| `status` | Filter by request status |
| `universe` | Filter by Viona universe / surface |
| `requester` / `participant` | Scoped to authorized identity only |
| `createdFrom` / `createdTo` | Date range |
| `cursor` / `limit` | Pagination — cursor preferred over unbounded offset |

No `POST`, `PUT`, `PATCH`, or `DELETE` routes in Pack16.

---

## 5. Access and safety

Future Pack16 implementation **must** require:

| Requirement | Rule |
| --- | --- |
| Authentication | Use authenticated user context if available in current backend architecture |
| Authorization boundary | Read-only only — caller may read only records they are permitted to see |
| Cross-user leakage | **Forbidden** — no exposing another user's private request data |
| Tenant leakage | **Forbidden** — enforce tenant / business scoping where applicable |
| Admin escalation | **Forbidden** — no OPERATOR/admin bypass unless a separately authorized admin read-only pack exists |
| Secret logging | **Forbidden** — no tokens, credentials, or env values in logs |
| Client errors | **Forbidden** — no raw database errors, connection strings, or stack traces returned to client |
| Fake production | **Forbidden** — no implied-live dispatch, payment, booking, SOS, or wallet outcomes |

---

## 6. Data boundary

Read-only API responses **must avoid**:

| Excluded from responses |
| --- |
| Secret values |
| Internal credentials |
| Raw tokens (JWT, refresh, API keys) |
| Private env values |
| Mutation or action affordances (e.g. `canConfirm`, `nextActionUrl`) |
| Fake production claims |

Responses should use stable DTO shapes with explicit Lite / Pilot / Beta / internal-readiness wording where the surface is not production-ready.

---

## 7. Implementation constraints (later Pack16 implementation pack)

A **separate, separately authorized** Pack16 implementation pack must:

| Constraint | Rule |
| --- | --- |
| File scope | Touch only narrowly allowed API/server/read-only service files |
| Forbidden domains | Do **not** touch payments, booking, SOS, wallet, or live AI |
| Routes | Read-only `GET` only — no mutation routes |
| Actions | No action endpoints |
| Schema | Do **not** modify `prisma/schema.prisma` or migrations |
| DB | Do **not** run DB apply or `npx prisma migrate deploy` |
| Verification | Include tests or static checks where available |
| Pack17 | Keep blocked until Pack16 is merged and verified |

### Applied schema reference (verified in Pack15D)

Migration `20260615120000_add_viona_request_models` is applied and schema-verified on staging. Tables:

- `VionaRequest`
- `VionaRequestParticipant`
- `VionaRequestSourceLink`
- `VionaRequestStatusEvent`
- `VionaRequestAuditEvent`
- `VionaRequestAttachmentReference`

Enum: `VionaRequestSourceLinkStatus` (`PENDING`, `ACTIVE`, `BROKEN`, `SUPERSEDED`).

---

## 8. Status flags

| Flag | Value |
| --- | --- |
| `pack15DbApplyPerformed` | `true` |
| `dbApplied` | `true` |
| `pack15DbApplySucceeded` | `true` |
| `pack15DVerificationExecuted` | `true` |
| `pack15DSchemaVerificationPassed` | `true` |
| `pack16ReadOnlyApiPlanningAuthorized` | `true` |
| `pack16ReadOnlyApiPlanningPrepared` | `true` |
| `pack16ReadOnlyApiImplemented` | `false` |
| `pack16MutationEndpointsImplemented` | `false` |
| `pack16ActionEndpointsImplemented` | `false` |
| `pack17LiveReadOnlyInboxImplemented` | `false` |
| `pack17BlockedUntilPack16Verified` | `true` |

---

## 9. Explicit non-authorization (this planning pack)

| Item | State |
| --- | --- |
| This pack implements Pack16 API | **NO** |
| This pack creates routes | **NO** |
| This pack creates controllers/services | **NO** |
| This pack touches runtime/API code | **NO** |
| This pack unlocks Pack17 | **NO** |
| This pack authorizes mutations/actions | **NO** |
| This pack modifies payments/booking/SOS/wallet/live AI | **NO** |
| This pack runs DB/Prisma/Supabase/SQL commands | **NO** |
| Separate Pack16 implementation pack required | **YES** — after this planning merges and verifies |

---

## 10. Still blocked

- Pack16 read-only API implementation
- Pack16 mutation or action endpoints
- Pack17 live read-only inbox / UI wiring to live API
- Request mutation / status transition / assignment
- Payment capture, booking confirmation, SOS dispatch, wallet mutation, live AI protected actions
- DB apply / `migrate deploy` in planning or implementation without separate authorization
- OPERATOR Prisma/Auth escalation

---

## 11. Recommendation

| Recommendation | Status |
| --- | --- |
| **A) Safe to open PR** for docs-only Pack16 planning | **YES** — if gate-clean |
| Safe to implement Pack16 API yet | **NO** |
| Safe to start Pack17 yet | **NO** |
| Next after merge/verify | Separately authorized **Pack16 read-only API implementation pack** |

---

**Evidence:** `docs/design/evidence/cursor-pack16-read-only-request-api-implementation-planning/README.md`
