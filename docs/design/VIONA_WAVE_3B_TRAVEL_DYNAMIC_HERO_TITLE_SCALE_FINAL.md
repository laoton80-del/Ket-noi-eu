# VIONA WAVE 3B — Travel Dynamic Hero Title Scale Final

**Pack:** `VIONA.WAVE_3B.TRAVEL_DYNAMIC_HERO_TITLE_SCALE_FINAL.1`

## Local vs Travel audit

| | Local (`LocalDynamicHero`) | Travel before | Travel after |
|---|---------------------------|---------------|--------------|
| Desktop title | 26 / 32 fixed | 38 / 44 (+4 fs → 42 / 48) | **43 / 50 (+5 fs → 48 / 55)** |
| Title shadow | none (flat white) | radius 22, α0.76 | **radius 26, α0.84** |
| Subtitle | 14 / 21, α0.90 | 14 / 21, α0.92 | **14 / 22, α0.96** |
| Frame ratio | standard opening hero | wide 1600:624 aspect | unchanged |

Travel raw px was already above Local, but the wide midnight frame made the title feel underscaled. +13% desktop + stronger shadow restores premium presence without changing hero height or layout.

## Typography delta

| Token | Before | After | Δ |
|-------|--------|-------|---|
| `titleDesktop` | 38 / 44 | 43 / 50 | +13% |
| Fullscreen boost | +4 | +5 | 48 / 55 total |
| `titleTablet` | 28 / 34 | 30 / 36 | +7% |
| `titleNarrow` | 24 / 30 | 26 / 32 | +8% |
| `titleCompact` | 22 / 28 | 22 / 28 | — |
| Subtitle line-height | 21 | 22 | +1px |
| Subtitle opacity | 0.92 | 0.96 | +4pt |

## Evidence

`docs/design/evidence/wave-3b-travel-dynamic-hero-title-scale-final/`

Capture: `node scripts/capture-travel-dynamic-hero-title-scale-final.mjs`
