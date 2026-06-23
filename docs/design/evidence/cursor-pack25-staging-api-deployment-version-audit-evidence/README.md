# Pack25 evidence — staging API deployment/version audit

## Baseline

| Field | Value |
|-------|--------|
| **Base** | `origin/master @ cb2ae4b` |
| **Branch** | `docs/pack25-staging-api-deployment-version-audit-evidence` |
| **Audit ID** | `CURSOR_PACK25_STAGING_API_DEPLOYMENT_VERSION_AUDIT_READ_ONLY_NO_SECRET` |
| **Pack** | Pack25 staging API deployment/version audit evidence (docs-only) |

## Summary

| Item | Value |
|------|--------|
| Operating Protocol read | **YES** |
| Docs-only | **YES** |
| Audit mode | **Read-only** |
| Current repo contains Pack16 list/detail routes | **YES** |
| Current repo contains Pack20 note action route | **YES** |
| Server route mount confirmed in repo | **YES** |
| Staging app identity | **`viona-api-staging-eu`** |
| Deployed exact commit SHA | **UNKNOWN** |
| Route-era inference | **Pre-Pack16 likely** |
| Last documented deploy | **2026-05-23** @ `1daf006` |
| Likely cause of viona list 404 | **Outdated staging deployment** |
| Pack24 failed | **NO** |
| Pack26 opened | **NO** |
| Live operator sign-off | **Pending** |
| All non-note write/actions blocked | **YES** |

## Live probe (no secrets)

| Probe | Result |
| --- | --- |
| `GET /health` | **200** |
| `GET /api/viona/requests` (unauth) | **404** — generic Express fallback |
| `GET /api/wallet/balance` (unauth) | **401** — route mounted |

## Safety

| Check | Result |
| --- | --- |
| Secrets printed/inspected | **NO** |
| `.env*` modified | **NO** |
| Deployment performed | **NO** |
| Fly restart performed | **NO** |
| Server/API code changed | **NO** |
| DB/Prisma/Supabase/SQL commands run | **NO** |
| Deployment execution pack created | **NO** |

## Files changed

| Action | Path |
| --- | --- |
| Created | `docs/product/VIONA_REQUEST_PACK25_STAGING_API_DEPLOYMENT_VERSION_AUDIT_EVIDENCE.md` |
| Created | `docs/design/evidence/cursor-pack25-staging-api-deployment-version-audit-evidence/README.md` |

## Checks run

| Check | Result |
| --- | --- |
| `git diff --check` (`cb2ae4b..staged`) | **PASS** |
| Forbidden paths safety grep | **PASS** — docs only |
| `node scripts/viona-forbidden-claims-check.mjs` | **PASS** |
| `node scripts/viona-forbidden-claims-check.mjs --strict` | **PASS** |
| `npx tsc --noEmit` | **PASS** |
| `npm run smoke` | **PASS** |
| Conflict grep | **PASS** — none |

**HEAD:** `cb2ae4b` (base; docs staged, not committed)

## Recommendation

**A) Safe to open PR** — records read-only deployment/version audit; root cause is outdated staging deployment on `viona-api-staging-eu`, not Pack24 failure. Next lane: **deployment authorization packet (docs-only)** + **route health check plan**; **no deploy/restart** until explicit authorization.
