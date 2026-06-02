# VIONA Wave 3B — Travel Local Assistance Rendered Hard Fix (Pack 3)

**Scope:** `src/screens/b2c/TravelScreen.tsx` — Local Concierge panel only.  
**Status:** QA evidence under `docs/design/evidence/wave-3b-travel-local-assistance-rendered-hard-fix-pack-3/`.

## Before (pre-Pack 3 constants)

| Token | Value |
|-------|-------|
| Scene height @ 1024 desktop | 168px (from `travelExperienceZoneRhythmMetrics.mapShellHeight`) |
| Scene height @ 768 | 156px |
| Scene height mobile | 128px |
| Focal desktop | `58% 42%` |
| Web image | `backgroundSize: cover`, `backgroundPosition` from focal fn |
| Card veil | Heavy full-card gradient |
| Search title / note | 12.5px / 9.5px, icon 16 |
| Category chip | icon 8, label 8px, idle opacity 0.82 |
| Demo preview | icon 11, label 8.5px, wrap opacity 0.78 |
| CTA primary | minHeight 36, label 10.5px, icon 12 |
| CTA secondary | label 8.5px, icon 10 |

## After (Pack 3)

| Token | Value |
|-------|-------|
| Scene height @ 1024 desktop | **238** normal / **224** fullscreen (+41% / +33% vs 168) |
| Scene height @ 768 | **214** / **206** fullscreen |
| Scene height @ 520+ | **176** |
| Mobile | **164** |
| Focal @ 1024 landscape | **`52% 36%`** (was `58% 42%`) |
| Focal fullscreen @ 1024 | **`54% 38%`** |
| Focal @ 768 | **`50% 38%`** |
| Focal mobile | **`48% 42%`** |
| Localized scrims | Header scrim 38%; category bottom scrim 42%; lighter horizontal scene gradient |
| Search | 14px / 10.5px, icon 18, row padding 12/13 |
| Category | icon 10, label 9.5px, glass bg 0.52 |
| CTA primary | minHeight 40, label 11.5px, icon 15 |
| CTA secondary | label 9px, icon 10, muted color |

## Safety

No booking/payment/dispatch/live GPS claims added. Existing safety note and preview disclaimers preserved.
