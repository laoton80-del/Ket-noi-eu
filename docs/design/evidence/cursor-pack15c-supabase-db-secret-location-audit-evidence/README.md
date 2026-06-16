# Pack15C evidence — Supabase DB secret location audit (no values)

## Baseline

| Field | Value |
| --- | --- |
| **Base** | `origin/master @ 5876b94` |
| **Base commit message** | `docs(kernel): sync handoff after Pack17 planning packet (#89)` |
| **Branch** | `viona/cursor-pack15c-supabase-db-secret-location-audit-evidence-docs-only` |
| **Pack** | Pack15C — docs-only Supabase DB secret location audit evidence |

## Purpose

Record the no-values read-only audit that located server-side DB secret **key names** without printing values, connecting to DB, or running Prisma/Supabase commands.

## Audit result summary

| Item | Result |
| --- | --- |
| `.env.local` | Present — all checked DB URL keys **MISSING** |
| `.env` | Present — `DATABASE_URL` **PRESENT**, `DIRECT_URL` **PRESENT** |
| Fly `viona-api-staging-eu` | `DATABASE_URL` **Deployed**, `DIRECT_URL` **Deployed** (names only) |
| Values printed | **NO** |
| `.env` modified | **NO** |
| DB connection | **NO** |
| DB apply | **NO** |
| Prisma command | **NO** |
| Supabase DB command | **NO** |

## Classification

- **A) LOCAL PRESENT** — `DATABASE_URL` / `DIRECT_URL` in `.env`
- **B) HOST SECRET NAME PRESENT** — same names on Fly staging

## Decision

| Item | Value |
| --- | --- |
| Pack15C DB secret presence | `PRESENT` by key name only |
| Secret value validity | `NOT VERIFIED` |
| Pack15C execution readiness | `NO-GO` |
| DB apply | **Blocked** |

## Files created

| Action | Path |
| --- | --- |
| Created | `docs/product/VIONA_REQUEST_PACK15C_SUPABASE_DB_SECRET_LOCATION_AUDIT_EVIDENCE.md` |
| Created | `docs/design/evidence/cursor-pack15c-supabase-db-secret-location-audit-evidence/README.md` |

No `docs/product/README.md` existed; index not added.

## Docs-only confirmation

| Check | Result |
| --- | --- |
| Docs-only pack | YES |
| No-values audit | YES |
| DB apply performed | NO |
| Prisma DB commands run | NO |
| Supabase DB commands run | NO |
| Prisma schema changed | NO |
| Migration file changed | NO |
| `.env` changed | NO |
| Product/runtime files changed | NO |
| UI/screens/components | NO |
| API/routes/controllers/server | NO |
| Payment/booking/SOS/wallet/live AI | NO |
| OPERATOR Prisma/Auth | NO |
| Secrets printed | NO |
| `.env` values inspected | NO |

## Checks run

- `git status -sb`
- `git diff --name-only origin/master..HEAD`
- `git diff --stat origin/master..HEAD`
- `git diff --check`
- Safety grep (forbidden paths)
- Secret-like tracked file observation (`git ls-files` pattern — values not inspected)
- `node scripts/viona-forbidden-claims-check.mjs`
- `node scripts/viona-forbidden-claims-check.mjs --strict`
- `npx tsc --noEmit`
- `npm run smoke`
- Conflict grep (`<<<<<<<`, `=======`, `>>>>>>>`)

No Prisma migration/apply/status commands were run.

## Recommendation

**A) Cursor read-only review branch** — Evidence packet records key-name presence only; Pack15C execution readiness remains NO-GO and DB apply remains blocked.
