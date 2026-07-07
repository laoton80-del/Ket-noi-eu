# VIONA Request — Pack19 execution-only safe submitted-row precondition remediation pack

**Document type:** Product execution record (bounded staging remediation attempt).
**Status:** `pack19_execution_only_safe_submitted_row_precondition_remediation_blocked_remediation_error`
**Result classification:** `BLOCKED_REMEDIATION_ERROR`

> Read `docs/ai-context/VIONA_OPERATING_PROTOCOL.md` first. This pack executes only within the recorded authorization and the hard boundaries below. No production, no status POST, no Pack29, no execution wiring, no deploy/restart, no secrets printed.

---

## 1. Baseline

| Field | Value |
|-------|--------|
| **Source master** | `origin/master @ 77ca077` |
| **Full hash** | `77ca0774a1377b361a0b375c176eac54c7ec6e28` |
| **Branch** | `docs/pack19-execution-only-safe-submitted-row-precondition-remediation-pack` |
| **Pack ID** | Pack19 execution-only safe submitted-row precondition remediation |
| **Authorization phrase recorded on master** | `APPROVE_PACK19_SAFE_SUBMITTED_ROW_PRECONDITION_REMEDIATION` |
| **Target** | `viona-api-staging-eu` / `viona-api-staging-eu.fly.dev` (staging only) |

---

## 2. Purpose

Create or identify **exactly one** safe, staging-only request row whose status is **`submitted`**, so Pack19 bounded `submitted → triage` status QA can be re-run later — using only an **approved existing application/API path**. This pack performs read-only discovery first and mutates **only** if a safe, unambiguous creation path is available within protocol.

---

## 3. Authorization

| Item | Value |
|------|--------|
| Approval phrase required | **YES** |
| Approval phrase recorded on master | **YES** — `APPROVE_PACK19_SAFE_SUBMITTED_ROW_PRECONDITION_REMEDIATION` (recorded via PR #240 @ master) |
| Scope authorized | Create/identify **one** safe staging-only `submitted` precondition row via **approved existing application/API path only** |
| Explicitly **not** authorized | Direct DB/Prisma/Supabase/SQL row creation; status POST; Pack29; execution wiring; deploy/restart; `.env*` change; production access |

---

## 4. Chosen method

**Approved existing application/API path only**, in this priority order:

1. **Read-only candidate discovery** — authenticated `GET /api/viona/requests` on staging (User A roster login `+420…001`, PIN from `.env.local`, never printed). Detect any safe, non-hold, `submitted` row.
2. If **exactly one** safe non-hold `submitted` row exists → record it (redacted reference), **do not create**.
3. If **none** exists → create **exactly one** `submitted` row **only via an approved existing application/API creation endpoint** with the required safety labels.
4. If **more than one** ambiguous candidate exists → stop, do not mutate.

**DB/Prisma/Supabase/SQL row creation is out of scope** and was not used — the protocol does not explicitly authorize an AI direct DB write for this pack (§3 rule 6, §11.6 "AI must not write DB directly", §5 audit-first).

---

## 5. Execution log (read-only)

| Step | Check | Observed |
|------|-------|----------|
| Discovery guard | Unauthenticated `GET /api/viona/requests` | **HTTP 401** (auth enforced) |
| Login | `POST /api/auth/login` (User A roster) | **HTTP 200**, token acquired (not printed) |
| Discovery | Authenticated `GET /api/viona/requests` | **HTTP 200** |
| Visible rows | Row count in caller-owned read scope | **0** |
| Submitted rows (total) | rows with `status = submitted` | **0** |
| Safe non-hold submitted rows | `submitted` and not Pack25 hold | **0** |
| Pack25 hold row | `ec9a8b69-8a60-45aa-99ba-fc805a101dcc` | **not used, not modified** |

**Creation path availability check (read-only, codebase):** the VIONA request API (`src/routes/vionaRoutes.ts`) exposes only:

- `GET /requests` (list)
- `GET /requests/:id` (detail)
- `POST /requests/:id/actions/note` (note action)
- `POST /requests/:id/actions/status` (narrow `submitted → triage` status action)

There is **no request-create / request-submit endpoint** for the VIONA request domain. `GET /api/viona/requests` reads the `VionaRequest` Prisma model (`src/services/viona/vionaRequestReadService.ts`).

A separate `POST /api/local/requests` endpoint exists (`src/routes/localRoutes.ts`), but it creates a **`LocalServiceRequest`** (initial status `REQUESTED`) in a **different domain/table** — it does **not** produce a `VionaRequest` and never appears in `GET /api/viona/requests`. It is therefore **not** a valid path to a VIONA `submitted` row.

Consequently, no approved existing **application/API path** exists to create a new VIONA `submitted` row. The only remaining creation mechanism would be a direct DB/Prisma/SQL write, which is **not authorized** by protocol for this pack.

---

## 6. Result

| Field | Value |
|-------|--------|
| Candidate found | **NO** — 0 safe non-hold `submitted` rows in the discovery scope |
| Candidate created | **NO** — no approved application/API creation path exists |
| Mutation performed | **NO** |
| **Result classification** | **`BLOCKED_REMEDIATION_ERROR`** |

**Root cause:** Remediation could not proceed via any approved existing application/API path because the VIONA request server exposes **no create/submit endpoint**. Creating a `submitted` row would require a direct DB/Prisma/Supabase/SQL write, which the operating protocol does **not** explicitly authorize for this pack. Per the hard boundary "stop on first error or ambiguity," the pack stopped safely without mutating any data.

This is a **blocked-safe** outcome — not a data-integrity failure and not a protocol violation.

---

## 7. Boundaries honored

| Boundary | Honored |
|----------|---------|
| Staging only (no production) | **YES** |
| Pack25 hold row not used/modified | **YES** — hard exclusion `ec9a8b69-8a60-45aa-99ba-fc805a101dcc` |
| No Pack19 status QA run in this pack | **YES** |
| No status POST called | **YES** |
| No Pack29 opened | **YES** |
| No execution wiring | **YES** |
| No deploy/restart | **YES** |
| No `.env*` modified | **YES** |
| No secrets/tokens/PINs/DB URLs printed | **YES** |
| No DB/Prisma/Supabase/SQL run | **YES** |
| Preferred existing application/API path | **YES** — read-only GET only; no unapproved path used |
| Stopped on ambiguity/error without mutation | **YES** |

---

## 8. Candidate reference policy

No candidate exists to record. Had one been found, it would be recorded as a **safe redacted reference** (`xxxx…xxxx`) only. Full request IDs are not printed in docs.

---

## 9. Recommended next step

The safe `submitted` precondition **cannot** be produced through an approved application/API path because no request-create endpoint exists. To unblock Pack19 bounded QA, an operator must choose one of:

- **Option R1 — Add an approved request-create/submit path** (product/engineering change, separately reviewed and gated) so a `submitted` row can be created through governed application logic, then re-run this execution pack.
- **Option R2 — Operator-authorized data seeding via an explicitly protocol-approved mechanism** (a distinct authorization packet naming the exact approved seeding method and owner; this pack does not authorize DB writes).
- **Option R3 — DEFER** Pack19 bounded QA until a safe `submitted` row exists by natural staging activity.

Pack29 and execution remain **blocked**. Pack19 bounded QA remains **held** until a safe `submitted` precondition exists, after which it re-runs under `APPROVE_PACK19_SCOPED_SUBMITTED_ROW_STATUS_TRIAGE_QA`.
