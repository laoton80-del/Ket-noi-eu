# VIONA Request — Pack19 R1 create/submit path authorization/design packet

**Document type:** Authorization / design packet (docs-only — no implementation).
**Status:** `pack19_r1_viona_request_create_submit_path_authorization_planning_only`
**Result classification:** `R1_CREATE_SUBMIT_PATH_AUTHORIZATION_PACKET_PREPARED_ONLY`

> Read `docs/ai-context/VIONA_OPERATING_PROTOCOL.md` first. This packet records **design and approval intent only**. It authorizes **no** implementation, **no** endpoint code, **no** staging mutation, **no** row creation, **no** DB/Prisma/SQL, **no** deploy/restart, **no** Pack29, and **no** execution wiring. No secrets printed.

---

## 1. Baseline

| Field | Value |
|-------|--------|
| **Source master** | `origin/master @ 77ca077` |
| **Full hash** | `77ca0774a1377b361a0b375c176eac54c7ec6e28` |
| **Branch** | `docs/pack19-r1-viona-request-create-submit-path-authorization-packet` |
| **Pack** | Pack19 R1 — VIONA request create/submit path authorization/design |
| **Target of eventual test** | `viona-api-staging-eu.fly.dev` (staging only) |

---

## 2. Context (why this packet exists)

| Item | Value |
|------|--------|
| Prior remediation result | **`BLOCKED_REMEDIATION_ERROR`** |
| Reason | **No approved VIONA request-create/submit path exists** |
| Prior read-only discovery | 0 safe non-hold `submitted` rows in scope on staging |
| Selected remediation option | **R1) Add an approved VIONA request-create/submit path** |
| This packet authorizes | **Design/approval recording only — not implementation** |

The existing VIONA request API exposes only:

- `GET /api/viona/requests`
- `GET /api/viona/requests/:id`
- `POST /api/viona/requests/:id/actions/note`
- `POST /api/viona/requests/:id/actions/status`

It does **not** expose a VIONA request create/submit endpoint. Therefore Pack19's safe `submitted`-row precondition cannot be produced via any approved application/API path.

**Hard domain rule:** `LocalServiceRequest` **must not** be reused as source-of-truth. `POST /api/local/requests` creates a different-domain `LocalServiceRequest` (initial status `REQUESTED`) and **must not** be used to satisfy VIONA Request Engine preconditions. `GET /api/viona/requests` reads the **`VionaRequest`** model only.

---

## 3. Proposed future API design (not implemented here)

### 3.1 Endpoint

| Field | Value |
|-------|--------|
| Method + path | **`POST /api/viona/requests`** |
| Auth | **Required** (authenticated user; same `authMiddleware` bearer-JWT posture as existing VIONA routes) |
| Purpose | Create **exactly one** VIONA Request Engine row through an approved application/API path |
| Domain/model | **`VionaRequest` only** — must not write `LocalServiceRequest` |
| Initial allowed status | **`submitted`** |
| Readiness | Not production-ready; **staging-testable before any broader rollout** |

### 3.2 Required safety labels for Pack19 test rows

| Label |
|-------|
| `pack19-safe-submitted-row-precondition` |
| `staging-only` |
| `non-production` |
| `non-hold` |
| `non-customer-critical` |
| `test-remediation` |

### 3.3 Required behaviors

- Must write to the **`VionaRequest`** domain/model **only**.
- Must **not** write `LocalServiceRequest`.
- Must **not** use or reference the Pack25 hold row (`ec9a8b69-8a60-45aa-99ba-fc805a101dcc`).
- Must include: **auth**, **owner/user scope**, **audit metadata**, and **safety/readiness metadata**.
- Must **validate request type/category** against the existing safe allowlist.
- Must **reject production test labels** (test-labeled rows must never be created as production-real).
- Must **reject broad/bulk creation** (single-row creation only; no batch/seed loops).
- Must **reject unauthenticated creation** (401 on missing/invalid auth).
- Must **not** trigger execution, booking, payment, SOS, merchant action, AI call, or any external side effect.
- Must **not** claim production readiness in copy, response, or docs.
- Must be **staging-testable before any broader rollout**.

### 3.4 Explicitly out of scope for the future endpoint

- No status transitions performed on create beyond setting initial `submitted`.
- No wallet/ledger/hold, booking bridge, or tourism/booking rows (mirrors existing create-source-of-truth safety expectations).
- No Pack29 execution wiring.
- No cross-tenant/admin shortcut creation paths.

---

## 4. Change-class & review expectations (for the future implementation pack)

| Item | Value |
|------|--------|
| Change class | **Class B (routing/registry/gates)** — new authenticated route + controller/service + validation |
| Required reviewers | Principal Architect + Core Platform Lead; Security & Tenant Isolation Lead (auth/scope); Release Train / QA Gate Owner (readiness) |
| Gate | Staging-testable, behind readiness posture; no production rollout claim |

---

## 5. Future implementation phrase (required — NOT provided here)

| Field | Value |
|-------|--------|
| Phrase required | **YES** |
| Phrase (verbatim) | `APPROVE_PACK19_R1_VIONA_REQUEST_CREATE_SUBMIT_PATH_IMPLEMENTATION` |
| Phrase provided in this pack | **NO** |

No implementation may begin until the phrase above is explicitly provided in a separate execution/implementation pack.

---

## 6. Explicit non-authorizations (this pack)

This packet does **NOT**:

- implement any endpoint or code;
- mutate staging or any environment;
- create/seed any row;
- run Pack19 QA;
- call any status POST;
- run DB/Prisma/Supabase/SQL;
- deploy or restart anything;
- open Pack29;
- wire execution;
- modify `.env*`;
- print secrets/tokens/PINs/DB URLs.

---

## 7. Result classification

**`R1_CREATE_SUBMIT_PATH_AUTHORIZATION_PACKET_PREPARED_ONLY`**

Assertions: design/approval recorded only; no endpoint implemented; no row create/seed; no staging/auth/data mutation; no DB/Prisma/Supabase/SQL run; no deploy/restart; Pack29 remains blocked; execution remains blocked; future implementation phrase required but **not** provided.

---

## 8. Recommended next step

After this packet merges, an operator may provide `APPROVE_PACK19_R1_VIONA_REQUEST_CREATE_SUBMIT_PATH_IMPLEMENTATION` to authorize a **separate implementation pack** that builds `POST /api/viona/requests` per §3, with reviews per §4, staging-testable only. Once the safe `submitted` precondition can be produced, re-run the Pack19 execution-only precondition remediation, then Pack19 bounded QA under `APPROVE_PACK19_SCOPED_SUBMITTED_ROW_STATUS_TRIAGE_QA`. Pack29 and execution remain blocked throughout.
