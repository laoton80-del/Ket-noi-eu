# VIONA Request Engine — Pack25 Status Action Partial Live QA Replay Bug Evidence

**Document type:** Partial staging live QA + idempotency replay bug evidence (docs-only — records prior authorized sessions; no live QA re-run in this pack).
**Packet ID:** `CURSOR_PACK25_STATUS_ACTION_PARTIAL_LIVE_QA_REPLAY_BUG_EVIDENCE_DOCS_ONLY`
**Baseline:** `origin/master @ 4781e17` — `docs(pack25): record fresh scoped status qa row execution evidence (#163)`.
**Runtime deployed master:** `origin/master @ 3d2d827` — `feat(pack25): add owner-only submitted-to-triage status action API (#159)`.
**Related:** `docs/product/VIONA_REQUEST_PACK25_FRESH_SCOPED_STATUS_QA_ROW_EXECUTION_EVIDENCE.md`, `docs/product/VIONA_REQUEST_PACK25_STATUS_ACTION_LIVE_QA_BLOCKED_PRECONDITION_EVIDENCE.md`, `docs/product/VIONA_REQUEST_PACK25_STATUS_ACTION_STAGING_REDEPLOY_EXECUTION_EVIDENCE.md`, `src/services/viona/vionaRequestStatusActionService.ts`

---

## 1. Evidence summary

| Field | Value |
| --- | --- |
| Operating Protocol read | **YES** |
| Docs-only evidence pack | **YES** |
| Verified master | **`4781e17`** |
| Runtime deployed master | **`3d2d827`** |
| Target app | **`viona-api-staging-eu`** |
| Fresh QA row title | **`Pack25 status QA scoped request — submitted-to-triage live QA`** |
| Latest run stopped at precondition | **YES** — row already **`triage`** |
| Required precondition | **`submitted`** |
| Latest run first POST executed | **NO** |
| Latest run staging mutation | **NO** |
| Status action first-transition path | **PASS** (prior session) |
| Idempotency replay gate | **FAIL/BLOCKED** (prior session) |
| Pack26 opened | **NO** |

**This evidence pack records** partial live QA outcomes and a replay bug hypothesis. It does **not** re-run live QA, call the status endpoint, mutate staging data, or change code.

---

## 2. Prior gate progression

| Prior gate | Status |
| --- | --- |
| Pack25 status action API | **GREEN** (PR #159 @ `3d2d827`) |
| Staging redeploy execution evidence | **GREEN** (PR #160) |
| Fresh QA row execution evidence | **GREEN** (PR #163 @ `4781e17`) |
| Fresh QA row on staging | **Present** — status now **`triage`** |
| Full packet live QA (201 + idempotent 200) | **PARTIAL** — first transition PASS; replay FAIL |

---

## 3. Latest execution attempt (blocked precondition — no mutation)

| Field | Value |
| --- | --- |
| Packet | `CURSOR_PACK25_STATUS_ACTION_STAGING_LIVE_QA_FRESH_ROW_EXECUTION_ONLY` |
| Fresh QA row found | **YES** — exactly one by title |
| Precondition status observed | **`triage`** |
| Required precondition | **`submitted`** |
| First POST executed | **NO** |
| Staging mutation in latest run | **NO** |
| Result | **BLOCKED** — correct stop before POST |

---

## 4. Prior authorized live QA session (fresh QA row only — no secrets recorded)

### 4.1 Preflight (prior session)

| Check | Result |
| --- | --- |
| Target app | **`viona-api-staging-eu`** |
| Fresh QA row title match | **YES** |
| Legacy `triage` row avoided for action | **YES** |
| Precondition status | **`submitted`** |
| Baseline note count | **0** |
| Baseline status events | **0** |

### 4.2 First POST (prior session)

| Field | Value |
| --- | --- |
| Route | `POST /api/viona/requests/:id/actions/status` |
| Idempotency key | `pack25-status-liveqa-owner-submitted-triage-v1` |
| HTTP status | **201** |
| Transition applied | **`submitted` → `triage`** |
| `action.eventType` | **`action.status`** |
| `statusEventId` + `auditEventId` | **Present** |
| `idempotentReplay` | **false** |
| Note count after first POST | **0** (unchanged) |
| Legacy `triage` row modified | **NO** |

### 4.3 Idempotent replay (prior session)

| Field | Value |
| --- | --- |
| Same POST body + idempotency key replayed | **YES** |
| Expected HTTP status | **200** |
| Observed HTTP status | **400** |
| Observed error (safe label) | **`Invalid status transition`** |
| QA row status after replay attempt | **`triage`** (unchanged from first POST) |
| Duplicate status events from replay | **NO** (replay did not succeed) |

---

## 5. Root cause hypothesis (code review — not fixed in this pack)

In `src/services/viona/vionaRequestStatusActionService.ts`, function `transitionVionaRequestStatus`:

| Step | Behavior |
| --- | --- |
| 1 | Loads request row; `fromStatus` = **current** row status |
| 2 | Validates `isPack25AllowedTransition(fromStatus, targetStatus)` — only **`submitted` → `triage`** |
| 3 | Idempotency short-circuit via existing `action.status` audit event runs **after** step 2 |

**Hypothesis:** After the first successful transition, the row status is **`triage`**. On replay with the same idempotency key, `fromStatus` is **`triage`** and `targetStatus` is **`triage`**, so step 2 fails with `invalid_transition` **before** the idempotency replay path can return HTTP **200** with `idempotentReplay: true`.

**Expected fix direction (future separate authorization):** When a matching idempotency audit event exists for the same `requestId`, `idempotencyKey`, and `targetStatus`, return idempotent replay **before** Pack25 transition validation that assumes `fromStatus === submitted`.

---

## 6. Gate verdict

| Gate | Verdict |
| --- | --- |
| Owner-only first transition (`submitted` → `triage`) | **PASS** |
| Status event + audit event on first transition | **PASS** |
| Note count unchanged | **PASS** |
| Legacy row untouched | **PASS** |
| Idempotent replay (same key) | **FAIL** |
| Full live QA packet closure (201 + 200) | **BLOCKED** until fix + redeploy |

---

## 7. Safety attestations (this docs pack)

| Check | Result |
| --- | --- |
| Live QA re-run in this pack | **NO** |
| Status endpoint called with auth | **NO** |
| Staging data mutated in this pack | **NO** |
| Row reset/rollback performed | **NO** |
| Request rows created/seeded | **NO** |
| Notes submitted | **NO** |
| Assign/confirm/cancel/payment/booking/SOS/wallet/live AI | **NO** |
| Deploy/restart performed | **NO** |
| DB/Prisma/Supabase/SQL commands run | **NO** |
| Secrets printed | **NO** |
| `.env*` changed | **NO** |
| Code changed in this pack | **NO** |
| Prisma schema/migrations changed | **NO** |
| Pack26 opened | **NO** |

---

## 8. Next recommended gate

**Separate bugfix authorization** to reorder idempotency replay handling in `transitionVionaRequestStatus` (replay short-circuit before transition validation when matching audit exists), then:

1. **Staging redeploy** authorization (if required for fix availability)
2. **Replay-only live QA** on current fresh QA row (`triage`) with key `pack25-status-liveqa-owner-submitted-triage-v1` — expect **200**
3. Optionally **new `submitted` QA row** + full **201 + 200** packet if operator requires end-to-end re-run

Pack26 remains **not opened**.
