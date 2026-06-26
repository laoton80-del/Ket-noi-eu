# Pack25 evidence — status action partial live QA replay bug

## Baseline

| Field | Value |
|-------|--------|
| **Base** | `origin/master @ 4781e17` |
| **Runtime deployed** | `origin/master @ 3d2d827` |
| **Branch** | `docs/pack25-status-action-partial-live-qa-replay-bug-evidence` |
| **Packet ID** | `CURSOR_PACK25_STATUS_ACTION_PARTIAL_LIVE_QA_REPLAY_BUG_EVIDENCE_DOCS_ONLY` |
| **Pack** | Pack25 partial live QA + idempotency replay bug evidence (docs-only) |

## Summary

| Item | Value |
|------|--------|
| Operating Protocol read | **YES** |
| Docs-only | **YES** |
| Target app | **`viona-api-staging-eu`** |
| Latest run | **BLOCKED** — row already `triage`; no POST |
| Prior first POST | **201** — `submitted` → `triage` |
| Prior replay | **400** — `Invalid status transition` |
| Idempotency key | `pack25-status-liveqa-owner-submitted-triage-v1` |
| First-transition path | **PASS** |
| Replay gate | **FAIL/BLOCKED** |
| Note count | **0** unchanged |
| Legacy row modified | **NO** |
| Pack26 opened | **NO** |

## Root cause hypothesis

Idempotency replay short-circuit in `transitionVionaRequestStatus` runs **after** `isPack25AllowedTransition`, so replay on an already-`triage` row fails before idempotent return.

## Safety

| Check | Result |
| --- | --- |
| Secrets printed/inspected | **NO** |
| `.env*` modified | **NO** |
| Live QA re-run in this pack | **NO** |
| Status endpoint called with auth | **NO** |
| Staging data mutated | **NO** |
| DB/Prisma/Supabase/SQL commands run | **NO** |
| Code changed in this pack | **NO** |

## Files changed

| Action | Path |
| --- | --- |
| Created | `docs/product/VIONA_REQUEST_PACK25_STATUS_ACTION_PARTIAL_LIVE_QA_REPLAY_BUG_EVIDENCE.md` |
| Created | `docs/design/evidence/cursor-pack25-status-action-partial-live-qa-replay-bug-evidence/README.md` |

## Checks run

| Check | Result |
| --- | --- |
| `git diff --check` (`4781e17..staged`) | **PASS** |
| Forbidden paths safety grep | **PASS** — docs only |
| `node scripts/viona-forbidden-claims-check.mjs` | **PASS** |
| `node scripts/viona-forbidden-claims-check.mjs --strict` | **PASS** |
| `npx tsc --noEmit` | **PASS** |
| `npm run smoke` | **PASS** |
| Conflict grep | **PASS** — none |

**HEAD:** `4781e17` (base; docs staged, not committed)

## Recommendation

**A) Safe to open PR** — docs-only partial QA + replay bug record. Next: **separate bugfix authorization**, redeploy, replay-only QA.
