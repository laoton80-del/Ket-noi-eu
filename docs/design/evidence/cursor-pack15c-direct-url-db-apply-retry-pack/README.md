# Pack15C evidence — direct URL DB apply retry pack (preparation)

## Baseline

| Field | Value |
|-------|--------|
| **Base** | `origin/master @ 662d743` |
| **Base commit message** | `feat(pack15c): wire Prisma directUrl for migration-safe path (#129)` |
| **Branch** | `viona/cursor-pack15c-direct-url-db-apply-retry-pack-prep-docs-only` |
| **Pack** | Pack15C — docs-only direct URL DB apply retry preparation |

## Purpose

Prepare a future execution-only DB apply retry packet using Prisma direct/session path via wired `directUrl = env("DIRECT_URL")`. Preparation only — **no DB commands**, **no retry authorization**.

## Direct URL wiring (PR #129)

| Item | State |
|------|--------|
| `url = env("DATABASE_URL")` | wired |
| `directUrl = env("DIRECT_URL")` | wired |
| `.env.example` placeholder | documented |
| DB apply performed | NO |

## Future commands (NOT RUN)

| # | Command |
|---|---------|
| 1 | `npx prisma migrate status` |
| 2 | `npx prisma migrate deploy` |
| 3 | post-apply `npx prisma migrate status` |

Expected: Prisma uses `DIRECT_URL` for migrate CLI; `DATABASE_URL` remains runtime/pooler.

## Status flags

| Flag | Value |
|------|--------|
| `pack15DirectSessionPathImplemented` | `true` |
| `pack15DirectUrlWiredInSchema` | `true` |
| `pack15DirectUrlPlaceholderDocumented` | `true` |
| `pack15DirectUrlDbApplyRetryPackPrepared` | `true` |
| `pack15DirectUrlDbApplyRetryAuthorized` | `false` |
| `pack15DbApplyPerformed` | `false` |
| `dbApplied` | `false` |
| Pack15D/16/17 | blocked |

## Files changed

| Action | Path |
| --- | --- |
| Created | `docs/product/VIONA_REQUEST_PACK15C_DIRECT_URL_DB_APPLY_RETRY_PACK.md` |
| Created | `docs/design/evidence/cursor-pack15c-direct-url-db-apply-retry-pack/README.md` |

## Docs-only confirmation

| Check | Result |
| --- | --- |
| Docs-only pack | YES |
| `schema.prisma` changed | NO |
| `.env*` changed | NO |
| Kernel/handoff untouched | YES |
| DB commands run | NO |
| Secret/URL values printed | NO |
| Retry authorized | NO |
| Pack15D/16/17 touched | NO |

## Checks run

| Check | Result |
| --- | --- |
| `git diff --check` | PASS |
| Safety grep (forbidden paths in branch diff) | PASS |
| `node scripts/viona-forbidden-claims-check.mjs` | PASS |
| `node scripts/viona-forbidden-claims-check.mjs --strict` | PASS |
| `npx tsc --noEmit` | PASS |
| `npm run smoke` | PASS |
| Conflict grep | PASS |

## Recommendation

**A) Safe to open PR** — docs-only retry preparation; not safe to execute DB retry or Pack15D yet.
