# Pack15C evidence — DB apply pre-apply planning packet

## Baseline

| Field | Value |
| --- | --- |
| **Base** | `origin/master @ 0a7d1a2` |
| **Base commit message** | `docs(requests): record Pack15B DB apply approval (#80)` |
| **Branch** | `viona/cursor-request-pack15c-db-apply-pre-apply-planning-packet-docs-only` |
| **Pack** | Pack15C — docs-only DB apply pre-apply planning packet |

## Reason

Pack15B recorded human DB apply readiness approval (PR #80). Pack15C planning documents the exact command plan, environment requirements, backup/restore requirements, stop-on-error behavior, and post-apply verification plan — without running any DB command or applying the migration.

## Approval chain recorded

1. Pack15A — readiness packet (PR #79 @ `5196f8a`)
2. Pack15B — exact phrase recorded (PR #80 @ `0a7d1a2`)

```txt
APPROVED Pack15 DB apply readiness for the existing VIONA Request migration. I confirm DB apply may be planned next, but not performed in Pack15B.
```

## Scope

DB apply **planning only**. No DB apply. No Prisma DB commands. No schema/migration edit. No API, adapter, mutation, or runtime.

## Files created

| Action | Path |
| --- | --- |
| Created | `docs/product/VIONA_REQUEST_PACK15C_DB_APPLY_PRE_APPLY_PLANNING_PACKET.md` |
| Created | `docs/design/evidence/cursor-request-pack15c-db-apply-pre-apply-planning-packet/README.md` |

No `docs/product/README.md` existed; index not added.

## Migration target (read-only inspection)

- Folder: `prisma/migrations/20260615120000_add_viona_request_models/`
- File: `prisma/migrations/20260615120000_add_viona_request_models/migration.sql`
- Additive-only: enum + 6 tables + indexes + foreign keys; no DROP observed

## Requirements documented

| Requirement | Status in this pack |
| --- | --- |
| Target environment explicitly confirmed | Required before execution — not selected in repo |
| Backup/restore explicitly confirmed | Required before execution — checklist blank |
| Command plan documented | YES (`migrate status`, `migrate deploy` — not run) |
| Stop-on-error behavior | YES |
| Post-apply verification plan | YES |
| No runtime/API/mutation | YES |

## Current state flags

| Flag | Value |
| --- | --- |
| `pack15DbApplyApproved` | `true` |
| `pack15DbApplyPermitted` | `true` |
| `pack15DbApplyPlanningPacketActive` | `true` |
| `pack15DbApplyPerformed` | `false` |
| `dbApplied` | `false` |

## Docs-only confirmation

| Check | Result |
| --- | --- |
| Docs-only pack | YES |
| DB apply performed | NO |
| Prisma DB commands run | NO |
| Prisma schema changed | NO |
| Migration file changed | NO |
| `.env` changed | NO |
| Product/runtime files changed | NO |
| API / mutation / runtime | NO |
| Payment / booking / SOS / wallet / live AI | NO |
| OPERATOR Prisma/Auth | NO |
| Readiness config flags changed | NO |

## Safety boundaries

- No fake production claims added
- No DB apply claim (current `dbApplied: false`)
- No secrets or `.env` touched
- Aligns with `docs/ai-context/VIONA_OPERATING_PROTOCOL.md`

## Checks run

Recorded by Cursor executor before commit:

- `git status -sb`
- `git diff --name-only origin/master..HEAD`
- `git diff --stat origin/master..HEAD`
- `git diff --check`
- Safety grep on diff paths
- `node scripts/viona-forbidden-claims-check.mjs`
- `node scripts/viona-forbidden-claims-check.mjs --strict`
- `npx tsc --noEmit`
- `npm run smoke`
- `git grep` conflict marker scan

## Recommendation

**A) Cursor read-only review branch** — Pack15C planning packet prepared; await explicit target environment and backup/restore confirmation before any execution-only DB apply pack.
