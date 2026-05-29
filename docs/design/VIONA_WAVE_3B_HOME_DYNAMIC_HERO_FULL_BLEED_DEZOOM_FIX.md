# VIONA WAVE 3B — Home Dynamic Hero Full-Bleed De-zoom Fix

**Task:** `VIONA.WAVE_3B.HOME_DYNAMIC_HERO_FULL_BLEED_DEZOOM_FIX.1`

## Root cause

Prior de-zoom applied `transform: scale(0.91–0.94)` on the hero image while the clip container stayed full size. Scale below 1 shrinks the rendered image inside the frame, exposing empty gutters on left/right (and top/bottom).

## Fix

- Remove all hero `transform: scale` below 1
- Keep `objectFit: cover`, `width/height: 100%`, `absoluteFillObject` clip
- De-zoom / composition via **objectPosition only** per world

## Per-world objectPosition (full-bleed)

| World | Position (normal) | vs prior broken pass |
| --- | --- | --- |
| default | 52% 38% | no scale |
| local | 58% 40% | no scale |
| travel | 62% 42% | no scale |
| academy | 54% 38% | no scale |
| business | 60% 40% | no scale |

Fullscreen: X −1% (min 50%).

## Evidence

```powershell
$env:EXPO_CAPTURE_PORT=8093; node scripts/capture-home-dynamic-hero-full-bleed-dezoom-fix.mjs
```
