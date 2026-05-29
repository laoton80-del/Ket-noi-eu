# VIONA WAVE 3B — Local Web Normal and Fullscreen Stage Branch Fix

**Task:** `VIONA.WAVE_3B.LOCAL_WEB_NORMAL_AND_FULLSCREEN_STAGE_BRANCH_FIX.1`

## Root cause

The hide-peek pass applied `LOCAL_OPENING_STAGE_FULLSCREEN_FOR_YOU_BRIDGE_PX = 156` to **fullscreen visual layout** to hide “Local cho bạn” at 1366×768. That problem was mainly **normal web** (title peek with only 20px bridge). Fullscreen already reserves For You panel space via `bottomReserve` in the lock budget — the 156px visual bridge pushed Local For You completely below the fold.

Both modes shared `forYouBridgeDesktopLock` when `desktopStageLock` was true, and fullscreen overrode with the excessive 156px constant.

## Branch detection

- `openingStageFullscreen` prop from `LocalScreen.tsx`: `desktopWeb && isFullscreen` (browser Fullscreen API).
- Lock formula branches on `isFullscreen` in `computeLocalOpeningStageFirstViewLock`.
- Visual bridge now branches: `!openingStageFullscreen` → normal web; `openingStageFullscreen` → fullscreen.

## Constants (after fix)

| Constant | Normal web | Fullscreen |
| --- | ---: | ---: |
| Hero → label gap (visual) | 6px (`FASHION_HOME_WEB_OPENING_STAGE_HERO_TO_CARD_GAP_PX`) | 16px |
| Hero → label gap (lock) | 6px | 4px |
| Label → card gap | 4px | 2px |
| Card row min height | 180px | 160px |
| **Cards → Local For You (visual)** | **52px** | **6px** |
| Cards → Local For You (lock) | 20px | 6px |
| Below-fold buffer | 8px | 4px |
| For You panel reserve (lock) | 0 | 148px + dock air |

## Evidence

```powershell
$env:EXPO_CAPTURE_PORT=8093; node scripts/capture-local-final-hero-assets.mjs
```

- Normal web: `local-final-hero-assets-1366x768.png`
- Fullscreen: `local-final-hero-assets-1366x768-fullscreen.png`
