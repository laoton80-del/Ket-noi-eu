# VIONA WAVE 3B — Travel + Local Dynamic Hero Title Hard Scale

**Pack:** `VIONA.WAVE_3B.TRAVEL_LOCAL_DYNAMIC_HERO_TITLE_HARD_SCALE.1`

## Before → After typography (explicit px)

### Travel (`TRAVEL_HERO_TYPOGRAPHY` + `travelDynamicHeroMetrics`)

| Token / breakpoint | Before | After |
|--------------------|--------|-------|
| Kicker | 11 / ls 2 | **13 / ls 2.2** |
| Title desktop 1024–1365 | 43 / 50 | **46 / 50** (ratio ~1.09) |
| Title large ≥1366 | 43 / 50 (+5 fs → 48/55) | **48 / 52** (+4 fs → **52 / 56** fullscreen) |
| Title tablet 768–1023 | 30 / 36 | **32 / 36** |
| Title narrow <520 | 26 / 32 | **26 / 30** |
| Title compact landscape | 22 / 28 | **24 / 28** |
| Subtitle desktop | 14 / 22 | **17 / 24** |
| Subtitle tablet | 14 / 22 | **16 / 22** |
| Subtitle compact | 12 / 17 | **14 / 20** |
| Trust chips | 10 | **10** (unchanged) |
| Copy max width | 520px | **540px** |
| fontWeight | Montserrat 800 | **800** (unchanged) |

### Local (`LOCAL_HERO_TYPOGRAPHY` + `localDynamicHeroCopyMetrics`)

| Token / breakpoint | Before | After |
|--------------------|--------|-------|
| Eyebrow | 11 / ls 2 | **12 / ls 2.2** |
| Title desktop ≥1024 | 28 / 35 (static) | **36 / 40** |
| Title large ≥1366 | 28 / 35 | **38 / 42** (+2 fs → **40 / 44** fullscreen) |
| Title tablet 768–1023 | 28 / 35 | **32 / 36** |
| Title narrow <520 | 24 / 30 | **26 / 30** |
| Title compact | 28 / 35 (wrong path) | **24 / 28** |
| Subtitle desktop | 14 / 22 | **15 / 22** |
| Subtitle tablet | 14 / 22 | **14 / 21** |
| Trust chips | 10 | **10** (unchanged) |
| Copy max width | 520px | **540px** |
| fontWeight | Montserrat 800 | **800** (unchanged) |

## Rationale

- Travel wide midnight frame made prior title blocks feel underscaled despite high px values; tighter line-height ratio (1.08–1.12) + larger fs on 1024+ restores premium mass.
- Local now uses explicit breakpoint metrics (not static StyleSheet) so tablet/desktop/mobile scale independently.
- Hero height, images, cards, routes, and copy keys unchanged.

## Evidence

`docs/design/evidence/wave-3b-travel-local-dynamic-hero-title-hard-scale/`

Capture: `node scripts/capture-travel-local-dynamic-hero-title-hard-scale.mjs`
