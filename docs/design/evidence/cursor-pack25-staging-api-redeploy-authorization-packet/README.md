# Pack25 evidence — staging API redeploy authorization packet

## Baseline

| Field | Value |
|-------|--------|
| **Base** | `origin/master @ 04f25f1` |
| **Branch** | `docs/pack25-staging-api-redeploy-authorization-packet` |
| **Packet ID** | `CURSOR_PACK25_STAGING_API_REDEPLOY_AUTHORIZATION_PACKET_DOCS_ONLY` |
| **Pack** | Pack25 staging API redeploy authorization + route health check plan (docs-only) |

## Summary

| Item | Value |
|------|--------|
| Operating Protocol read | **YES** |
| Docs-only | **YES** |
| Authorization packet prepared | **YES** |
| Target app | **`viona-api-staging-eu`** |
| Target source | `origin/master @ 04f25f1` or later verified master at execution |
| Deployment execution performed | **NO** |
| Fly restart performed | **NO** |
| Pack24 failed | **NO** |
| Pack26 opened | **NO** |
| Live operator sign-off | **Pending** |
| All non-note write/actions blocked | **YES** |

## Route health check plan (post future deploy)

| Phase | Check | Pass |
| --- | --- | --- |
| A | `GET /health` | **200** |
| A | Unauth `GET /api/viona/requests` | **401** (not generic **404**) |
| B | Auth pilot `GET /api/viona/requests?limit=50&skip=0` | **200** scoped list or empty |
| C | Note POST route | Existence only (**401** unauth); no live note submit until B passes |

## Safety

| Check | Result |
| --- | --- |
| Secrets printed/inspected | **NO** |
| `.env*` modified | **NO** |
| Deployment performed | **NO** |
| Fly restart performed | **NO** |
| Server/API code changed | **NO** |
| DB/Prisma/Supabase/SQL commands run | **NO** |
| Deployment configs changed | **NO** |

## Files changed

| Action | Path |
| --- | --- |
| Created | `docs/product/VIONA_REQUEST_PACK25_STAGING_API_REDEPLOY_AUTHORIZATION_PACKET.md` |
| Created | `docs/design/evidence/cursor-pack25-staging-api-redeploy-authorization-packet/README.md` |

## Checks run

| Check | Result |
| --- | --- |
| `git diff --check` (`04f25f1..staged`) | **PASS** |
| Forbidden paths safety grep | **PASS** — docs only |
| `node scripts/viona-forbidden-claims-check.mjs` | **PASS** |
| `node scripts/viona-forbidden-claims-check.mjs --strict` | **PASS** |
| `npx tsc --noEmit` | **PASS** |
| `npm run smoke` | **PASS** |
| Conflict grep | **PASS** — none |

**HEAD:** `04f25f1` (base; docs staged, not committed)

## Recommendation

**A) Safe to open PR** — docs-only authorization packet; does **not** execute deploy. Next step after merge: operator issues **separate explicit execution authorization** before any Fly deploy/restart.
