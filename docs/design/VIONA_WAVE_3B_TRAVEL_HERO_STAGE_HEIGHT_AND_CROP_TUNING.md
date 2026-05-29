# VIONA WAVE 3B — Travel Hero Stage Height and Crop Tuning

**Task:** `VIONA.WAVE_3B.TRAVEL_HERO_STAGE_HEIGHT_AND_CROP_TUNING.1`

## Root cause

Pack 1 swapped to a wide cinematic 1600×520 asset but left the hero stage at a **102px** min height tuned for the older 1280×428 strip. The image region felt **cramped** at desktop landscape (1366×768): too little vertical runway for the airport scene and tight against the pilot strip / quick-help row.

## Fix (TravelScreen only)

Responsive `travelHeroStageMetrics(width)` — **no scale**, `resizeMode="cover"`, web `objectPosition` only.

| Viewport | Stage minHeight | Image width | Insets (t/r/b) | objectPosition (web) |
| --- | ---: | ---: | --- | --- |
| &lt; 768 | 102px | 72% | −6 / −12 / −6 | 52% 40% |
| 768–1023 | 128px | 73% | −7 / −13 / −7 | 56% 42% |
| ≥ 1024 | 144px | 74% | −8 / −14 / −8 | 58% 44% |

Text veil (62% left), copy, handlers, pilot labels — unchanged.

## Evidence

```powershell
$env:EXPO_CAPTURE_PORT=8093; node scripts/capture-travel-hero-stage-height-and-crop-tuning.mjs
```
