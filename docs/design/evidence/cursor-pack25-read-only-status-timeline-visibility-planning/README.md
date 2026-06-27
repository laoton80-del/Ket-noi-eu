# Pack25 evidence — read-only status / timeline visibility planning

## Baseline

| Field | Value |
| --- | --- |
| **Base** | `origin/master @ 93842ec` |
| **Branch** | `docs/pack25-read-only-status-timeline-visibility-planning` |
| **Packet ID** | `CURSOR_PACK25_READ_ONLY_STATUS_TIMELINE_VISIBILITY_PLANNING_DOCS_ONLY` |
| **Pack** | Pack25 read-only status/timeline visibility planning (docs-only) |

## Summary

| Item | Value |
| --- | --- |
| Operating Protocol read | **YES** |
| Docs-only | **YES** |
| Previous gate | Pack25 status action / idempotency **CLOSED / GREEN** |
| Planned scope | Read-only status badge + timeline/activity visibility |
| Implementation authorized | **NO** |
| Deploy / live QA / DB / Pack26 authorized | **NO** |
| New write actions / transitions | **NO** |
| Pack26 opened | **NO** |

## Product scope (planned)

- Status badge on live request detail
- Timeline/activity from existing `statusEvents` + `auditEvents`
- Surface `action.status` and existing `action.note` rows
- Preserve auth boundaries and API behavior
- UI-only default; backend only if separate read-only gap packet

## Deferred

Status write UI, assign/confirm/cancel, payment/booking/SOS/wallet/live AI, fresh E2E row, Pack26.

## Files changed

| Action | Path |
| --- | --- |
| Created | `docs/product/VIONA_REQUEST_PACK25_READ_ONLY_STATUS_TIMELINE_VISIBILITY_PLANNING.md` |
| Created | `docs/design/evidence/cursor-pack25-read-only-status-timeline-visibility-planning/README.md` |

## Checks run

| Check | Result |
| --- | --- |
| `git diff --check` | **PASS** |
| Forbidden paths safety grep | **PASS** — docs only |
| `node scripts/viona-forbidden-claims-check.mjs` | **PASS** |
| `node scripts/viona-forbidden-claims-check.mjs --strict` | **PASS** |
| `npx tsc --noEmit` | **PASS** |
| `npm run smoke` | **PASS** |
| Conflict grep | **PASS** — none |

## Recommendation

**A) Safe to open PR** — docs-only planning. Next: separate operator authorization for UI-only read-only visibility implementation.
