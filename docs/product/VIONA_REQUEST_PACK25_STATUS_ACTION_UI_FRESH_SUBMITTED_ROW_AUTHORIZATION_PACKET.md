# VIONA Request Engine — Pack25 Status-Action UI Fresh Submitted Row Authorization Packet

**Document type:** Fresh scoped staging DB/data authorization packet (docs-only — no row creation, no DB execution).
**Packet ID:** `CURSOR_PACK25_STATUS_ACTION_UI_FRESH_SUBMITTED_ROW_AUTHORIZATION_PACKET_DOCS_ONLY`
**Baseline:** `origin/master @ 736e260` — `feat(pack25): add controlled status action ui on request detail (#180)`.
**Related:** `docs/product/VIONA_REQUEST_PACK25_CONTROLLED_STATUS_ACTION_UI_IMPLEMENTATION_AUTHORIZATION_PACKET.md`, `docs/product/VIONA_REQUEST_PACK25_FRESH_SCOPED_STATUS_QA_ROW_AUTHORIZATION_PACKET.md`, `docs/product/VIONA_REQUEST_PACK25_FRESH_SCOPED_STATUS_QA_ROW_EXECUTION_EVIDENCE.md`, `src/components/viona/requests/VionaRequestStatusActionWrite.tsx`, `src/components/viona/requests/VionaRequestLiveDetailReadOnly.tsx`

---

## 1. Packet summary

| Field | Value |
| --- | --- |
| Operating Protocol read | **YES** (required before any future execution) |
| Docs-only | **YES** |
| Authorization packet prepared | **YES** |
| Verified master | **`736e260`** |
| Pack25 controlled status-action UI implementation | **CLOSED / GREEN** — PR #180 |
| Row creation/ensure executed in this packet | **NO** |
| DB/data approval granted by this packet | **NO** |
| Visual pass re-run granted by this packet | **NO** |
| Status action click/POST granted | **NO** |
| Deploy/live QA granted | **NO** |
| Pack26 opened | **NO** |

**This packet prepares scope only.** It does **not** authorize DB/data execution, visual pass re-run, status-action POST/click, deploy, live QA, or Pack26 unless the operator issues **separate explicit authorization** for each scope.

---

## 2. Current gate context (green on master)

| Gate | Status |
| --- | --- |
| Pack25 controlled status-action UI implementation | **CLOSED / GREEN** — PR #180 @ `736e260` |
| Post-merge verification | **GREEN** — `736e260` |
| Owner-auth read-only local visual pass | **PARTIAL** — negative `triage` check **PASS**; positive `submitted` affordance **BLOCKED** |
| Route on staging (existing — no new backend) | `POST /api/viona/requests/:id/actions/status` — owner-only `submitted` → `triage` |
| Pilot User A inbox rows on staging | **2** visible — both **`triage`** |
| `submitted` row for UI visual QA | **MISSING** |

### 2.1 Visual pass blocker classification

| Field | Value |
| --- | --- |
| Owner read-only auth | **Succeeded** — secrets redacted |
| Inbox/list GET | **200** — 2 rows |
| Row statuses observed | **`triage`**, **`triage`** |
| Negative check (`triage` hides action) | **PASS** — 390 / 768 / 1440px; no overflow; no forbidden controls |
| Positive check (`submitted` shows action) | **BLOCKED** — no `submitted` row |
| Status action clicked during visual pass | **NO** |
| Mutation endpoints called during visual pass | **NO** |
| Remediation path | **Fresh scoped visual-QA row** in **`submitted`** state |

**Note:** A prior Pack25 status-QA row title may still contain “submitted-to-triage” while its live status is **`triage`** after separate live QA. That row must **not** be reset or rolled back.

---

## 3. Purpose of future controlled staging data operation

| # | Objective |
| --- | --- |
| 1 | Create or ensure **exactly one** fresh scoped **`VionaRequest`** row on **staging only** |
| 2 | Row initial status must be **`submitted`** |
| 3 | Row must be visible to **pilot User A (owner)** via `GET /api/viona/requests` and detail |
| 4 | Enable **GET-only** local visual confirmation that the Pack25 controlled status-action UI affordance appears on **`submitted`** detail |
| 5 | Preserve existing **`triage`** rows unchanged for negative visual checks |

**Not in scope:** production, schema changes, migrations, broad backfill, user creation, Pack26, note submit, status transition at row creation, status-action POST/click, deploy, live QA, or mutation of existing `triage` rows.

---

## 4. Future operation candidate (plan only — not executed)

| Field | Value |
| --- | --- |
| Operation | Insert or idempotent ensure **exactly one** fresh scoped `VionaRequest` for Pack25 status-action **UI visual QA** |
| Environment | **Staging only** |
| API app (name only) | **`viona-api-staging-eu`** |
| Required initial status | **`submitted`** |
| Suggested title | `Pack25 status action UI visual QA — submitted affordance check` |
| Suggested tenant/universe pattern | Consistent with prior Pack25 pilot rows (e.g. `staging-pilot-pack25`, `local`, `viona-requests-live-inbox`) — **no schema extension** |
| Scope rule | `requesterUserId` + `ownerUserId` for pilot User A (same pattern as PR #153 / #162 execution evidence) |
| Notes on create | **NO** — row created without `action.note` |
| Status transition on create | **NO** — must remain `submitted` until separately authorized |
| Idempotent path | If a matching suitable **`submitted`** visual-QA row already exists, **do not** create a duplicate |

---

## 5. Pilot owner identity and scope (labels only — no secrets)

| Item | Reference |
| --- | --- |
| Pilot persona | **User A** (documented staging pilot roster) |
| Phone label (public runbook) | `+420910000001` — PIN operator-provisioned; **not** printed in this packet |
| Auth scope rule (repo) | `buildAuthorizedVionaRequestWhere` — caller sees rows where they are **requester**, **owner**, or **participant** |
| Required scope for visual-QA row | **Owner** (and requester) = pilot User A staging user id |

**Stop** if pilot User A staging user id cannot be resolved without printing secrets or DATABASE_URL.

---

## 6. Existing row protection

| Rule | Required |
| --- | --- |
| Existing scoped pilot / status-QA rows (`triage`) | **Must not** be reset, rolled back, deleted, or modified |
| Purpose | Preserve Pack24 note + prior status transition audit history |
| Visual-QA row discrimination | Unique title — `Pack25 status action UI visual QA — submitted affordance check` |
| Distinction from live-QA row title | Prior live-QA title `Pack25 status QA scoped request — submitted-to-triage live QA` is a **different** purpose — do not conflate or overwrite |

---

## 7. Row quantity and behavior constraints

| Rule | Required |
| --- | --- |
| Rows to create | **At most one** fresh visual-QA `VionaRequest` (zero if suitable row already exists) |
| Rows to mutate | **Zero** (all existing `triage` rows untouched) |
| Status at creation/ensure | **`submitted` only** |
| Assign / confirm / cancel | **NO** |
| Payment / booking / SOS / wallet / live AI | **NO** |
| Note submit | **NO** |
| Status endpoint call | **NO** |
| Pack26 | **NO** |

---

## 8. Future execution boundary (when separately authorized)

| # | Rule |
| --- | --- |
| 1 | Verify target is **staging only** |
| 2 | Use scoped **pilot User A** only |
| 3 | Create or ensure **exactly one** matching fresh visual-QA row in **`submitted`** |
| 4 | Do **not** touch existing **`triage`** rows |
| 5 | Do **not** call `POST /api/viona/requests/:id/actions/status` |
| 6 | Do **not** submit notes |
| 7 | Do **not** run live QA |
| 8 | Do **not** deploy |
| 9 | Do **not** mutate anything beyond the single authorized scoped row |
| 10 | Do **not** print secrets, JWTs, PINs, Authorization headers, database URLs, or full env values |
| 11 | **Stop** on any ambiguity |

---

## 9. Stop conditions (future execution)

Stop immediately if any of the following occur:

| # | Condition |
| --- | --- |
| 1 | More than one matching visual-QA row would exist after execution |
| 2 | Owner/requester identity is ambiguous |
| 3 | Target environment is not staging |
| 4 | DB/schema assumptions are unclear |
| 5 | Any secret or full env value would need to be printed to proceed |
| 6 | Existing **`triage`** row would be modified, reset, or rolled back |
| 7 | Row would be created in any status other than **`submitted`** |
| 8 | Status endpoint or note action would be invoked during row work |

---

## 10. Required future post-create verification (after separate execution authorization)

Execute **after** DB/data operation is separately authorized and completed. **No secrets recorded in evidence.**

| Step | Check | Pass criterion |
| --- | --- | --- |
| V1 | Row count for visual-QA title | **Exactly one** matching row |
| V2 | Row status | **`submitted`** |
| V3 | Owner list `GET /api/viona/requests?limit=50&skip=0` | **200** — visual-QA row visible |
| V4 | `GET /api/viona/requests/:id` (visual-QA row) | **200**, status **`submitted`** |
| V5 | Note audit events on visual-QA row | **0** |
| V6 | Status events on visual-QA row | **0** |
| V7 | Status transition executed | **NO** |
| V8 | Existing **`triage`** rows unchanged | **YES** |

---

## 11. Required future visual pass re-run (after row exists — separate authorization)

**Not granted by this packet.** When separately authorized:

| # | Check |
| --- | --- |
| 1 | Owner read-only authentication only — secrets redacted |
| 2 | `GET` list/detail only on `/viona-requests-live-inbox` |
| 3 | Confirm **`submitted`** row visible in list |
| 4 | Open **`submitted`** detail — confirm **“Send to review”** / **“Mark for review”** visible |
| 5 | Confirm placement **after summary** and **above Timeline** |
| 6 | Confirm copy is review/triage only — no booking/payment/SOS/assignment/automation claims |
| 7 | Confirm no assign/confirm/cancel/payment/booking/SOS/wallet/live AI controls |
| 8 | **Do not** click **Send to review** |
| 9 | Open **`triage`** detail — confirm action **hidden** |
| 10 | Confirm layout readable at **390 / 768 / 1440px** — no overflow/clipping |

---

## 12. Explicit boundaries (this packet)

| Boundary | State |
| --- | --- |
| Row creation/ensure executed in this packet | **NO** |
| DB/data approval granted by this packet | **NO** |
| Visual pass re-run granted by this packet | **NO** |
| Status action click/POST granted | **NO** |
| Deploy/live QA granted | **NO** |
| Production touched | **NO** |
| Prisma schema/migrations modified | **NO** |
| `.env*` modified | **NO** |
| Secrets/database URLs printed | **NO** |
| Pack26 opened | **NO** |

---

## 13. Operator execution authorization template (future — not active)

> I, [Operator name], authorize **staging-only** DB/data execution to create or ensure **exactly one** fresh scoped `VionaRequest` row for Pack25 status-action **UI visual QA** per authorization packet on master @ `736e260`. Row must be in **`submitted`** state with title `Pack25 status action UI visual QA — submitted affordance check`, scoped to pilot User A as owner/requester. Do **not** reset, rollback, delete, or modify existing **`triage`** rows. Do not create a duplicate if a suitable matching **`submitted`** visual-QA row already exists. Do not submit notes. Do not call status endpoint. Do not click or POST status action. Do not deploy. Do not run live QA. Do not open Pack26. Stop on error. Run post-create verification before separate visual pass re-run authorization.

---

## 14. Next gate after row creation evidence

| Gate | Requirement |
| --- | --- |
| Post-create verification evidence | Docs-only pack recording V1–V8 |
| Pack25 status-action UI visual pass closure | **Separate** read-only owner-auth visual pass authorization |
| Status action live QA / POST | **Separate** authorization — **not** part of this visual-QA row packet |
| Pack26 | **NOT opened** |
