# VIONA Request Engine — Pack25 Fresh Scoped Status QA Row Authorization Packet

**Document type:** Fresh scoped staging DB/data authorization packet (docs-only — no row creation, no DB execution).
**Packet ID:** `CURSOR_PACK25_FRESH_SCOPED_STATUS_QA_ROW_AUTHORIZATION_PACKET_DOCS_ONLY`
**Baseline:** `origin/master @ 78dd8f4` — `docs(pack25): record status live qa blocked precondition evidence (#161)`.
**Related:** `docs/product/VIONA_REQUEST_PACK25_STATUS_ACTION_LIVE_QA_BLOCKED_PRECONDITION_EVIDENCE.md`, `docs/product/VIONA_REQUEST_PACK25_STATUS_ACTION_STAGING_REDEPLOY_EXECUTION_EVIDENCE.md`, `docs/product/VIONA_REQUEST_PACK25_SCOPED_PILOT_REQUEST_ROW_AUTHORIZATION_PACKET.md`, `docs/product/VIONA_REQUEST_PACK25_SCOPED_PILOT_REQUEST_ROW_EXECUTION_EVIDENCE.md`, `docs/product/VIONA_REQUEST_PACK25_STATUS_ACTION_IMPLEMENTATION_AUTHORIZATION_PACKET.md`

---

## 1. Packet summary

| Field | Value |
| --- | --- |
| Operating Protocol read | **YES** (required before any future execution) |
| Docs-only | **YES** |
| Authorization packet prepared | **YES** |
| Verified master | **`78dd8f4`** |
| DB/data execution performed | **NO** |
| Request row created/seeded | **NO** |
| Existing row reset/rollback | **NO** |
| Deploy/restart performed | **NO** |
| Live QA run | **NO** |
| Status endpoint called with auth | **NO** |
| Notes submitted | **NO** |
| Secrets printed/inspected | **NO** |
| Pack26 opened | **NO** |
| All non-status write/actions remain blocked | **YES** |

**This packet prepares scope only.** It does **not** authorize DB/data execution unless the operator issues a **separate explicit execution authorization** (see §10).

---

## 2. Current gate context (green on master)

| Gate | Status |
| --- | --- |
| Pack25 status action API | **GREEN** — PR #159 @ `3d2d827` |
| Staging redeploy execution evidence | **GREEN** — PR #160 @ `71ed846` |
| Live QA blocked precondition evidence | **GREEN** — PR #161 @ `78dd8f4` |
| Route on staging | `POST /api/viona/requests/:id/actions/status` — owner-only `submitted` → `triage` |
| Existing scoped pilot row | **Present** — status **`triage`** (not resettable for packet QA) |
| Full packet live QA (`submitted` → `triage` + idempotency replay) | **BLOCKED** — precondition `submitted` not met |

### 2.1 Blocker classification

| Field | Value |
| --- | --- |
| Existing row status | **`triage`** |
| Required QA precondition | **`submitted`** |
| Reset/rollback of existing row | **FORBIDDEN** |
| Remediation path | **Fresh scoped status-QA row** in `submitted` state |

---

## 3. Purpose of future controlled staging data operation

| # | Objective |
| --- | --- |
| 1 | Create **exactly one** fresh scoped **`VionaRequest`** row on **staging only** |
| 2 | Row initial status must be **`submitted`** |
| 3 | Row must be visible to **pilot User A (owner)** via `GET /api/viona/requests` and detail |
| 4 | Enable full **Pack25 status action live QA**: first owner POST **201** + idempotent replay **200** |
| 5 | Verify status event + audit event; note count unchanged; no assign/confirm/cancel |

**Not in scope:** production, schema changes, migrations, broad backfill, user creation, Pack26, note submit, status transition at row creation, or mutation of the existing `triage` row.

---

## 4. Future operation candidate (plan only — not executed)

| Field | Value |
| --- | --- |
| Operation | Insert **exactly one** fresh scoped `VionaRequest` for Pack25 status-QA |
| Environment | **Staging only** |
| API app (name only) | **`viona-api-staging-eu`** |
| Required initial status | **`submitted`** |
| Suggested title | `Pack25 status QA scoped request — submitted-to-triage live QA` |
| Suggested tenant/universe pattern | Consistent with prior Pack25 pilot row (e.g. `staging-pilot-pack25`, `local`, `viona-requests-live-inbox`) — **no schema extension** |
| Scope rule | `requesterUserId` + `ownerUserId` for pilot User A (same pattern as PR #153 execution evidence) |
| Notes on create | **NO** — row created without `action.note` |
| Status transition on create | **NO** — must remain `submitted` until separate live QA authorization |

---

## 5. Pilot owner identity and scope (labels only — no secrets)

| Item | Reference |
| --- | --- |
| Pilot persona | **User A** (documented staging pilot roster) |
| Phone label (public runbook) | `+420910000001` — PIN operator-provisioned; **not** printed in this packet |
| Auth scope rule (repo) | `buildAuthorizedVionaRequestWhere` — caller sees rows where they are **requester**, **owner**, or **participant** |
| Required scope for QA row | **Owner** (and requester) = pilot User A staging user id |

**Stop** if pilot User A staging user id cannot be resolved without printing secrets or DATABASE_URL.

---

## 6. Existing row protection

| Rule | Required |
| --- | --- |
| Existing scoped pilot row (`triage`) | **Must not** be reset, rolled back, deleted, or modified |
| Purpose | Preserve Pack24 note + prior status transition audit history |
| QA row discrimination | Unique title/purpose — `Pack25 status QA scoped request — submitted-to-triage live QA` |

---

## 7. Row quantity and behavior constraints

| Rule | Required |
| --- | --- |
| Rows to create | **Exactly one** fresh status-QA `VionaRequest` |
| Rows to mutate | **Zero** (existing `triage` row untouched) |
| Status at creation | **`submitted` only** |
| Assign / confirm / cancel | **NO** |
| Payment / booking / SOS / wallet / live AI | **NO** |
| Note submit | **NO** |
| Status endpoint call at creation | **NO** |
| Pack26 | **NO** |

---

## 8. Stop conditions (future execution)

Stop immediately if any of the following occur:

| # | Condition |
| --- | --- |
| 1 | A row already exists with the same QA title/purpose |
| 2 | Owner/requester identity is ambiguous |
| 3 | Target environment is not staging |
| 4 | DB/schema assumptions are unclear |
| 5 | Any secret or full env value would need to be printed to proceed |
| 6 | More than one row would be created |
| 7 | Existing `triage` row would be modified |

---

## 9. Required future post-create verification (after separate execution authorization)

Execute **after** DB/data operation is separately authorized and completed. **No secrets recorded in evidence.**

| Step | Check | Pass criterion |
| --- | --- | --- |
| V1 | Row count for QA title/purpose | **Exactly one** fresh QA row |
| V2 | Row status | **`submitted`** |
| V3 | Owner list `GET /api/viona/requests?limit=50&skip=0` | **200** — QA row visible (may be count **2** with existing `triage` row) |
| V4 | `GET /api/viona/requests/:id` (QA row) | **200**, status **`submitted`** |
| V5 | Note audit events on QA row | **0** |
| V6 | Status events on QA row | **0** |
| V7 | Status transition executed | **NO** |
| V8 | Existing `triage` row unchanged | **YES** |

---

## 10. Explicit boundaries (this packet)

| Boundary | State |
| --- | --- |
| This packet authorizes DB/data execution | **NO** |
| Production touched | **NO** |
| Prisma schema/migrations modified | **NO** |
| Deployment/restart | **NO** |
| `.env*` modified | **NO** |
| Secrets/database URLs printed | **NO** |
| Pack26 opened | **NO** |
| Live QA in this packet | **NO** |

---

## 11. Next gate after row creation evidence

**Separate Pack25 status action live QA authorization** required for exactly one owner-authenticated `submitted` → `triage` transition on the **fresh QA row only**, using idempotency key:

`pack25-status-liveqa-owner-submitted-triage-v1`

Expected closure:

| Step | Expected |
| --- | --- |
| First POST | HTTP **201**, status `triage` |
| Idempotent replay | HTTP **200**, `idempotentReplay: true` |
| Status event | **1** |
| Audit event (`action.status`) | **1** |
| Note count | **0** unchanged |
| Assign/confirm/cancel | **NO** |

Pack26 remains **not opened**.

---

## 12. Operator execution authorization template (future — not active)

> I, [Operator name], authorize **staging-only** DB/data execution to create **exactly one** fresh scoped `VionaRequest` row for Pack25 status action live QA per authorization packet on master @ `78dd8f4`. Row must be in **`submitted`** state with title `Pack25 status QA scoped request — submitted-to-triage live QA`, scoped to pilot User A as owner/requester. Do **not** reset, rollback, delete, or modify the existing `triage` row. Do not create more than one row. Do not submit notes. Do not call status endpoint. Do not deploy. Do not open Pack26. Stop on error. Run post-create verification before separate live QA authorization.
