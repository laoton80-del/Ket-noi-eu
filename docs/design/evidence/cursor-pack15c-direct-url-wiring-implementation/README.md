# Pack15C evidence — direct URL wiring implementation (static-only)

## Baseline

| Field | Value |
|-------|--------|
| **Base** | `origin/master @ bbf1c8f` |
| **Base commit message** | `docs(requests): add Pack15C direct/session path design (#128)` |
| **Branch** | `viona/cursor-pack15c-direct-url-wiring-implementation-static-only` |
| **Pack** | Pack15C — static-only `directUrl` wiring |

## Purpose

Implement approved Pack15C direct/session path wiring: add `directUrl = env("DIRECT_URL")` to schema and generic `DIRECT_URL` placeholder in `.env.example`. **No DB commands**, **no migration changes**, **no model changes**.

## Implementation

| Item | Result |
|------|--------|
| `directUrl = env("DIRECT_URL")` added to schema | **YES** |
| `url = env("DATABASE_URL")` preserved | **YES** |
| `.env.example` `DIRECT_URL` placeholder added | **YES** |
| Prisma models changed | **NO** |
| Migrations changed | **NO** |
| `.env` / `.env.local` changed | **NO** |

## Status flags

| Flag | Value |
|------|--------|
| `pack15DirectSessionPathDesignPrepared` | `true` |
| `pack15DirectSessionPathImplemented` | `true` |
| `pack15DirectUrlWiredInSchema` | `true` |
| `pack15DirectUrlPlaceholderDocumented` | `true` |
| `pack15DbApplyRetryAuthorized` | `false` |
| `pack15DbApplyPerformed` | `false` |
| `dbApplied` | `false` |
| Pack15D/16/17 | blocked |

## Safety record

| Check | Result |
| --- | --- |
| DB commands run | **NO** |
| Secret values printed | **NO** |
| Real URL values printed | **NO** |
| DB reachability claimed fixed | **NO** |
| Retry authorized | **NO** |

## Files changed

| Action | Path |
| --- | --- |
| Modified | `prisma/schema.prisma` |
| Modified | `.env.example` |
| Created | `docs/product/VIONA_REQUEST_PACK15C_DIRECT_URL_WIRING_IMPLEMENTATION.md` |
| Created | `docs/design/evidence/cursor-pack15c-direct-url-wiring-implementation/README.md` |

## Checks run

| Check | Result |
| --- | --- |
| `git diff --check` | PASS |
| Allowed-files-only grep | PASS |
| `node scripts/viona-forbidden-claims-check.mjs` | PASS |
| `node scripts/viona-forbidden-claims-check.mjs --strict` | PASS |
| `npx tsc --noEmit` | PASS |
| `npm run smoke` | PASS |
| Conflict grep | PASS |

## Recommendation

**A) Safe to open PR** — static-only wiring; allowed files only; checks pass. Next: separately authorized retry pack after merge/verify.
