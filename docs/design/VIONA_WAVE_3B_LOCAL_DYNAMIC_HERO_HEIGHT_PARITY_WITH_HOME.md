# VIONA Wave 3B — Local Dynamic Hero Height Parity With Home

Task ID: `VIONA.WAVE_3B.LOCAL_DYNAMIC_HERO_HEIGHT_PARITY_WITH_HOME.1`

## Goal

Deepen the Local dynamic hero stage so it reads closer to Home’s premium hero rhythm — clearer separation before Local For You — without reintroducing zoom/crop regressions.

## Home reference (read-only)

| Token | Value |
|-------|-------|
| Desktop hero aspect | `1280 / 540` (~2.37) |
| Opening-stage hero budget | `HERO_MIN` 430px · `HERO_MAX` 494px (+ fullscreen bonus) |
| Sizing model | Viewport-budget pixel height on web opening stage |

Home stacks world cards below hero inside the opening stage; For You sits further down. Local uses width-driven `aspectRatio` in `LocalDynamicHero`.

## Local change

`src/components/viona/local/LocalDynamicHero.tsx` only:

| Token | Before | After | Intent |
|-------|--------|-------|--------|
| `HERO_ASPECT` | `1600 / 570` | `1600 / 624` | Taller frame via aspect (~+44px at 1366-class widths) |
| `minHeight` compact / narrow / default | 198 / 228 / 276 | 202 / 232 / 304 | Mobile +4px; tablet +28px floor |
| `maxHeight` compact / default | 324 / 496 | 356 / 544 | Headroom for landscape + wide desktop |

No scale transform, negative inset, or image asset changes. `cover` + existing `objectPosition` preserved.

## Estimated frame height deltas

| Viewport | Before (approx) | After (approx) | Δ |
|----------|-----------------|----------------|---|
| 1366 desktop | ~477px | ~522px | +45px |
| 1024 desktop | ~353px | ~386px | +33px |
| 768 tablet | 276 (floor) | 304 (floor) | +28px |
| 390 mobile | 228 (floor) | 232 (floor) | +4px |
| 844×390 landscape | ~301px | ~329px | +28px |

## Constraints honored

- No Home, IA, routes, handlers, For You, classifieds, SOS, payment, or asset changes.
- `LocalOpeningStageLayout` spacing unchanged.

## Evidence

`docs/design/evidence/wave-3b-local-final-hero-assets/` via `EXPO_CAPTURE_PORT=8093 node scripts/capture-local-final-hero-assets.mjs`

## Commit status

NOT COMMITTED.
