# Pack19 evidence — scoped submitted-row status triage staging QA

## Baseline

| Field | Value |
|-------|--------|
| **Source master** | `origin/master @ b218ca4` |
| **Full hash** | `b218ca4e2f67ce34682b5394aed911a1c2bf4f6d` |
| **Branch** | `qa/pack19-scoped-submitted-row-status-triage-qa` |
| **Packet ID** | `CURSOR_PACK19_SCOPED_SUBMITTED_ROW_STATUS_TRIAGE_QA_BOUNDED` |
| **Operator phrase** | `APPROVE_PACK19_SCOPED_SUBMITTED_ROW_STATUS_TRIAGE_QA` |

## Purpose

Bounded staging QA for Pack19 controlled status transition **`submitted → triage`** on **`viona-api-staging-eu`**. Docs-only result record; no Kernel/Handoff changes in this pack.

## Staging target and auth

| Item | Value |
|------|--------|
| Target label (non-secret) | **`viona-api-staging-eu`** / **`viona-api-staging-eu.fly.dev`** |
| Authentication | **YES** — User A roster login (`POST /api/auth/login`) |
| Auth secret redaction | **YES** — PIN length verified only; token/header values **not** logged |
| Secrets/tokens printed | **NO** |

## Safe request selection

| Item | Value |
|------|--------|
| Method | `GET /api/viona/requests` → exclude hold row `ec9a8b69-8a60-45aa-99ba-fc805a101dcc` → require `status === submitted` |
| Pack25 hold row avoided | **YES** |
| Submitted precondition check | **FAIL** — no non-hold `submitted` row visible |
| Status target | **None** — status POST not authorized without precondition |

## Endpoint / method QA matrix

| Method | Route | Result |
|--------|--------|--------|
| GET | `/api/viona/requests` (unauth) | **401** PASS |
| GET | `/api/viona/requests` (auth) | **200** PASS — count **3**, `safety.readOnly: true` |
| GET | `/api/viona/requests/:id` | **NOT RUN** — no safe candidate |
| POST | `/api/viona/requests/:id/actions/status` (`targetStatus: triage`) | **NOT RUN** — blocked |

## Results

| Item | Value |
|------|--------|
| **Result classification** | **`BLOCKED_NO_SAFE_SUBMITTED_REQUEST`** |
| Status POST | **NOT RUN** |
| GET refresh after status | **NOT RUN** |
| Controlled transition `submitted → triage` | **NOT CONFIRMED** |

## Attestations

| Check | Value |
|-------|--------|
| No row create/seed | **YES** |
| No Pack29 | **YES** |
| No execution | **YES** |
| No DB/Prisma/Supabase/SQL | **YES** |
| No deploy/restart | **YES** |
| No secrets printed | **YES** |
| No note POST | **YES** |
| Status target limited to `triage` | **YES** (N/A — POST not run) |
| At most one status POST | **YES** (zero executed) |

## Checks run (post-docs)

| Check | Result |
|-------|--------|
| `git status --short` | **PASS** — only allowed docs staged |
| `git diff --check` | **PASS** |
| forbidden paths safety grep on diff | **PASS** — 0 forbidden paths |
| `node scripts/viona-pack18-controlled-write-check.mjs` | **PASS** |
| `node scripts/viona-pack17-read-only-inbox-check.mjs` | **PASS** |
| `node scripts/viona-forbidden-claims-check.mjs` | **PASS** |
| `node scripts/viona-forbidden-claims-check.mjs --strict` | **PASS** |
| `node scripts/viona-pack26b-action-registry-check.mjs` | **PASS** |
| `node scripts/viona-pack26c-audit-timeline-contract-check.mjs` | **PASS** |
| `node scripts/viona-pack26d-operator-approval-check.mjs` | **PASS** |
| `node scripts/viona-pack27-execution-lane-check.mjs` | **PASS** |
| `node scripts/viona-pack28-execution-integration-readiness-check.mjs` | **PASS** |
| `node scripts/viona-pack16-read-only-api-check.mjs` | **PASS** |
| `npx tsc --noEmit` | **PASS** |
| `npm run smoke` | **PASS** |
| conflict marker grep | **PASS** |
