# Pack15C evidence — direct/session path design

## Baseline

| Field | Value |
|-------|--------|
| **Base** | `origin/master @ 9741c4c` |
| **Base commit message** | `docs(requests): add Pack15C DB connectivity config audit (#127)` |
| **Branch** | `viona/cursor-pack15c-direct-session-path-design-docs-only` |
| **Pack** | Pack15C — docs-only direct/session migration path design |

## Purpose

Design a safe direct/session Prisma migration path after connectivity config audit #127. Avoid pooler `:6543` for migrate/status/deploy; use `DIRECT_URL` `:5432` by key name only. Design only — **no schema change**, **no `.env*` change**, **no DB commands**.

## Audit context (PR #127)

| Finding | State |
|---------|--------|
| `DATABASE_URL` only in schema | YES |
| No `directUrl` | YES |
| Migrate uses pooler `:6543` today | YES |
| `DIRECT_URL` present, port `5432`, not wired | YES |
| Prior retry hung on pooler | YES |
| DB apply not performed | YES |

## Future implementation (not executed)

| Item | Proposed |
|------|----------|
| `directUrl = env("DIRECT_URL")` in schema | Future authorized pack |
| `DIRECT_URL` placeholder in `.env.example` | Future authorized pack |
| Keep `DATABASE_URL` for runtime/pooler | YES |

## Status flags

| Flag | Value |
|------|--------|
| `pack15DirectSessionPathDesignPrepared` | `true` |
| `pack15DirectSessionPathImplemented` | `false` |
| `pack15DirectUrlWiredInSchema` | `false` |
| `pack15DbApplyRetryAuthorized` | `false` |
| `pack15DbApplyPerformed` | `false` |
| `dbApplied` | `false` |
| `pack15DVerificationExecuted` | `false` |
| Pack16 / Pack17 | blocked |

## Files changed

| Action | Path |
| --- | --- |
| Created | `docs/product/VIONA_REQUEST_PACK15C_DIRECT_SESSION_PATH_DESIGN.md` |
| Created | `docs/design/evidence/cursor-pack15c-direct-session-path-design/README.md` |

## Docs-only confirmation

| Check | Result |
| --- | --- |
| Docs-only pack | YES |
| Schema changed | NO |
| `.env*` changed | NO |
| Kernel/handoff untouched | YES |
| DB commands run | NO |
| Secret/URL values printed | NO |
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

**A) Safe to open PR** — docs-only direct/session path design; gate-clean. Next after merge/verify: separately authorized implementation pack to wire `directUrl`.
