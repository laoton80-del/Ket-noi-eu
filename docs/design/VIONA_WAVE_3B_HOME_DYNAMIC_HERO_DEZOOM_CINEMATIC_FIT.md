# VIONA WAVE 3B — Home Dynamic Hero De-zoom Cinematic Fit

**Task:** `VIONA.WAVE_3B.HOME_DYNAMIC_HERO_DEZOOM_CINEMATIC_FIT.1`

## Before (audit)

| Property | Value |
| --- | --- |
| objectFit | `cover` (web) |
| objectPosition (opening stage) | **84% 32%** — all worlds via `fashionHomeWebOpeningStageHeroImageStyle` |
| objectPosition (legacy crossfade) | **40% 38%** — all worlds |
| Hero frame aspect | `1280/540` (`FASHION_HOME_DESKTOP_HERO_ASPECT`) |
| Transform scale on hero | **none** (world cards had 1.02 — not hero) |
| Negative inset on hero image | **none** — `absoluteFillObject` clip |
| Most zoomed | **Travel** at 84% X + tight cover on 1600×520 airport portrait |

## After

Per-world `HOME_LIVING_HERO_CINEMATIC_FIT` in `HomeScreen.tsx`:

| World | objectPosition | scale |
| --- | --- | ---: |
| default | 56% 40% | 0.94 |
| local | 62% 42% | 0.93 |
| travel | 66% 44% | **0.91** |
| academy | 58% 40% | 0.93 |
| business | 64% 42% | 0.93 |

Fullscreen: X −1% (min 50%). Clip overflow unchanged; left scrim + semantic frame untouched.

## Evidence

```powershell
$env:EXPO_CAPTURE_PORT=8093; node scripts/capture-home-dynamic-hero-dezoom-cinematic-fit.mjs
```
