# VIONA Request Engine — Pack25 Status Action Idempotency Replay Live QA PASS Evidence

**Document type:** Replay-only staging live QA PASS evidence (docs-only — records prior authorized sessions; no live QA re-run in this pack).
**Packet ID:** `CURSOR_PACK25_STATUS_ACTION_IDEMPOTENCY_REPLAY_LIVE_QA_PASS_EVIDENCE_DOCS_ONLY`
**Baseline:** `origin/master @ 32b90aa` — `fix(pack25): handle status action idempotent replay before transition validation (#166)`.
**Staging deploy:** Fly release **v12** from `origin/master @ 32b90aa`.
**Related:** `docs/product/VIONA_REQUEST_PACK25_STATUS_ACTION_PARTIAL_LIVE_QA_REPLAY_BUG_EVIDENCE.md`, `docs/product/VIONA_REQUEST_PACK25_FRESH_SCOPED_STATUS_QA_ROW_EXECUTION_EVIDENCE.md`, `docs/product/VIONA_REQUEST_PACK25_STATUS_ACTION_STAGING_REDEPLOY_EXECUTION_EVIDENCE.md`, `src/services/viona/vionaRequestStatusActionService.ts`

---

## 1. Evidence summary

| Field | Value |
| --- | --- |
| Operating Protocol read | **YES** |
| Docs-only evidence pack | **YES** |
| Verified master | **`32b90aa`** |
| Target app | **`viona-api-staging-eu`** |
| Staging release | **Fly v12** |
| Deployed commit | **`origin/master @ 32b90aa`** |
| Owner auth used in QA | **YES** — secrets redacted |
| QA row title | **`Pack25 status QA scoped request — submitted-to-triage live QA`** |
| First transition gate (prior session) | **GREEN** — HTTP **201** |
| Same-key replay gate (this session) | **GREEN** — HTTP **200** |
| Full Pack25 idempotency replay gate | **GREEN** |
| Pack26 opened | **NO** |

**This evidence pack records** replay-only live QA PASS after bugfix redeploy. It does **not** re-run live QA, call the status endpoint, mutate staging data, deploy, or change code.

---

## 2. Prior gate progression

| Prior gate | Status |
| --- | --- |
| Pack25 status action API | **GREEN** (PR #159) |
| Staging redeploy (initial route) | **GREEN** (PR #160) |
| Fresh QA row execution evidence | **GREEN** (PR #163) |
| First live QA (fresh row) | **GREEN** — HTTP **201**, `submitted` → `triage` |
| Replay bug evidence | **GREEN** (PR #165) — replay **400** before fix |
| Idempotency replay order bugfix | **GREEN** (PR #166 @ `32b90aa`) |
| Staging redeploy after bugfix | **GREEN** — Fly **v12** @ `32b90aa` |
| Replay-only live QA | **GREEN** — HTTP **200**, `idempotentReplay: true` |

---

## 3. Operator execution authorization (record only)

Replay-only live QA was authorized by a **separate explicit operator message** in-session, scoped to:

| Constraint | Required |
| --- | --- |
| Staging-only | **YES** |
| Target app `viona-api-staging-eu` only | **YES** |
| Fly release v12 from `32b90aa` | **YES** |
| Exactly one owner-authenticated replay POST | **YES** |
| Existing fresh QA row only | **YES** |
| Same idempotency key as first POST | **YES** |
| No deploy / restart | **YES** |
| No row create/seed/reset/rollback | **YES** |
| No DB/Prisma/Supabase/SQL | **YES** |
| No secrets printed | **YES** |
| Pack26 not opened | **YES** |

---

## 4. Preflight (prior authorized replay-only session — no secrets recorded)

| Check | Result |
| --- | --- |
| Target app | **`viona-api-staging-eu`** |
| `GET /health` | **200** |
| Owner auth | **YES** — pilot owner; token/PIN redacted |
| QA row found by title | **YES** — exactly **1** match |
| Legacy `triage` row avoided | **YES** — `Pack25 pilot scoped request — live QA` not selected |
| Precondition status | **`triage`** |
| Baseline note count | **0** |
| Baseline status event count | **1** |
| Baseline `action.status` audit count | **1** |

---

## 5. First transition (prior authorized session — record only)

| Field | Value |
| --- | --- |
| Route | `POST /api/viona/requests/:id/actions/status` |
| Idempotency key | `pack25-status-liveqa-owner-submitted-triage-v1` |
| HTTP status | **201** |
| Transition applied | **`submitted` → `triage`** |
| `action.eventType` | **`action.status`** |
| `idempotentReplay` | **false** |
| Note count after first POST | **0** |

---

## 6. Replay-only execution (prior authorized session after bugfix redeploy)

| Field | Value |
| --- | --- |
| Route | `POST /api/viona/requests/:id/actions/status` |
| Idempotency key | `pack25-status-liveqa-owner-submitted-triage-v1` |
| `clientCorrelationId` | `pack25-status-liveqa-owner-submitted-triage-v1` |
| `targetStatus` | **`triage`** |
| HTTP status | **200** |
| `idempotentReplay` | **true** |
| Response transition | **`submitted` → `triage`** (from stored audit metadata) |
| `action.eventType` | **`action.status`** |
| Duplicate status event created | **NO** |
| Duplicate audit event created | **NO** |

---

## 7. Post-replay verification (prior session)

| Check | Result |
| --- | --- |
| Post-replay row status | **`triage`** |
| Post-replay note count | **0** |
| Status event count | **1 → 1** (unchanged) |
| `action.status` audit count | **1 → 1** (unchanged) |
| Duplicate status event | **NO** |
| Duplicate audit event | **NO** |
| Legacy `triage` row modified | **NO** |
| Immediate post-replay detail fetch | One **429** rate limit observed |
| Read-only backoff detail fetch | Confirmed counts; **no additional POST** required |

---

## 8. Gate verdict

| Gate | Verdict |
| --- | --- |
| Owner-only first transition (`submitted` → `triage`) | **GREEN** — HTTP **201** (prior session) |
| Same-key idempotent replay | **GREEN** — HTTP **200**, `idempotentReplay: true` |
| No duplicate status/audit events on replay | **GREEN** |
| Note count unchanged | **GREEN** — **0** |
| Legacy row untouched | **GREEN** |
| **Full Pack25 idempotency replay gate** | **GREEN** |

---

## 9. Safety attestations (this docs pack)

| Check | Result |
| --- | --- |
| Deploy/restart in this evidence pack | **NO** |
| Live QA re-run in this evidence pack | **NO** |
| Status endpoint called in this evidence pack | **NO** |
| Authenticated calls in this evidence pack | **NO** |
| Staging data mutated in this evidence pack | **NO** |
| Request rows created/seeded/reset/rollback in this evidence pack | **NO** |
| DB/Prisma/Supabase/SQL commands run | **NO** |
| Secrets/JWT/PIN/Auth headers/database URLs printed | **NO** |
| `.env*` changed | **NO** |
| Code changed in this evidence pack | **NO** |
| Prisma schema/migrations changed | **NO** |
| Notes submitted | **NO** |
| Assign/confirm/cancel touched | **NO** |
| Payment/booking/SOS/wallet/live AI touched | **NO** |
| Production deploy | **NO** |
| Pack26 opened | **NO** |

---

## 10. Next recommended step

1. **Merge this evidence pack** and run post-merge verify on master.
2. **Mark Pack25 status action idempotency replay gate closed** — no further code, deploy, or QA required for this gate unless the operator explicitly wants a fresh end-to-end row (`submitted` → `triage` → replay on a new scoped row).

Pack26 remains **not opened**.
