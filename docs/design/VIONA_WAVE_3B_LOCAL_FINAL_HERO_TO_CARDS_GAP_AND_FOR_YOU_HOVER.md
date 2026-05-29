# VIONA WAVE 3B — Local Final Hero-to-Cards Gap + For You Hover

**Task:** `VIONA.WAVE_3B.LOCAL_FINAL_HERO_TO_CARDS_GAP_AND_FOR_YOU_HOVER.1`

## Part A — Hero-to-card gap

**Issue:** At 1366×768 fullscreen, hero + cards looked cohesive but **Local cho bạn** title sat on the viewport fold — half on-screen, half below — looking unfinished.

**Fix:** Increase **visual** gap between dynamic hero and “Bắt đầu tại đây” without changing hero or card heights:

| Constant | Before | After |
| --- | ---: | ---: |
| `LOCAL_OPENING_STAGE_FULLSCREEN_HERO_TO_CARD_GAP_PX` (layout margin) | 4px | **16px** (+12px) |
| `LOCAL_OPENING_STAGE_FULLSCREEN_HERO_TO_CARD_LOCK_GAP_PX` (budget lock) | — | **4px** (unchanged) |

Splitting visual gap from lock budget keeps **dynamic hero max height identical** while pushing the card row + Local cho bạn down ~12px.

## Part B — Local For You hover

Retained prior utility hover stack (rim/glass/icon/motion/sheen) and added **label brighten on hover/focus** for Home-like feedback without hero-card strength.

## Files changed

- `src/components/viona/local/LocalOpeningStageLayout.tsx`
- `src/components/viona/local/LocalQuickActionsRow.tsx`

## Evidence

`$env:EXPO_CAPTURE_PORT=8093; node scripts/capture-local-final-hero-assets.mjs`
