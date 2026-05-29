# VIONA WAVE 3B — Home Dynamic Hero Full-Bleed Cinematic De-zoom Tuning

**Task:** `VIONA.WAVE_3B.HOME_DYNAMIC_HERO_FULL_BLEED_CINEMATIC_DEZOOM_TUNING.1`

## Root cause of previous inset/gutters

`transform: scale(0.91–0.94)` shrank the image layer inside a full-size clip → visible side gutters. Fixed in prior pass; this task tunes composition only.

## Current fit audit (before this tuning)

| Property | Value |
| --- | --- |
| Image width / height | `100%` / `100%` |
| objectFit | `cover` |
| transform / scale | **none** |
| Clip | `absoluteFillObject`, `overflow: hidden` |
| Hero frame aspect | `1280/540` (~2.37:1) |
| Most over-zoomed (historical) | **Travel** at opening-stage **84% 32%** |

## objectPosition tuning (composition-only)

| World | Before | After | Intent |
| --- | --- | --- | --- |
| default | 52% 38% | **48% 40%** | Wider city / constellation |
| local | 58% 40% | **54% 42%** | Street + family environment |
| travel | 62% 42% | **56% 44%** | More terminal architecture / space |
| academy | 54% 38% | **50% 40%** | Learner + room context |
| business | 60% 40% | **55% 42%** | Workspace / global context |

Fullscreen: X −1% (min 50%). No scale, contain, or inset.

## Asset note

If a source PNG is framed very tight, only objectPosition can adjust crop — not true optical de-zoom without new art.

## Evidence

```powershell
$env:EXPO_CAPTURE_PORT=8093; node scripts/capture-home-dynamic-hero-full-bleed-cinematic-dezoom-tuning.mjs
```
