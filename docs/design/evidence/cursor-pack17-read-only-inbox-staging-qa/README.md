# Pack17 evidence — read-only inbox staging QA

## Baseline

| Field | Value |
| --- | --- |
| **Source master** | `origin/master @ a165ec8` |
| **Full hash** | `a165ec88dfb6d0adbe3ebcd07bbb1d882ea085c7` |
| **Branch** | `qa/pack17-read-only-inbox-staging-qa` |
| **Packet ID** | `CURSOR_PACK17_READ_ONLY_INBOX_STAGING_QA_BOUNDED` |
| **Pack** | Pack17 read-only inbox bounded staging QA |

## Operator authorization

| Item | Value |
| --- | --- |
| Staging QA phrase present | **YES** |
| Phrase | `APPROVE_PACK17_READ_ONLY_INBOX_STAGING_QA` |
| Pack17 status before QA | `implemented_local_read_only_inbox` |

## Staging target (non-secret)

| Item | Value |
| --- | --- |
| Target label | **`viona-api-staging-eu`** |
| Public host | **`viona-api-staging-eu.fly.dev`** |
| Target confirmed safely | **YES** — matches public runbooks |
| Pack17 inbox build | **YES** — master `@ a165ec8` + local Expo web route reachable; no separate deployed staging web host in runbooks |

## Auth (redacted)

| Item | Value |
| --- | --- |
| Authentication performed | **YES** |
| Method | Roster pilot User A — `POST /api/auth/login` (auth only) |
| PIN env configured | **YES** (`VIONA_PILOT_PIN` length ≥ 6; value **not logged**) |
| Secrets/tokens printed | **NO** |
| JWT recorded | **NO** |

## Inbox QA matrix

| # | Check | Method | Result |
| --- | --- | --- | --- |
| 1 | Health | `GET /health` | **PASS** — HTTP **200** |
| 2 | Unauth list guard | `GET /api/viona/requests?limit=50&skip=0` (no auth) | **PASS** — HTTP **401** |
| 3 | Auth list (inbox data) | `GET /api/viona/requests?limit=50&skip=0` | **PASS** — HTTP **200**, count **3**, `safety.readOnly` true |
| 4 | Auth detail | `GET /api/viona/requests/:id` | **PASS** — HTTP **200**, one visible list id (uuid len **36**, id not recorded), `safety.readOnly` true |
| 5 | VIONA methods observed | Network trace | **GET only** on `/api/viona/*` |
| 6 | Inbox route | `GET http://127.0.0.1:8081/viona-requests-live-inbox` | **PASS** — route **REACHABLE** |
| 7 | Write controls absent | Source scan inbox + detail screens | **PASS** — no Pack24/25 write tokens |
| 8 | Write controls absent | Initial HTML probe | **PASS** — no note/status/Send to review strings |

## UI state coverage

| State | Result |
| --- | --- |
| Loading | **PARTIAL** — present in source; not triggered in live probe |
| Empty | **NOT OBSERVED** — list non-empty |
| Unauthorized | **PASS** — unauth list **401** |
| Error/retry | **NOT TRIGGERED** — safe skip |

## Result

| Item | Value |
| --- | --- |
| Classification | **`PASS_READ_ONLY_INBOX_LIST_AND_DETAIL`** |
| Read-only confirmed | **YES** |
| DB writes | **NO** |
| status POST | **NO** |
| Transitions | **NO** |
| Execution | **NO** |
| Staging data mutated | **NO** |
| Pack24/25 write controls wired | **NO** |
| Pack29 opened | **NO** |

## Safety

| Check | Result |
| --- | --- |
| DB/Prisma/Supabase/SQL run | **NO** |
| Deploy/restart | **NO** |
| `.env*` modified | **NO** |
| Secrets printed | **NO** |
| POST/PATCH/PUT/DELETE on request routes | **NO** |

## Files changed (this pack)

| Action | Path |
| --- | --- |
| Created | `docs/product/VIONA_REQUEST_PACK17_READ_ONLY_INBOX_STAGING_QA_RESULT.md` |
| Created | `docs/design/evidence/cursor-pack17-read-only-inbox-staging-qa/README.md` |

## Checks run

| Check | Result |
| --- | --- |
| `git status --short` | **PASS** |
| `git diff --check` | **PASS** |
| Forbidden paths safety grep | **PASS** |
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
| Conflict marker grep | **PASS** |

## Recommendation

**Safe to open PR** — bounded read-only inbox staging QA **PASS**; no writes, status POST, transitions, execution, Pack24/25 wiring, or Pack29 opening.

**Next step after merge:** Kernel/Handoff sync recording Pack17 staging QA PASS.
