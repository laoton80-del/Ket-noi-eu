# VIONA WAVE 3B — Local Final Hide For You Peek (Measured Stage Offset)

**Task:** `VIONA.WAVE_3B.LOCAL_FINAL_HIDE_FOR_YOU_PEEK_WITH_MEASURED_STAGE_OFFSET.1`

## Why previous change was not visible

The **hero→cards gap** (+12px visual) moved hero, cards, **and** Local cho bạn together. It did **not** increase distance **after** the 4 hero cards row, so the title stayed at the same viewport position relative to the fold.

Additionally, increasing `forYouBridge` in the **lock budget** accidentally shrank hero height (334px) because the same constant fed `computeLocalOpeningStageFirstViewLock`.

## Measured positions — BEFORE (1366×768 fullscreen)

| Segment | Top | Bottom | Height |
| --- | ---: | ---: | ---: |
| Viewport | — | **768** | 768 |
| Dynamic hero | 72 | 420 | **348** |
| “Bắt đầu tại đây” / cards row | 436 | 618 | 182 |
| Local For You panel | 624 | 771 | 147 |
| **Local cho bạn title** | **633** | **646** | **13px visible** |

Cards→For You gap: **6px** (too small; title on first screen).

## Fix

Split **visual** vs **lock** bridge (same pattern as hero gap):

| Constant | Role | Value |
| --- | --- | ---: |
| `LOCAL_OPENING_STAGE_FULLSCREEN_FOR_YOU_BRIDGE_PX` | Layout `marginTop` after cards | **156px** |
| `LOCAL_OPENING_STAGE_FULLSCREEN_FOR_YOU_BRIDGE_LOCK_PX` | Hero lock budget only | **6px** (unchanged) |

**Added offset after cards row:** **+150px** (6 → 156).

## Measured positions — AFTER

| Segment | Top | Bottom | Height |
| --- | ---: | ---: | ---: |
| Dynamic hero | 72 | 420 | **348** (unchanged) |
| Cards row | 436 | 618 | **182** (unchanged) |
| Local For You panel | **774** | 921 | 147 |
| Local cho bạn title | **783** | 796 | **0px visible** |

Title fully below viewport; first screen ends at hero cards.

## Local For You hover

Retained from prior pass (rim/glass/icon/motion/sheen + label brighten). No layout shift.

## Evidence

`$env:EXPO_CAPTURE_PORT=8093; node scripts/capture-local-final-hero-assets.mjs`
