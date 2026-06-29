# Pack25 evidence — controlled status-action UI planning

## Baseline

| Field | Value |
| --- | --- |
| **Base** | `origin/master @ 6221a99` |
| **Branch** | `docs/pack25-controlled-status-action-ui-planning` |
| **Packet ID** | `CURSOR_PACK25_CONTROLLED_STATUS_ACTION_UI_PLANNING_DOCS_ONLY` |

## Gate context

| Item | Value |
| --- | --- |
| Operating Protocol read | **YES** |
| Docs-only | **YES** |
| Pack25 status action / idempotency replay | **CLOSED / GREEN** |
| Pack25 read-only visibility | **CLOSED / GREEN** |
| Pack25 manual UI check | **CLOSED / GREEN** — PR #174 |
| Direction B tile parity | **CLOSED / GREEN** — PR #176, #177 |
| Controlled status-action UI implementation | **NOT authorized** |
| Pack26 opened | **NO** |

## Planning scope (recorded)

| Item | Plan |
| --- | --- |
| Transition | **`submitted` → `triage` only** |
| Actor | Owner-authenticated, owner-action only |
| API | Existing `POST /api/viona/requests/:id/actions/status` |
| UI surface | Request detail (`VionaRequestLiveDetailReadOnly`) near status badge / Timeline |
| Idempotency | Client key; replay-safe; no duplicate events |
| New backend | **Only if gap proven** — separate auth |
| New transitions | **NO** |

## Visibility rules (summary)

| Status | UI |
| --- | --- |
| `submitted` (owner) | Show action |
| `triage` | Hide or disabled-safe — no button |
| Unknown / non-owner | Hide |

## Authorization ladder (future)

1. Planning packet — **this pack**
2. Implementation authorization — **separate**
3. UI implementation — **separate**
4. Post-merge verify — **separate**
5. Staging redeploy — **if needed, separate**
6. Live QA — **separate operator phrase**

## Deferred

Status-action UI implementation, new transitions, assign/confirm/cancel, payment/booking/SOS/wallet/live AI, backend changes unless gap proven, deploy/bundle refresh, **Pack26**.

## Files changed (this pack)

| Action | Path |
| --- | --- |
| Created | `docs/product/VIONA_REQUEST_PACK25_CONTROLLED_STATUS_ACTION_UI_PLANNING.md` |
| Created | `docs/design/evidence/cursor-pack25-controlled-status-action-ui-planning/README.md` |

## Checks run

| Check | Result |
| --- | --- |
| `git diff --check` | **PASS** |
| Forbidden paths safety grep | **PASS** — docs only |
| `viona-forbidden-claims-check.mjs` | **PASS** |
| `viona-forbidden-claims-check.mjs --strict` | **PASS** |
| `npx tsc --noEmit` | **PASS** |
| `npm run smoke` | **PASS** |
| Conflict grep | **PASS** — none |

## Recommendation

**A) Safe to open PR** — docs-only planning. Do not authorize implementation, deploy, live QA, mutation beyond planned scope, or Pack26 without explicit operator authorization.
