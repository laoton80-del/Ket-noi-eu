# VIONA WAVE 3B — Home Fullscreen For You Compact Height

**Task:** `VIONA.WAVE_3B.HOME_FULLSCREEN_FOR_YOU_COMPACT_HEIGHT.1`

## Audit — 1366×768 fullscreen vertical stack

| Region | Before (normal pill sizing in fs) | After (compact fs branch) |
| --- | ---: | ---: |
| Header / command chrome | ~72–112px measured (72px dock-fit floor) | unchanged |
| Dynamic hero height | ~430–452px (layout engine; hero math untouched) | unchanged |
| World cards row | ~180px (`FASHION_HOME_WEB_WORLD_CARD_ROW_ESTIMATE_PX`) | unchanged |
| Hero → world cards gap | 4px (`FULLSCREEN_DOCK_FIT_CARD_GAP_PX`) | unchanged |
| Stage → For You dock gap | 6px (`FULLSCREEN_DOCK_FIT_DOCK_GAP_PX`) | unchanged |
| For You strip padding V | 10+10px | **8+8px** |
| For You pill row height | 58px min × 2 + 8px gap ≈ **124px** grid | **46px** min × 2 + 6px gap ≈ **98px** grid |
| For You dock total (est.) | ~144px (strip + grid) | ~**114px** (strip + grid) |
| Second For You row | tight / bottom air squeezed | both rows visible with ~6px viewport air |

Normal web @1366×768 keeps **58px** pills, hub title visible, no compact branch.

## Root cause

Fullscreen opening stage reserves **124px** hub dock budget while pills rendered at **58px** min height + 8px row gap + 10px strip padding — ~**144px** actual dock. That overshoot squeezed the second For You row against the viewport bottom at **1366×768**.

## Fix (fullscreen only)

| Token | Normal | Fullscreen |
| --- | ---: | ---: |
| Pill minHeight | 58px | **46px** (−12px) |
| Pill paddingVertical | 8px | **5px** |
| Icon capsule | 36×36 | **32×32** |
| Content gap | 10px | **8px** |
| Grid row gap | 8px | **6px** |
| Strip padding V | 12px (fashion) / 10px (fs override) | **8px** |

Label: **16px / 21px** unchanged. Hover/glass/rim unchanged.

Branch: `webOpeningStageFullscreen` only — not normal web, not Local.

## Evidence

```powershell
$env:EXPO_CAPTURE_PORT=8093; node scripts/capture-home-fullscreen-for-you-compact-height.mjs
```
