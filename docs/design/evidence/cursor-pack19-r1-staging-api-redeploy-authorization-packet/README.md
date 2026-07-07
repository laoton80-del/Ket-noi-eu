# Pack19 evidence — R1 staging API redeploy authorization packet

## Baseline

| Field | Value |
|-------|--------|
| **Source master** | `origin/master @ ef17d84` |
| **Full hash** | `ef17d848432321ae4429a49f8b06de2157da9850` |
| **Branch** | `docs/pack19-r1-staging-api-redeploy-authorization-packet` |
| **Endpoint implemented on master** | `POST /api/viona/requests` (PR #244) |
| **Target** | `viona-api-staging-eu.fly.dev` (staging only) |

## Purpose

Docs-only authorization packet for a **future staging-only redeploy** of `viona-api-staging-eu` so the merged `POST /api/viona/requests` route becomes available at runtime. **Records authorization intent only — no deploy performed.**

## Context

| Item | Value |
|------|--------|
| Endpoint on master | **`POST /api/viona/requests`** |
| Prior remediation execution result | **`BLOCKED_REMEDIATION_ERROR`** |
| Blocking reason | Staging returned **404** — merged route not deployed |
| Discovery at block | login 200, GET 200, 3 rows, 0 safe `submitted` |

## Future redeploy phrase

| Field | Value |
|-------|--------|
| Phrase required | **YES** |
| Phrase (verbatim) | `APPROVE_PACK19_R1_STAGING_API_REDEPLOY_FOR_CREATE_SUBMIT_ROUTE` |
| Phrase provided in this packet | **NO** |

## Result classification

**`PACK19_R1_STAGING_REDEPLOY_AUTHORIZATION_PACKET_PREPARED_ONLY`**

## Guardrails (this packet)

| Check | Result |
| --- | --- |
| Docs-only | **YES** |
| Exactly the two allowed files changed | **YES** |
| Source master recorded | **YES** — `ef17d84` |
| Deploy/restart performed | **NO** |
| Staging QA performed | **NO** |
| Row create/seed | **NO** |
| `POST /api/viona/requests` called | **NO** |
| Status POST | **NO** |
| DB/Prisma/Supabase/SQL run | **NO** |
| Schema change | **NO** |
| User creation | **NO** |
| `.env*` changed | **NO** |
| Production touched | **NO** |
| Pack29 opened | **NO** |
| Execution wired | **NO** |
| Future redeploy phrase required | **YES** |
| Future redeploy phrase provided | **NO** |
| Conflict markers present | **NO** |
| Secrets printed | **NO** |

## Files changed (this packet)

| Action | Path |
| --- | --- |
| Created | `docs/product/VIONA_REQUEST_PACK19_R1_STAGING_API_REDEPLOY_AUTHORIZATION_PACKET.md` |
| Created | `docs/design/evidence/cursor-pack19-r1-staging-api-redeploy-authorization-packet/README.md` |

## Forbidden paths (verified untouched)

`src/**`, `prisma/**`, `app/**`, `App.tsx`, `package.json`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `.env*` — **none changed**.

## Recommendation

**Safe to push branch** — docs-only authorization intent. Operator provides `APPROVE_PACK19_R1_STAGING_API_REDEPLOY_FOR_CREATE_SUBMIT_ROUTE` in a separate execution pack to authorize the staging-only redeploy. No Pack29, no execution wiring, no deploy in this packet.
