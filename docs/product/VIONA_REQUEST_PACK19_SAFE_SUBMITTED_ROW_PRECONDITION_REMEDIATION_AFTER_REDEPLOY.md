# VIONA Request — Pack19 safe submitted-row precondition remediation (after redeploy)

**Document type:** Product execution record (bounded staging remediation).
**Status:** `pack19_safe_submitted_row_precondition_remediated_after_redeploy`
**Result classification:** `PRECONDITION_REMEDIATED_SAFE_SUBMITTED_ROW_CREATED`

> Read `docs/ai-context/VIONA_OPERATING_PROTOCOL.md` first. This pack executes only via the approved application/API path `POST /api/viona/requests` on staging. No production, no status POST, no Pack19 QA rerun, no Pack29, no execution wiring, no deploy/restart, no DB/Prisma/SQL migration/apply, no secrets printed.

---

## 1. Baseline

| Field | Value |
|-------|--------|
| **Source master** | `origin/master @ 649a9455defc7ca82db01f45f22273c5cb703845` (`649a945`) |
| **Branch** | `docs/pack19-safe-submitted-row-precondition-remediation-after-redeploy` |
| **Authorization phrase (recorded on master)** | `APPROVE_PACK19_SAFE_SUBMITTED_ROW_PRECONDITION_REMEDIATION` |
| **Approved endpoint** | `POST /api/viona/requests` |
| **Target** | `viona-api-staging-eu` / `viona-api-staging-eu.fly.dev` (staging only) |
| **Prior redeploy evidence** | PR #247 — `STAGING_REDEPLOY_COMPLETED_ROUTE_AVAILABLE` @ `649a945` |

---

## 2. Purpose

Create or identify **exactly one** safe, staging-only `VionaRequest` row whose status is **`submitted`**, so Pack19 bounded `submitted → triage` status QA can be re-run later in a separate pack.

---

## 3. Execution log

| Step | Check | Observed |
|------|-------|----------|
| Discovery guard | Unauthenticated `GET /api/viona/requests` | **not run** — authenticated discovery used directly after login |
| Login | `POST /api/auth/login` (User A roster) | **HTTP 200**, token acquired (not printed) |
| Discovery | Authenticated `GET /api/viona/requests` | **HTTP 200** |
| Visible rows | Row count in caller-owned read scope | **3** |
| Submitted rows (total) | rows with `status = submitted` | **0** (before create) |
| Safe non-hold submitted rows | `submitted` + all six Pack19 labels + not Pack25 hold | **0** (before create) |
| Pack25 hold row | `ec9a8b69-8a60-45aa-99ba-fc805a101dcc` | **not used, not modified** |
| Remediation | `POST /api/viona/requests` (exactly once, all six labels) | **HTTP 201** — one row created |
| Idempotent replay | — | **NO** (first successful create) |
| Post-verify GET | Authenticated list + detail (GET only) | **exactly 1** safe candidate, status **`submitted`** |

### Approved create payload (accepted by staging)

| Field | Value |
|-------|--------|
| `tenantId` | `pack19-staging-remediation` |
| `sourceUniverse` | `local` |
| `requestType` | `pack19-precondition-test` |
| `title` | Pack19 safe submitted-row precondition (staging test-remediation) |
| `safetyLabels` | all six required labels (see §4) |
| `idempotencyKey` | `pack19-safe-submitted-row-precondition-001` |

No production, hold, bulk, execution, payment, booking, SOS, AI-call, merchant, notification, callback, or external-side-effect fields were included.

---

## 4. Required Pack19 safety labels (all six)

| Label |
|-------|
| `pack19-safe-submitted-row-precondition` |
| `staging-only` |
| `non-production` |
| `non-hold` |
| `non-customer-critical` |
| `test-remediation` |

---

## 5. Result

| Field | Value |
|-------|--------|
| Candidate found (pre-existing) | **NO** — 0 safe non-hold `submitted` rows in discovery scope |
| Candidate created | **YES** — `POST /api/viona/requests` returned **201** |
| Mutation count | **1** (exactly one `VionaRequest` create) |
| Candidate reference | **`5e759ca9…`** (safe redacted) |
| Candidate status (post-verify) | **`submitted`** |
| **Result classification** | **`PRECONDITION_REMEDIATED_SAFE_SUBMITTED_ROW_CREATED`** |

---

## 6. Boundaries honored

| Boundary | Honored |
|----------|---------|
| Staging only (no production) | **YES** |
| Approved path only (`POST /api/viona/requests`) | **YES** — no DB/Prisma/SQL |
| Pack25 hold row not used/modified | **YES** |
| No Pack19 status QA rerun | **YES** |
| No status POST | **YES** |
| No Pack29 / no execution wiring | **YES** |
| No deploy/restart | **YES** |
| No DB migration/apply | **YES** |
| No `.env*` modified | **YES** |
| No secrets printed | **YES** |
| Stopped on first error | **YES** (no errors) |

---

## 7. Candidate reference policy

Candidate recorded as **safe redacted reference** only (`5e759ca9…`). Full UUID, tokens, PINs, Authorization headers, and DB URLs were **not** printed.

---

## 8. Next gate

**Separate Pack19 bounded staging QA authorization** required to run one owner-authenticated `submitted → triage` status transition on the safe candidate row. That pack must **not** use the Pack25 hold row, must **not** open Pack29, and must **not** wire execution.
