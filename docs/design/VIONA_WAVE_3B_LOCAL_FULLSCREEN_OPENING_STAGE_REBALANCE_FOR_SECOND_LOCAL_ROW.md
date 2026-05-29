# VIONA WAVE 3B — Local Fullscreen Opening Stage Rebalance (Second Local Row)

**Task:** `VIONA.WAVE_3B.LOCAL_FULLSCREEN_OPENING_STAGE_REBALANCE_FOR_SECOND_LOCAL_ROW.1`

## Root cause

At **1366×768 browser fullscreen**, the opening-stage first-view lock computed a hero max of **382px** but the **hero floor** (`HERO_MIN − 48`) prevented the budget from shrinking further. Combined with:

- 6px hero → kicker gap
- 16px kicker band (12 + 4)
- 180px flagship card min height
- 24px cards → Local cho bạn bridge
- 16px below-fold buffer (intended to hide panel title)

…the opening stack consumed ~**666px** below the command rail, leaving only ~**102px** for the Local cho bạn panel — enough for the title and **one** pill row, not two.

## Changes (fullscreen desktop only)

| Constant | Before | After | Delta |
| --- | ---: | ---: | ---: |
| Hero max cap trim | 0 | **−38px** from cap (504→476) | −38px |
| Hero floor offset | 48 | **92** (floor 382→338) | −44px effective max at 1366×768 |
| Hero → kicker gap | 6px | **4px** | −2px |
| Kicker → grid gap | 4px | **2px** | −2px |
| Cards → Local cho bạn | 24px | **12px** | −12px |
| Below-fold buffer | 16px | **4px** | −12px budget |
| Flagship card min height | 180px | **168px** | −12px |
| Stage root bottom margin | 16px | **8px** (fullscreen) | −8px |
| For You panel reserve (budget) | 132px | **148px** | +16px (accurate 2-row reserve) |
| Hero lock min guard | 360px | **332px** (fullscreen) | fixes lock disabling at 350px |

**Net opening-stage reduction at 1366×768 fullscreen:** hero **382→348px** (−34px) + **~28px** spacing/card trims ≈ **62px** total.

## Files changed

- `src/components/viona/local/LocalOpeningStageLayout.tsx` — fullscreen budget + spacing
- `src/components/viona/local/LocalHeroCardsRow.tsx` — fullscreen kicker gap + card min height
- `scripts/capture-local-fullscreen-opening-stage-rebalance.mjs`
- `docs/design/evidence/wave-3b-local-fullscreen-opening-stage-rebalance/*`

## Intentionally untouched

Home, routes, handlers, SOS, payment/wallet/AI/auth, `LocalQuickActionsRow` pill sizing, mobile/tablet non-fullscreen layouts.

## Evidence

Run: `$env:EXPO_CAPTURE_PORT=8093; node scripts/capture-local-fullscreen-opening-stage-rebalance.mjs`
