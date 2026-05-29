# VIONA WAVE 3B — Local Fullscreen Show Two For You Rows

**Task:** `VIONA.WAVE_3B.LOCAL_FULLSCREEN_SHOW_TWO_FOR_YOU_ROWS.1`

## Root cause

The opening-stage lock computed `heroMaxPx ≈ 338–348`, but `LocalDynamicHero` always set `minHeight: 430` (Home floor). When **minHeight > maxHeight**, React Native kept the hero at **430px**, consuming ~**70px** extra and clipping the second Local For You row.

## Fix

1. **`LocalDynamicHero`** — when `openingStageHeroMaxPx` is set, `minHeight = min(430, heroCap)` so the lock cap applies.
2. **`LocalOpeningStageLayout`** — align fullscreen chrome budget to measured **72px**; tighten cards→Local cho bạn bridge **12→8px**; minor lock trim/floor tune.

## Measured stack — 1366×768 fullscreen

| Segment | Before | After | Δ |
| --- | ---: | ---: | ---: |
| Chrome → hero top | 72px | 72px | — |
| Dynamic hero | **430px** | **338px** | **−92px** |
| Hero → kicker gap | 4px | 4px | — |
| Kicker + cards row | 182px | 182px | — |
| Cards → Local cho bạn | 12px | **8px** | **−4px** |
| Local cho bạn panel top | 700px | **604px** | **−96px** |
| Row 2 bottom vs viewport | **+70px overflow** | **742px (−26px air)** | **2 rows visible** |

## Files changed

- `src/components/viona/local/LocalDynamicHero.tsx`
- `src/components/viona/local/LocalOpeningStageLayout.tsx`
- `scripts/capture-local-final-hero-assets.mjs` (1366 fullscreen capture)
- `docs/design/evidence/wave-3b-local-final-hero-assets/*`

## Evidence

`$env:EXPO_CAPTURE_PORT=8093; node scripts/capture-local-final-hero-assets.mjs`

Key proof: `local-final-hero-assets-1366x768-fullscreen.png`
