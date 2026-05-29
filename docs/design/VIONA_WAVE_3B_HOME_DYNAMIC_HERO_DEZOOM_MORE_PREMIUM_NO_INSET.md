# VIONA WAVE 3B — Home Dynamic Hero De-zoom More Premium (No Inset)

**Task:** `VIONA.WAVE_3B.HOME_DYNAMIC_HERO_DEZOOM_MORE_PREMIUM_NO_INSET.1`

## Root cause — remaining over-zoom feeling

1. **Historical anchor:** Opening stage used **84% 32%** for all worlds — aggressive right/subject crop on a ~2.37:1 frame.
2. **Cover physics:** Local/Academy/Business heroes are **1280×428** (~2.99:1); frame is **1280/540** (~2.37:1). `object-fit: cover` crops heavily; only **objectPosition** shifts which slice is visible.
3. **Prior inset bug:** `transform: scale(0.91–0.94)` shrank the layer — fixed; must not repeat.

## Fit rules (unchanged)

- `width/height: 100%`, `objectFit: cover`, `maxWidth: 100%`
- **No** scale, contain, or inset
- Clip: `absoluteFillObject` + `overflow: hidden`

## objectPosition tuning (this pass)

| World | Prior | Now | Intent |
| --- | --- | --- | --- |
| default | 48% 40% | **44% 42%** | Wider city constellation |
| local | 54% 42% | **48% 44%** | More street/environment |
| travel | 56% 44% | **50% 46%** | Terminal architecture + journey |
| academy | 50% 40% | **46% 42%** | Learning environment |
| business | 55% 42% | **50% 44%** | Office/global context |

Fullscreen: X −1% (min 50%).

## Asset replacement

**None.** Travel already uses `viona-home-travel-hero-daylight-1600x520.png` (widest travel hero in repo). No wider Local/Academy/Business living-hero assets available — composition-only tuning.

## Evidence

```powershell
$env:EXPO_CAPTURE_PORT=8093; node scripts/capture-home-dynamic-hero-dezoom-more-premium-no-inset.mjs
```
