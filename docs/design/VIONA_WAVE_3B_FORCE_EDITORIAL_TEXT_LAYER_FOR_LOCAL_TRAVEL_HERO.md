# VIONA Wave 3B — Force Editorial Text Layer (Local + Travel Hero)

**Pack ID:** `VIONA.WAVE_3B.FORCE_EDITORIAL_TEXT_LAYER_FOR_LOCAL_TRAVEL_HERO.1`

## Problem

Prior typography/width packs updated `maxWidth` tokens on in-flow flex children. The text containers (`heroTextStack`, `copyCol`) were **not absolutely positioned**, so percentage widths shrink-wrapped to content. Visual result: narrow left dashboard column, not magazine cover composition.

## Fix

1. **Absolute editorial overlay** on desktop web (`>=1024`, not compact):
   - Travel: `styles.heroEditorialTextLayer` + `testID="travel-hero-editorial-text-layer"`
   - Local: `styles.editorialCopyCol` + `testID="local-hero-editorial-text-layer"`
2. **Hard editorial lane widths** (not incremental pixel bumps):
   - Travel: 52% hero, `minWidth: 680`, `maxWidth: 860`; title/subtitle/chips inherit full lane
   - Local: 56–58% hero, `minWidth: 720`, `maxWidth: 940`
3. **Remove desktop subtitle line clamp** on Travel (`heroSubLines: 0`)
4. **Subtitle typography:** 19px / lh 1.52 on desktop

## Runtime style paths

| Surface | Container | Style keys |
|---------|-----------|------------|
| Travel | Text stack | `styles.heroTextStack` + `styles.heroEditorialTextLayer` (desktop) |
| Travel | Title | `styles.heroTitle` |
| Travel | Subtitle | `styles.heroSub` |
| Travel | Chips | `styles.heroTrustStrip` |
| Local | Text stack | `styles.copyCol` + `styles.editorialCopyCol` (desktop) |
| Local | Title | `styles.headline` |
| Local | Subtitle | `styles.subtitle` |
| Local | CTA/chips | `styles.ctaRow`, `styles.trustStrip` |

## Before → After (desktop @1366)

| Token | Travel before | Travel after | Local before | Local after |
|-------|---------------|--------------|--------------|-------------|
| Container layout | in-flow flex-start | absolute overlay | in-flow | absolute overlay |
| Container width | ~54% cap ~820px | 52% min 680 max **860** | ~56% cap ~860px | 58% min 720 max **940** |
| Title maxWidth | 880 nested | **860** full lane | 920 nested | **940** full lane |
| Subtitle maxWidth | 840 | **780** | 880 | **820** |
| Subtitle size | 20px | **19px** | 20px | **19px** |
| Chips minWidth | none | **760** | n/a | full lane |
| Title clamp | removed | none | nowrap @1366 | nowrap @1366 |
| Subtitle clamp | 3 lines | **none** | none | none |

## Evidence

`docs/design/evidence/wave-3b-force-editorial-text-layer-for-local-travel-hero/`

Capture: `node scripts/capture-force-editorial-text-layer-for-local-travel-hero.mjs`

## Constraints preserved

- Hero height, images, copy meaning, routes/handlers unchanged
- Home, App.tsx, global.css, navigation untouched
