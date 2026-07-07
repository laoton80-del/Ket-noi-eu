# VIONA Request — Pack19 R1 staging API redeploy authorization packet

**Document type:** Authorization packet (docs-only — no deploy).
**Status:** `pack19_r1_staging_api_redeploy_approval_recorded`
**Result classification:** `PACK19_R1_STAGING_REDEPLOY_APPROVAL_RECORDED_ONLY`

> Read `docs/ai-context/VIONA_OPERATING_PROTOCOL.md` first. This packet records **authorization intent only**. It performs **no** deploy/restart, **no** staging QA, **no** row create/seed, **no** status POST, **no** DB/Prisma/Supabase/SQL, **no** `.env*` change, **no** Pack29, and **no** execution wiring. No secrets printed.

> **Approval update:** The operator has **now provided** the redeploy phrase `APPROVE_PACK19_R1_STAGING_API_REDEPLOY_FOR_CREATE_SUBMIT_ROUTE`. This update records **approval only** — no deploy/restart was executed; no staging QA was run; no row was created or seeded; no `POST /api/viona/requests` was called; no status POST was called; no DB/Prisma/Supabase/SQL ran; Pack19 QA remains held; Pack29 remains blocked; execution remains blocked.

---

## 1. Baseline

| Field | Value |
|-------|--------|
| **Source master** | `origin/master @ ef17d84` |
| **Full hash** | `ef17d848432321ae4429a49f8b06de2157da9850` |
| **Branch** | `docs/pack19-r1-staging-api-redeploy-authorization-packet` |
| **Endpoint implemented on master** | `POST /api/viona/requests` (PR #244) |
| **Target** | `viona-api-staging-eu` / `viona-api-staging-eu.fly.dev` (staging only) |

---

## 2. Context (why this packet exists)

| Item | Value |
|------|--------|
| Endpoint implemented + merged on master | **`POST /api/viona/requests`** |
| Prior remediation execution result | **`BLOCKED_REMEDIATION_ERROR`** |
| Blocking reason | Staging returned **HTTP 404** for `POST /api/viona/requests` — the merged route is **not deployed** on staging yet |
| Read-only discovery at time of block | login **200**, `GET /api/viona/requests` **200**, 3 rows visible, 0 safe `submitted` rows |

The create-submit route exists in the master codebase but the running staging service predates the merge, so the route is absent at runtime. A **staging-only redeploy** of the current master image is required to make the route available.

---

## 3. Purpose

Authorize a **future staging-only redeploy** of `viona-api-staging-eu` so the already-merged endpoint `POST /api/viona/requests` becomes available at runtime on `viona-api-staging-eu.fly.dev`.

---

## 4. Scope of the future redeploy (when authorized)

**In scope (future execution pack only):**

- Redeploy the current master application image/build to the **staging** app `viona-api-staging-eu` so the merged route is served.

**Explicitly out of scope (never in this line of work):**

- No production deploy or production target.
- No DB migration/apply.
- No schema change.
- No seed / user creation.
- No status POST.
- No Pack19 QA rerun in this packet.
- No Pack29.
- No execution wiring.
- No `.env*` change.
- No secrets printed.

---

## 5. Future redeploy phrase (required — NOW PROVIDED)

| Field | Value |
|-------|--------|
| Phrase required | **YES** |
| Phrase (verbatim) | `APPROVE_PACK19_R1_STAGING_API_REDEPLOY_FOR_CREATE_SUBMIT_ROUTE` |
| Phrase provided | **YES** — recorded verbatim in this approval update |

**Recording note:** approval recorded only — no redeploy has begun. The redeploy must be executed in a **separate staging-only redeploy execution pack** subject to the scope (§4) and all guardrails in this document.

---

## 6. Explicit non-authorizations (this packet)

This packet does **NOT**:

- deploy or restart anything;
- run staging QA;
- create/seed any row;
- call `POST /api/viona/requests`;
- call any status POST;
- run DB/Prisma/Supabase/SQL;
- change schema;
- create users;
- modify `.env*`;
- open Pack29;
- wire execution;
- print secrets/tokens/PINs/DB URLs.

---

## 7. Result classification

**`PACK19_R1_STAGING_REDEPLOY_APPROVAL_RECORDED_ONLY`**

Assertions (this approval update): approval recorded only; **no deploy/restart executed**; **no staging QA run**; **no row created or seeded**; **no `POST /api/viona/requests` called**; **no status POST called**; **no DB/Prisma/Supabase/SQL ran**; **Pack19 QA remains held**; **Pack29 remains blocked**; **execution remains blocked**; future redeploy phrase required and **now provided** verbatim.

---

## 8. Recommended next step

The redeploy phrase `APPROVE_PACK19_R1_STAGING_API_REDEPLOY_FOR_CREATE_SUBMIT_ROUTE` is now provided. The next step is a **separate staging-only redeploy execution pack**. After redeploy, verify `POST /api/viona/requests` responds on staging, then re-run the Pack19 safe submitted-row precondition remediation execution pack, then Pack19 bounded QA under `APPROVE_PACK19_SCOPED_SUBMITTED_ROW_STATUS_TRIAGE_QA`. Pack29 and execution remain blocked throughout.
