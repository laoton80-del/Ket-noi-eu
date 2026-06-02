# VIONA — Force Visible Editorial Width (Local + Travel Hero) v2

**Pack ID:** `VIONA.WAVE_3B.FORCE_VISIBLE_EDITORIAL_WIDTH_FOR_LOCAL_TRAVEL_HERO.2`

## Problem

Previous recompose pack changed style values but rendered width delta was too small (Travel ~694→760px; Local actually narrowed to ~720px). Visual change was not obvious.

## Fix

Strong desktop/web clamp lanes @1366+:

| Surface | Clamp | Inset | Title max | Subtitle max | CTA/meta max |
|---------|-------|-------|-----------|--------------|--------------|
| **Travel** | `clamp(960px, 62vw, 1160px)` | `left: 3%` | 960px | 820px | 820px |
| **Local** | `clamp(980px, 62vw, 1180px)` | `left: 3%` | 980px | 860px | 860px |

Tablet @1024 uses softer percent/vw values (no 960/980 min).

Typography: Travel title 48px @1366 (46 @1024); Local title 46px @1366 (44 @1024); subtitle 22px; fw 900.

## Scripts

```bash
node scripts/measure-force-visible-editorial-width-for-local-travel-hero-2.mjs
node scripts/capture-force-visible-editorial-width-for-local-travel-hero-2.mjs
```

## Acceptance @1366

- Text container width ≥960px (Travel), ≥980px (Local)
- Title not corner-trapped; editorial cover composition obvious in screenshot
- No ellipsis / line-clamp
