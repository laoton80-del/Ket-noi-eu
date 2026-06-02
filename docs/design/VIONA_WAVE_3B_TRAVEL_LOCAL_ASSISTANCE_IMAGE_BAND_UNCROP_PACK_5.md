# VIONA Wave 3B — Travel Local Assistance IMAGE_BAND_UNCROP PACK_5

**Task ID:** `VIONA.UI.TRAVEL.LOCAL_ASSISTANCE.IMAGE_BAND_UNCROP_HARD_FIX.PACK_5`

## Crop layer (Task 1)

| Layer | Control |
|-------|---------|
| **Visible image height** | `travelLocalConciergeSceneShellHeight()` → `conciergeSceneShell` `{ height }` |
| Image fill | `travelLocalConciergeSceneWebBackgroundStyle` / `travelExperienceSceneImageStyle` — `absoluteFill`, `cover` |
| Clip parent | `conciergeSceneShell` `overflow: 'hidden'` (clips to shell height only) |
| **Not** the crop driver | `localConciergeGlassShell` `minHeight` (outer panel; image band independent) |
| Removed shallow feel | `localDiscoveryCategoryScrim` **42%** bottom gradient → **30%** dock-only scrim |

## Pack 5 heights

| Viewport | Pack 4 scene | Pack 5 scene |
|----------|--------------|--------------|
| 1366 desktop normal | 292px | **412px** (+120) |
| 1366 fullscreen | 268px | **360px** |
| 768 tablet | 228px | **300px** |
| 390 mobile | 180px | **212px** |

## Focal

Landscape desktop: **58% 45%** (was 60% 48%).

## Category dock

Chips in `localDiscoveryCategoryBottomDock` at scene bottom with `localDiscoveryCategoryDockInner` glass — not mid-image overlay.

Evidence: `docs/design/evidence/wave-3b-travel-local-assistance-image-band-uncrop-pack-5/`
