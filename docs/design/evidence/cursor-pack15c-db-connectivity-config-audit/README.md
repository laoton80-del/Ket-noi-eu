# Pack15C evidence — DB connectivity config audit

## Baseline

| Field | Value |
|-------|--------|
| **Base** | `origin/master @ 474603d` |
| **Base commit message** | `docs(requests): record Pack15C DB apply retry stop-on-error result (#126)` |
| **Branch** | `viona/cursor-pack15c-db-connectivity-config-audit-docs-only` |
| **Pack** | Pack15C — no-values DB connectivity config audit (no DB commands) |

## Purpose

Audit which env keys and repo config route Prisma migrate/status/deploy, after repeated pooler `:6543` hang. Config audit only — **no DB apply**, **no Prisma/Supabase/SQL/DB commands**, **no secret inspection output**.

## Failure summary (preserved)

| Item | Result |
|------|--------|
| Pre-check `migrate status` | Hung >120s on pooler `:6543` |
| `migrate deploy` | NOT RUN |
| DB apply | NOT performed |

## Config audit findings

| Item | Finding |
|------|---------|
| `schema.prisma` URL key | `DATABASE_URL` only |
| `directUrl` in schema | **NO** |
| `prisma.config.ts` | **NO** |
| Prisma migrate uses | **`DATABASE_URL`** (not `DIRECT_URL` by default) |
| Pooler routing when `DATABASE_URL` is `:6543` | **YES** |
| Direct path in schema | **Not wired** |
| `DIRECT_URL` in operator `.env` | **PRESENT**; port class **`5432`** |
| `DATABASE_URL` in operator `.env` | **PRESENT**; port class **`6543`** |

## Package scripts (not executed)

| Script | Command |
|--------|---------|
| `db:migrate` | `prisma migrate dev` |
| `db:push` | `prisma db push` |
| `db:generate` | `prisma generate` |
| `db:validate` | `prisma validate` |
| `db:studio` | `prisma studio` |

No npm script for `migrate status` or `migrate deploy`.

## Secret safety

| Check | Result |
|-------|--------|
| URL values printed | **NO** |
| Host printed | **NO** |
| Credentials/tokens printed | **NO** |
| DB commands run | **NO** |

## Likely cause category

| Category | Applies |
|----------|-----------|
| Pooler used for migrate/status via `DATABASE_URL` | **YES** |
| Direct/session URL not wired in schema | **YES** |
| Network/VPN/IP allowlist | **Possible** (prior `P1001`; not re-tested) |

## Next retry planning

| Question | Answer |
|----------|--------|
| Next retry requires changed command/env plan? | **YES** (if avoiding pooler without fixing pooler) |
| Separate authorization required? | **YES** |

## Blockers

Pack15D / Pack16 / Pack17 remain blocked. DB apply not performed.

## Files changed

| Action | Path |
| --- | --- |
| Created | `docs/product/VIONA_REQUEST_PACK15C_DB_CONNECTIVITY_CONFIG_AUDIT.md` |
| Created | `docs/design/evidence/cursor-pack15c-db-connectivity-config-audit/README.md` |

## Docs-only confirmation

| Check | Result |
| --- | --- |
| Docs-only pack | YES |
| Kernel/handoff untouched | YES |
| Prisma/schema/migration files modified | NO |
| `.env*` modified | NO |
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

**A) Safe to open PR** — docs-only config audit; gate-clean. Next safe lane: human/operator connectivity remediation; separate authorization before any changed retry plan.
