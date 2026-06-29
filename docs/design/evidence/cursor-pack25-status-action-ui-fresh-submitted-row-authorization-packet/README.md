# Pack25 evidence — status-action UI fresh submitted row authorization packet

## Baseline

| Field | Value |
|-------|--------|
| **Base** | `origin/master @ 736e260` |
| **Branch** | `docs/pack25-status-action-ui-fresh-submitted-row-authorization-packet` |
| **Packet ID** | `CURSOR_PACK25_STATUS_ACTION_UI_FRESH_SUBMITTED_ROW_AUTHORIZATION_PACKET_DOCS_ONLY` |
| **Pack** | Pack25 status-action UI fresh submitted row authorization (docs-only) |

## Summary

| Item | Value |
|------|--------|
| Operating Protocol read | **YES** |
| Docs-only | **YES** |
| Authorization packet prepared | **YES** |
| Verified master | **`736e260`** |
| Target environment | **Staging only** |
| Purpose | Exactly one `VionaRequest` in **`submitted`** for Pack25 status-action **UI visual QA** |
| Visual pass blocker | Owner-auth pass **PARTIAL** — both inbox rows **`triage`**; positive `submitted` affordance check **BLOCKED** |
| Row creation executed | **NO** |
| DB/data approval granted | **NO** |
| Visual pass re-run granted | **NO** |
| Status action click/POST granted | **NO** |
| Pack26 opened | **NO** |

## Current blocker

Pack25 controlled status-action UI implementation is **GREEN** on `736e260`. Owner-authenticated read-only visual pass confirmed **`triage`** rows hide the action at 390 / 768 / 1440px. No **`submitted`** row exists for positive affordance confirmation. Existing **`triage`** rows must not be reset — fresh scoped **`submitted`** visual-QA row required.

## Safety

| Check | Result |
| --- | --- |
| Secrets printed/inspected | **NO** |
| `.env*` modified | **NO** |
| Deployment performed | **NO** |
| DB/Prisma/Supabase/SQL commands run | **NO** |
| Prisma schema/migrations changed | **NO** |
| Server/API/UI code changed | **NO** |
| Staging endpoint called in this packet | **NO** |
| Authentication performed in this packet | **NO** |
| Status endpoint called | **NO** |
| Notes submitted | **NO** |
| Request rows created/seeded/reset | **NO** |

## Files changed

| Action | Path |
| --- | --- |
| Created | `docs/product/VIONA_REQUEST_PACK25_STATUS_ACTION_UI_FRESH_SUBMITTED_ROW_AUTHORIZATION_PACKET.md` |
| Created | `docs/design/evidence/cursor-pack25-status-action-ui-fresh-submitted-row-authorization-packet/README.md` |

## Recommendation

**Safe to open PR** — docs-only authorization packet; does **not** create row, run DB, re-run visual pass, or authorize status POST. Next: separate operator execution authorization for staging-only single-row insert/ensure, then post-create verification evidence, then separate read-only visual pass re-run authorization.
