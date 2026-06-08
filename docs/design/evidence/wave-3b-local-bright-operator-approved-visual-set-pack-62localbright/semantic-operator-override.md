# Semantic operator override — Pack 62LOCALBRIGHT_APPROVE

**Pack:** `VIONA.WAVE_3B.LOCAL_BRIGHT_OPERATOR_APPROVED_SET.GOVERNANCE_PACK_62LOCALBRIGHT_APPROVE`
**Operator decision date:** 2026-06-08
**Scope:** Local Bright web-normal 62localbright asset set only

## Previous classification

The source folder was named:

```
_superseded-semantic-fail-do-not-wire
```

Automated semantic hue audit previously classified this set as **FAIL** (wrong expected accent families in baked imagery vs governance bands).

## Operator override (this pack only)

| Item | Decision |
|------|----------|
| Semantic auto-audit | **Downgraded to WARN** |
| Blocker status | **Removed for visual approval** |
| Final wire authority | **Operator visual sign-off** |

## Operator review basis

The operator reviewed in-app screenshots from the superseded A/B preview pack (`wave-3b-local-bright-superseded-ab-preview-pack-62localbright`) and **preferred this set** over the previous final set because:

- Higher hover hero brightness and editorial premium feel
- Stronger full-bleed cinematic photography on START HERE hover keys
- Better perceived in-app quality on desktop and laptop viewports
- Text readability remains acceptable with existing left scrim + copy shadows (unchanged code)

## What is NOT affected

This override is **visual asset governance only**. It does **not** change or imply:

| Surface | Status |
|---------|--------|
| Fake production claims | **Not affected** — demo/lite/pilot labels unchanged |
| Payment capture / booking confirmed | **Not affected** |
| Auth / identity | **Not affected** |
| Booking fulfillment | **Not affected** |
| SOS dispatch / emergency outcomes | **Not affected** |
| Routes / navigation | **Not affected** |
| i18n strings | **Not affected** |
| Card click handlers / business logic | **Not affected** |

## Governance note

- WARN remains on record: automated semantic bands were not re-passed in this pack.
- Approved staging folder `_operator-approved-visual-set-62localbright/` is the canonical operator-approved copy.
- Prior `_superseded-semantic-fail-do-not-wire/` folder is **retained** for audit trail.
- Prior live backup `_backup-before-superseded-ab-preview-62localbright/` is **retained** for rollback.

## Authority

Operator explicit decision: visual quality outweighs automated semantic FAIL for Local Bright hero/card PNG assets in this wave.
