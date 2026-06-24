# VIONA Request Engine — Pack25 Scoped Pilot Request Row Authorization Packet

**Document type:** Scoped staging DB/data authorization packet (docs-only — no row creation, no DB execution).
**Packet ID:** `CURSOR_PACK25_SCOPED_PILOT_REQUEST_ROW_AUTHORIZATION_PACKET_DOCS_ONLY`
**Baseline:** `origin/master @ 64c065e` — `docs(pack25): record live UI empty-state attestation evidence (#151)`.
**Related:** `docs/product/VIONA_REQUEST_PACK25_LIVE_UI_EMPTY_STATE_ATTESTATION_EVIDENCE.md`, `docs/product/VIONA_REQUEST_PACK25_STAGING_API_REDEPLOY_AUTHORIZATION_PACKET.md`, `docs/product/VIONA_REQUEST_PACK16_READ_ONLY_REQUEST_API_IMPLEMENTATION_RESULT.md`, `docs/product/VIONA_REQUEST_PACK20_FIRST_NARROW_NOTE_ACTION_IMPLEMENTATION_RESULT.md`, `docs/product/VIONA_REQUEST_PACK24_FIRST_NOTE_INPUT_WRITE_UI_IMPLEMENTATION_RESULT.md`

---

## 1. Packet summary

| Field | Value |
| --- | --- |
| Operating Protocol read | **YES** (required before any future execution) |
| Docs-only | **YES** |
| Authorization packet prepared | **YES** |
| DB/data execution performed | **NO** |
| Request row created/seeded | **NO** |
| Note submit attempted | **NO** |
| Deploy/restart performed | **NO** |
| Secrets printed/inspected | **NO** |
| Pack24 failed | **NO** |
| Pack26 opened | **NO** |
| All non-note write/actions remain blocked | **YES** |

**This packet prepares scope only.** It does **not** authorize DB/data execution unless the operator issues a **separate explicit execution authorization** (see §9).

---

## 2. Current gate context (green on master)

| Gate | Status |
| --- | --- |
| Verified master | **`64c065e`** |
| Staging API redeploy | **Completed** — `viona-api-staging-eu` serves Pack16/20 routes |
| Pack25 live UI empty-state attestation | **PASS** (PR #151) |
| `GET /api/viona/requests` (unauthenticated) | **401** — not generic **404** |
| Authenticated pilot list | **200**, count **0** |
| Pack24 note live submit | **DATA-BLOCKED** — no scoped `VionaRequest` row for pilot User A |

---

## 3. Purpose of future controlled staging data operation

| # | Objective |
| --- | --- |
| 1 | Create **exactly one** scoped **`VionaRequest`** row on **staging only** |
| 2 | Row must be visible to **pilot User A** via `GET /api/viona/requests?limit=50&skip=0` |
| 3 | Enable **Pack24 note live submit** test under existing **Pack20** `POST /api/viona/requests/:id/actions/note` scope only |
| 4 | Support existing **Pack16** read-only detail for the same row |

**Not in scope:** production, schema changes, migrations, broad backfill, seed scripts (unless separately authorized), user creation, Pack26, or any write/action beyond Pack20 note.

---

## 4. Target environment and context

| Field | Value |
| --- | --- |
| Environment | **Staging only** |
| Production | **Must not be touched** |
| API app (name only) | **`viona-api-staging-eu`** |
| Data domain | **Viona request engine** — `VionaRequest` (+ minimal related rows only if required by existing schema constraints) |
| Prisma schema changes | **NO** |
| Migration changes | **NO** |
| Seed scripts | **NO** (unless separately authorized) |
| Broad data backfill | **NO** |
| User creation | **NO** |
| Tenant-crossing data | **NO** |

---

## 5. Pilot User A identity and scope (labels only — no secrets)

| Item | Reference |
| --- | --- |
| Pilot persona | **User A** (documented staging pilot roster) |
| Phone label (public runbook) | `+420910000001` — PIN operator-provisioned; **not** printed in this packet |
| Auth scope rule (repo) | `buildAuthorizedVionaRequestWhere` — caller sees rows where they are **requester**, **owner**, or **participant** |

**Row scoping requirement:** The created row must satisfy at least one authorized path for pilot User A's `authUserId` (resolved at execution time from staging DB — **user id value not printed in this packet**).

**Minimum scope pattern (execution planning only):**

- Set `requesterUserId` and/or `ownerUserId` to pilot User A's staging user id, **or**
- Add a `participants` row linking pilot User A's user ref

**Stop** if pilot User A staging user id cannot be resolved without printing secrets or DATABASE_URL.

---

## 6. Row quantity and behavior constraints

| Rule | Required |
| --- | --- |
| Rows to create | **Exactly one** `VionaRequest` |
| Status changes via this pack | **NO** |
| Assign / confirm / cancel | **NO** |
| Payment / booking / SOS / wallet / live AI | **NO** |
| Non-note write/actions | **NO** |
| Pack20 note action after row exists | **Separate** live QA step — not authorized by this packet alone |

The row should use values consistent with existing Pack16 read serializers (status, universe, request type within allowed enums) — **no schema extension**.

---

## 7. Explicit boundaries (this packet)

| Boundary | State |
| --- | --- |
| This packet authorizes DB/data execution | **NO** |
| Production touched | **NO** |
| Prisma schema/migrations modified | **NO** |
| Deployment/restart | **NO** |
| `.env*` modified | **NO** |
| Secrets/database URLs printed | **NO** |
| Pack26 opened | **NO** |
| Pack24 failed | **NO** |

---

## 8. Stop-on-error conditions (future execution)

Stop immediately if any of the following occur:

| # | Condition |
| --- | --- |
| 1 | Target environment ambiguity (production vs staging) |
| 2 | Missing separate operator execution authorization |
| 3 | Missing staging DB access (no approved path; connection secrets would need printing) |
| 4 | Unclear pilot User A identity or scope mapping |
| 5 | Any need to inspect or print secrets, JWTs, PINs, Authorization headers, or database URLs |
| 6 | Any schema or migration change would be required |
| 7 | Any production target appears |
| 8 | Any non-note write/action would be needed beyond inserting the scoped row |
| 9 | More than one `VionaRequest` row would be created |
| 10 | Tenant-crossing or cross-user visibility beyond pilot User A scope |

**Do not** run extra DB/Prisma commands as workaround if verification fails.

---

## 9. Operator authorization model

### 9.1 What this packet authorizes

| Item | Status |
| --- | --- |
| Document scoped row creation scope and verification plan | **YES** |
| Open PR for docs-only authorization packet | **YES** |
| Execute staging DB insert | **NO** |

### 9.2 Required future execution authorization

Future DB/data execution requires a **separate explicit operator message**. Example scope-lock template (not active until operator sends it):

> I, [Operator name], authorize **staging-only** creation of **exactly one** scoped `VionaRequest` row for pilot User A on the staging request engine database, so Pack24 note live submit can be tested under existing Pack20 note-action scope only. Do not touch production. Do not change Prisma schema or migrations. Do not run broad seed/backfill. Do not create users. Do not print secrets or database URLs. Stop on error. After insert, verify authenticated pilot list count >= 1 and detail returns 200 before any note submit attempt.

---

## 10. Post-execution verification plan (future pack only)

Execute **after** separate DB/data authorization and row creation. **No secrets recorded.**

### Phase A — List visibility

| Step | Check | Pass |
| --- | --- | --- |
| A1 | Pilot PIN login on staging API | **200** |
| A2 | `GET /api/viona/requests?limit=50&skip=0` | **200**, count **>= 1** |

### Phase B — Detail visibility

| Step | Check | Pass |
| --- | --- | --- |
| B1 | `GET /api/viona/requests/:id` for created row id | **200** scoped detail |

### Phase C — UI readiness (no note submit in verification-only pass)

| Step | Check | Pass |
| --- | --- | --- |
| C1 | `/viona-requests-live-inbox` shows **one** visible row | Row selectable |
| C2 | Pack22 notes timeline renders (may be empty) | No error state |

### Phase D — Note submit (separate authorization)

| Step | Check | When |
| --- | --- | --- |
| D1 | `POST /api/viona/requests/:id/actions/note` | **Only** after A/B/C pass **and** separate operator instruction to attempt note submit |
| D2 | No status change | Mandatory |
| D3 | No assign/confirm/cancel | Mandatory |
| D4 | No secret/token/error leak in evidence | Mandatory |

---

## 11. Status flags

| Flag | Value |
| --- | --- |
| `pack25ScopedPilotRequestRowAuthorizationPacketPrepared` | `true` |
| `pack25ScopedPilotRequestRowExecutionAuthorized` | `false` |
| `pack25ScopedPilotRequestRowExecutionPerformed` | `false` |
| `pack24NoteLiveSubmitDataBlocked` | `true` |
| `pack24Failed` | `false` |
| `pack26NoteWriteUiHardeningOpened` | `false` |
| `pack25LiveOperatorAttestationPending` | `true` |
| `allNonNoteWriteActionsBlocked` | `true` |

---

## 12. Recommended next lane

| Step | Action |
| --- | --- |
| 1 | Merge this docs-only authorization packet |
| 2 | Operator issues **separate execution authorization** for staging-only single-row insert |
| 3 | Execute controlled row creation with stop-on-error |
| 4 | Run post-execution verification plan §10 |
| 5 | Retry Pack24 note live submit **only** under Pack20 scope and separate operator instruction |

---

**Evidence:** `docs/design/evidence/cursor-pack25-scoped-pilot-request-row-authorization-packet/README.md`
