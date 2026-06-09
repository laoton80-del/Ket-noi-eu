# QA Report — Pack 62LOCALBRIGHT_APPROVE

**Pack:** `VIONA.WAVE_3B.LOCAL_BRIGHT_OPERATOR_APPROVED_SET.GOVERNANCE_PACK_62LOCALBRIGHT_APPROVE`
**Date:** 2026-06-08
**URL:** http://localhost:8094/local
**Scope:** Governance + approved staging for operator-approved Local Bright visual set

## Operator decision

Operator approved the superseded preview set as the new visual standard. Semantic auto-FAIL downgraded to WARN (documented in `semantic-operator-override.md`).

## Staging operations

| Step | Result |
|------|--------|
| Create `_operator-approved-visual-set-62localbright/` | PASS |
| Copy 9 live PNGs to approved folder | PASS |
| `APPROVAL_MANIFEST.md` in approved folder | PASS |
| Live SHA256 matches approved folder | PASS (0 files re-synced) |
| Approved SHA256 matches superseded source | PASS |

## Asset verification

| Check | Result |
|-------|--------|
| File count | 9/9 |
| Valid PNG | 9/9 |
| Masters 2590×607 | 5/5 PASS |
| Cards 1672×941 | 4/4 PASS |

## Runtime (unchanged)

| Check | Result |
|-------|--------|
| `heroDisplayMode` | `fullBleedCover` |
| Hover image switch | PASS |
| Hover copy switch | PASS |
| Routes / handlers | Unchanged |

## Screenshots

7 captures — see `screenshot-index.md`

## Script

```bash
node scripts/operator-approved-visual-set-pack-62localbright.mjs --port 8094
```

## Gates

| Gate | Result |
|------|--------|
| `git status -sb` | See final report |
| `git diff --stat` | See final report |
| `git diff --check` | PASS |
| `npx tsc --noEmit` | PASS |
| `npm run smoke` | PASS |
| Conflict marker grep | PASS |

## Scope compliance

Travel / Home / routes / i18n / auth / payment / booking / SOS / DB: **not modified**
