# VIONA Request Engine — Pack30C Staging QA Execution-Plan-Preview Result

**Document type:** Bounded staging QA execution result (docs-only recording — QA was actually run against live staging; result is a safe STOP, not a pass, not a code failure).
**Packet ID:** `CURSOR_PACK30C_EXECUTION_PLAN_PREVIEW_STAGING_QA_BOUNDED`
**Packet name:** `VIONA_REQUEST_PACK30C_STAGING_QA_EXECUTION_PLAN_PREVIEW_RESULT`
**Source master:** `origin/master @ 5ee64c22b09e8fda785c77c0ead55f4e36375978` (`5ee64c2`) — PR #285.
**Branch:** `docs/pack30c-staging-qa-result`.
**Related:** `docs/ai-context/VIONA_OPERATING_PROTOCOL.md`, `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`, `docs/product/VIONA_REQUEST_PACK30C_STAGING_QA_AUTHORIZATION_PACKET.md`, `docs/product/VIONA_REQUEST_PACK30C_STAGING_QA_PHRASE_INTAKE.md`, `docs/product/VIONA_REQUEST_PACK29_EXECUTION_PREVIEW_STAGING_QA_RESULT.md` (precedent template), `scripts/test-viona-pack30c-staging-qa-execution-plan-preview.mjs` (QA script, this packet)

---

## 1. Result classification

**`BLOCKED_STAGING_ROUTE_MISSING_REDEPLOY_REQUIRED`**

Bounded staging QA against **`viona-api-staging-eu`** was **actually attempted** this session, using the operator-provided phrase's authorization. Preflight passed. Login and candidate discovery passed. The **first authenticated `POST` to the real `execution-plan-preview` path on a real, visible, owned request id returned HTTP `404`** — proving the Pack30B route is **not yet deployed** to staging. QA **stopped immediately and safely**, per the Pack30C QA plan's own stop-on-error rule (§6.1 / §6.6). This is **not** a pass. It is **not** a code defect in Pack30A/Pack30B. It is a **stale staging deployment**.

---

## 2. Operator authorization

| Item | Value |
| --- | --- |
| Operator staging QA phrase | `APPROVE_PACK30C_EXECUTION_PLAN_PREVIEW_STAGING_QA` |
| Phrase required | **YES** |
| Phrase provided | **YES** |
| Phrase recorded on master | **YES** (PR #284) |
| Canonical Kernel/Handoff sync of phrase | **YES** (PR #285) |
| Staging QA attempt authorized | **YES** — bounded, mock-only, stop-on-error (per Pack30C plan §6-§7) |
| Deploy/restart authorized | **NO** — not requested, not performed |
| Real execution authorized | **NO** |

---

## 3. Baseline and PR chain

| Item | Value |
| --- | --- |
| Current verified master | **`5ee64c22b09e8fda785c77c0ead55f4e36375978`** (`5ee64c2`) |
| Pack30C staging QA authorization PR #283 | **MERGED / VERIFIED PASS** — `PACK30C_STAGING_QA_AUTHORIZATION_PACKET_PREPARED_ONLY` |
| Pack30C staging QA approval phrase intake PR #284 | **MERGED / VERIFIED PASS** |
| Pack30C canonical Kernel/Handoff sync PR #285 | **MERGED / VERIFIED PASS** |
| PR chain #251 → #285 | **PRESERVED** |

---

## 4. Staging target and preflight

| Step | Request | Pass criterion | Observed |
| --- | --- | --- | --- |
| P1 | Target host | Exactly `viona-api-staging-eu.fly.dev` | **PASS** |
| P2 | `GET /health` | HTTP **200** | **200** |
| P3 | `GET /api/viona/requests` (no Authorization) | HTTP **401** (not 404) | **401** |
| P4 | `POST /api/viona/requests/<dummy-uuid>/actions/execution-plan-preview` (no Authorization) | HTTP **401** (not 404) | **401** |

| Item | Value |
| --- | --- |
| Preflight health | **200** |
| Preflight unauth list | **401** (not 404) |
| Preflight unauth execution-plan-preview (dummy id) | **401** (not 404) |
| Secrets printed | **NO** |

**Important caveat (why preflight alone was not sufficient):** All requests to any path under the Viona router pass through a router-level `authMiddleware` **before** Express attempts to match a specific route. This means an **unauthenticated** probe returns `401` regardless of whether the specific `execution-plan-preview` route is registered on the deployed build — it cannot by itself distinguish "route exists, auth failed" from "route does not exist on this deployment, auth failed first." Only an **authenticated** call against a real route can reveal a true `404` for a missing route. This is exactly what step 5 below revealed.

---

## 5. Candidate selection

| Item | Value |
| --- | --- |
| Discovery method | Authenticated `GET /api/viona/requests?limit=50` (roster persona **User A**; PIN from local env; never printed) |
| Visible rows | **4** |
| Selected candidate id (redacted) | **`5e759ca9…`** — same VionaRequest row used in the Pack29 execution-preview staging QA |
| Selected candidate status | **`triage`** |
| Pack25 hold row `ec9a8b69-8a60-45aa-99ba-fc805a101dcc` | **Excluded — not used** |
| Row create/seed | **NO** |
| Status mutation during selection | **NO** |

---

## 6. Execution-plan-preview QA call and stop

| Item | Value |
| --- | --- |
| Endpoint | `POST /api/viona/requests/5e759ca9…/actions/execution-plan-preview` |
| Request body (step 3a — deny-by-default) | `{}` |
| HTTP status observed | **404** |
| Expected (per plan, if deployed) | **200** with `action.plan.allowed: false`, `denialReason: 'missing_operator_approval'` |
| Stop-on-error triggered | **YES** — immediately after first call, per plan §6.1 / §6.6 |
| Classification | `BLOCKED_STAGING_ROUTE_MISSING_REDEPLOY_REQUIRED` |
| Further QA steps (3b, 3c, 4a, 5a) | **NOT RUN** — QA stopped at first call, as required |
| Real execution observed | **NO** — no plan/mock logic ever executed (request never reached the route handler) |
| External side effects observed | **NO** |
| Persistent audit write observed | **NO** |
| Request status mutation | **NO** |
| Deploy/restart performed | **NO** |

### Interpretation

The staging API (`viona-api-staging-eu`) is currently serving a build from **before** `2e1350b` (the Pack30B implementation commit, PR #282) — i.e. it does not yet contain the `execution-plan-preview` route at all. The Pack30A/Pack30B code itself is **unverified on staging either way**; this result says nothing about whether that code works — only that it has not yet reached the staging environment.

---

## 7. Negative and idempotency checks

| Check | Result |
| --- | --- |
| 3b — allowed mock-ready path | **NOT_TESTED** — QA stopped before this step |
| 3c — mock adapter invocation | **NOT_TESTED** — QA stopped before this step |
| 4a — idempotency replay | **NOT_TESTED** — QA stopped before this step |
| 5a — blocked safety label | **NOT_TESTED** — QA stopped before this step |
| 5b — blocked-status negative check | **NOT_TESTED** — QA stopped before this step |
| Reason | Stop-on-error triggered on the very first authenticated call (route 404) |

---

## 8. Explicit NO assertions

| Assertion | Value |
| --- | --- |
| Pack30C staging QA passed | **NO** |
| Production | **NO** |
| Deploy/restart | **NO** |
| DB / Prisma / Supabase / SQL | **NO** |
| Migration | **NO** |
| Schema change | **NO** |
| Seed/user creation | **NO** |
| `.env*` changes | **NO** |
| Secrets printed | **NO** |
| Runtime/source changes (repo) | **NO** |
| Package/lockfile changes | **NO** |
| Request creation | **NO** |
| Request status mutation | **NO** |
| Real execution | **NO** |
| External side effects | **NO** |
| Persistent audit write | **NO** |
| More than one authenticated execution-plan-preview POST | **NO** — exactly one attempted, which returned 404 |
| Payment/booking/SOS/live AI/merchant outbound/email/SMS/push | **NO** |

---

## 9. Files changed (this pack)

| Action | Path |
| --- | --- |
| Created | `scripts/test-viona-pack30c-staging-qa-execution-plan-preview.mjs` (QA script; reusable once staging is redeployed) |
| Created | `docs/product/VIONA_REQUEST_PACK30C_STAGING_QA_EXECUTION_PLAN_PREVIEW_RESULT.md` (this file) |
| Created | `docs/design/evidence/cursor-pack30c-staging-qa-execution-plan-preview-result/README.md` |

No other runtime/source files were changed. The QA script is a QA/evidence artifact (Node/`fetch`, HTTPS only, dotenv-loaded credentials, redaction helpers) — it does not modify any route, controller, service, or domain logic, and it was never wired into any application code path.

---

## 10. Next gate

1. **Do not** attempt any further staging QA from this result pack — the route is confirmed missing on the current staging deployment.
2. **Do not** deploy/restart staging from this pack — that requires a **separate, explicitly authorized** redeploy packet (matching the Pack29 precedent: authorization packet → phrase intake → Kernel/Handoff sync → redeploy execution result, each as its own bounded pack).
3. Prepare a **docs-only Kernel/Handoff sync** recording this blocked result (separate pack).
4. If/when the operator authorizes a staging redeploy of `viona-api-staging-eu` to source `5ee64c2` or later, **re-run this exact QA script** (`scripts/test-viona-pack30c-staging-qa-execution-plan-preview.mjs`) to attempt the full bounded QA sequence (§6.1–§6.6 of the authorization packet) for a real pass/fail result.
5. Pack30 **real execution remains blocked**. Production remains **not authorized**.

Evidence: `docs/design/evidence/cursor-pack30c-staging-qa-execution-plan-preview-result/README.md`
