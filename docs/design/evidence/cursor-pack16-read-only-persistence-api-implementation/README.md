# Pack16 evidence — read-only persistence API implementation

## Baseline

| Field | Value |
|-------|--------|
| **Source master** | `origin/master @ 0117aab` |
| **Branch** | `feature/pack16-read-only-persistence-api-implementation` |
| **Packet ID** | `CURSOR_PACK16_READ_ONLY_PERSISTENCE_API_IMPLEMENTATION_STAGING_SAFE` |
| **Pack** | Pack16 read-only persistence API implementation (local verification only) |

## Operator authorization

| Item | Value |
|------|--------|
| Implementation phrase present | **YES** |
| Phrase | `APPROVE_PACK16_READ_ONLY_PERSISTENCE_API_IMPLEMENTATION_STAGING_SAFE` |
| Staging QA phrase (separate, not authorized here) | `APPROVE_PACK16_READ_ONLY_API_STAGING_QA` |

## Implementation status

| Item | Value |
|------|--------|
| Status | **`implemented_local_only`** |
| Endpoints | `GET /api/viona/requests`, `GET /api/viona/requests/:id` |
| Read-only | **YES** |
| Auth required | **YES** |
| Tenant/user scoped | **YES** |
| DB writes | **NO** |
| status POST | **NO** |
| Transitions | **NO** |
| Execution | **NO** |
| Pack17 opened | **NO** |
| Pack29 opened | **NO** |
| Staging QA run | **NO** |
| Staging endpoint calls | **NO** |

## Endpoint behavior

| Endpoint | Behavior |
|----------|----------|
| `GET /api/viona/requests` | JWT-authenticated list; scoped via requester/owner/participant; optional filters + pagination; safe empty array |
| `GET /api/viona/requests/:id` | JWT-authenticated detail; 404 when row not visible to caller; no cross-user leakage |

## Auth / scope behavior

- Router: `vionaRouter.use(authMiddleware)`
- Scope helper: `buildAuthorizedVionaRequestWhere(authUserId)` in `src/services/viona/vionaRequestAccessScope.ts`
- Unauthorized: HTTP 401 from controller when `req.authUserId` missing

## Read-only safety

- Read service uses `findMany` / `findFirst` only
- GET handlers do not call note/status write services
- Sensitive fields excluded from serializer select (`metadataJson`, contact email/phone, attachment storage keys)
- Response includes `VIONA_REQUEST_READ_SAFETY` flags

## Files changed (this pack)

| Action | Path |
| --- | --- |
| Created | `scripts/viona-pack16-read-only-api-check.mjs` |
| Created | `scripts/test-viona-read-only-persistence-api.ts` |
| Created | `docs/product/VIONA_REQUEST_PACK16_READ_ONLY_PERSISTENCE_API_IMPLEMENTATION.md` |
| Created | `docs/design/evidence/cursor-pack16-read-only-persistence-api-implementation/README.md` |

Runtime GET endpoints verified on baseline master (not re-authored in this pack diff).

## Safety

| Check | Result |
| --- | --- |
| DB/Prisma/Supabase/SQL commands run in this pack | **NO** |
| Staging/auth/data mutation | **NO** |
| Secrets printed | **NO** |
| Prisma schema/migration changed | **NO** |
| `.env*` modified | **NO** |
| Pack17/29 opened | **NO** |

## Local checks

| Check | Result |
| --- | --- |
| `git status --short` | **PASS** — only allowed Pack16 files |
| `git diff --check` | **PASS** |
| Forbidden paths safety grep | **PASS** |
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

**Safe to open PR** — Pack16 read-only persistence API foundation verified locally; staging QA remains a separate gate.

**Next step after merge:** Post-merge verification; staging QA blocked until `APPROVE_PACK16_READ_ONLY_API_STAGING_QA`.
