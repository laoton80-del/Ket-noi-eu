# Pack18 evidence — controlled write staging QA

## Baseline

| Field | Value |
|-------|--------|
| **Source master** | `origin/master @ 1c8dc21` |
| **Full hash** | `1c8dc21f9b493b225e6287c148acaf6ff91a7891` |
| **Branch** | `qa/pack18-controlled-write-staging-qa` |
| **Packet ID** | `CURSOR_PACK18_CONTROLLED_WRITE_STAGING_QA_BOUNDED` |
| **Operator phrase** | `APPROVE_PACK18_CONTROLLED_WRITE_STAGING_QA` |

## Purpose

Bounded staging QA for Pack18 controlled write behavior against **`viona-api-staging-eu`** — POST note + conditional POST status (`triage` only), with GET list/detail refresh. Docs-only result record; no Kernel/Handoff changes in this pack.

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
| Method | `GET /api/viona/requests` → exclude hold row `ec9a8b69-8a60-45aa-99ba-fc805a101dcc` |
| Pack25 hold row avoided | **YES** |
| Note target | First non-hold visible row (uuid len **36**, id **not recorded**) |
| Status target | **None** — no non-hold **`submitted`** row visible |

## Endpoint / method QA matrix

| Method | Route | Result |
|--------|--------|--------|
| GET | `/api/viona/requests` (unauth) | **401** PASS |
| GET | `/api/viona/requests` (auth) | **200** PASS — count **3** |
| POST | `/api/viona/requests/:id/actions/note` | **201** PASS |
| GET | `/api/viona/requests/:id` (after note) | **200** PASS |
| POST | `/api/viona/requests/:id/actions/status` (`triage`) | **SKIPPED** |

## Results

| Item | Value |
|------|--------|
| **Result classification** | **`PASS_CONTROLLED_WRITE_NOTE_ONLY_STATUS_SKIPPED`** |
| Note POST | **PASS** — HTTP **201**, `action.note`, `noteActionOnly: true` |
| Status POST | **SKIPPED** — `STATUS_QA_SKIPPED_NO_SAFE_SUBMITTED_REQUEST` |
| Controlled write confirmed | **YES** |
| Unauthorized writes observed | **NO** |
| Pack29 observed | **NO** |
| Execution observed | **NO** |

## Safety attestations

| Item | Record |
|------|--------|
| DB/Prisma/Supabase/SQL run | **NO** |
| Deploy/restart | **NO** |
| Staging row create/delete | **NO** |
| `.env*` changed | **NO** |
| Secrets printed | **NO** |

## Checks run

| Check | Result |
| --- | --- |
| `git status --short` | **PASS** |
| `git diff --check` | **PASS** |
| Forbidden paths safety grep | **PASS** |
| `node scripts/viona-pack18-controlled-write-check.mjs` | **PASS** |
| `node scripts/viona-pack17-read-only-inbox-check.mjs` | **PASS** |
| `node scripts/viona-forbidden-claims-check.mjs` (+ `--strict`) | **PASS** |
| Pack26B/C/D, Pack27, Pack28, Pack16 checks | **PASS** |
| `npx tsc --noEmit` | **PASS** |
| `npm run smoke` | **PASS** |
| Conflict marker grep | **PASS** |

## Recommendation

**Safe to open PR** — docs-only staging QA result. Next: Kernel/Handoff sync recording Pack18 staging QA PASS.
