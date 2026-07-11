# Evidence — Pack30C Staging QA Execution-Plan-Preview Result (BLOCKED — Redeploy Required)

**Packet ID:** `CURSOR_PACK30C_EXECUTION_PLAN_PREVIEW_STAGING_QA_BOUNDED`
**Product doc (canonical):** `docs/product/VIONA_REQUEST_PACK30C_STAGING_QA_EXECUTION_PLAN_PREVIEW_RESULT.md`
**Source master:** `origin/master @ 5ee64c22b09e8fda785c77c0ead55f4e36375978` (`5ee64c2`).
**Branch:** `docs/pack30c-staging-qa-result`.

---

## Result classification

**`BLOCKED_STAGING_ROUTE_MISSING_REDEPLOY_REQUIRED`**

QA was actually executed against the live `viona-api-staging-eu` target using the operator-authorized phrase. It stopped safely on the first authenticated call because the target route returns `404` on staging — the Pack30B code has not yet been deployed there.

---

## Confirmed state

| Item | Value |
|------|--------|
| Current verified master | **`5ee64c22b09e8fda785c77c0ead55f4e36375978`** (`5ee64c2`) |
| Staging target | **`viona-api-staging-eu.fly.dev`** |
| Route under test | **`POST /api/viona/requests/:id/actions/execution-plan-preview`** |
| Operator phrase | `APPROVE_PACK30C_EXECUTION_PLAN_PREVIEW_STAGING_QA` |
| Phrase required / provided / recorded | **YES / YES / YES** (PR #284, canonical-synced PR #285) |
| Preflight `/health` | **200** |
| Preflight unauth list | **401** (not 404) |
| Preflight unauth execution-plan-preview (dummy id) | **401** (not 404) |
| Login persona | **User A** (roster PIN, never printed) |
| Candidate id (redacted) | **`5e759ca9…`** (same row as Pack29 QA) |
| Candidate status | **`triage`** |
| Pack25 hold excluded | **YES** (`ec9a8b69…`) |
| Authenticated execution-plan-preview call count | **1** |
| HTTP status observed | **404** |
| Classification | **`BLOCKED_STAGING_ROUTE_MISSING_REDEPLOY_REQUIRED`** |
| Real execution | **NO** — route never reached handler logic |
| Request status mutation | **NO** |
| Deploy/restart performed | **NO** |

---

## Why unauthenticated preflight alone could not detect this

The Viona router applies `authMiddleware` to **every** request under its mount path before matching any specific route. An unauthenticated probe therefore always returns `401`, whether or not the specific `execution-plan-preview` route exists on the deployed build. Only an **authenticated** call against a real, visible request id can reveal a true `404` (route missing) versus a real `200`/business response. This QA script performs that authenticated check first, which is what caught the stale deployment.

---

## QA script (evidence artifact, reusable after redeploy)

`scripts/test-viona-pack30c-staging-qa-execution-plan-preview.mjs` — implements the full Pack30C QA plan §6.1–§6.6 (preflight, roster login + candidate discovery excluding the Pack25 hold row, deny-by-default, allowed mock-ready, mock adapter invocation, idempotency replay, negative safety-label check, and a final unchanged-status verification), with a stop-on-error guard at every stage. It stopped correctly at the first authenticated call in this run. No application code was modified; the script only makes outbound HTTPS calls to the already-live staging API using roster-approved login credentials, and never logs tokens, PINs, or Authorization headers.

---

## Explicit NO assertions (this pack)

| Assertion | Value |
|-----------|-------|
| Pack30C staging QA passed | **NO** |
| Production | **NO** |
| Deploy/restart | **NO** |
| Staging mutation | **NO** |
| Request creation | **NO** |
| Request status mutation | **NO** |
| Real execution | **NO** |
| External side effects | **NO** |
| Persistent audit write | **NO** |
| DB / Prisma / Supabase / SQL | **NO** |
| Runtime/source changes | **NO** |
| `.env*` changes | **NO** |
| Secrets printed | **NO** |
| Payment / booking / SOS / live AI / merchant outbound / email / SMS / push | **NO** |

---

## Safety (this pack)

| Check | Result |
| --- | --- |
| Staging-only target | **YES** — `viona-api-staging-eu` only |
| Bounded QA | **YES** — stopped after exactly one authenticated call |
| Docs + QA-script commit only | **YES** |
| Repo runtime/source (application) changes | **NO** |

---

## Files changed (this pack)

| Action | Path |
| --- | --- |
| Created | `scripts/test-viona-pack30c-staging-qa-execution-plan-preview.mjs` |
| Created | `docs/product/VIONA_REQUEST_PACK30C_STAGING_QA_EXECUTION_PLAN_PREVIEW_RESULT.md` |
| Created | `docs/design/evidence/cursor-pack30c-staging-qa-execution-plan-preview-result/README.md` |

---

## Next gate

1. Prepare a **docs-only Kernel/Handoff sync** recording this blocked result.
2. Do **not** run further QA from this result pack.
3. A **separate, explicitly authorized** staging redeploy packet for `viona-api-staging-eu` (target source `5ee64c2` or later) is required before this QA can produce a pass/fail result.
4. Pack30 **real execution remains blocked**; production remains **not authorized**.
