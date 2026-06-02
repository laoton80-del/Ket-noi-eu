# VIONA WAVE 3B — Travel Hero Card Local Grammar, Frame & Magnet Hover

**Pack:** `VIONA.WAVE_3B.TRAVEL_HERO_CARD_LOCAL_GRAMMAR_FRAME_AND_MAGNET_HOVER.1`

## Goals

1. Slightly larger Travel dynamic hero title (desktop/fullscreen)
2. Local-like icon + title upper-row grammar on 4 quick-help hero cards
3. Restore visible clean premium semantic frames/rims
4. Local-like magnetic hover (lift, scale, pointer-follow, semantic glow)

## Local vs Travel audit

| Area | Local reference | Travel before | Travel after |
|------|-----------------|---------------|--------------|
| Hero title | 26/32 (Local baseline) | 36/42 desktop | **38/44 desktop, +4 fullscreen → 42/48** |
| Card icon/title | `topRow`: icon + copy column | Icon row, title below (bottom-caption feel) | **Icon + title/subtitle beside icon; badge top-right** |
| Card frame | Material + inner rim always visible | Rest rim too quiet | **Stronger rest glow + inset inner rim** |
| Hover | Magnetic pointer + lift + scale | Static lift only | **Magnetic offset + -3px lift + scale 1.01** |

## Semantic accents (unchanged)

- Sân bay / Hỗ trợ xe → cyan
- Hỗ trợ phiên dịch → violet
- Khẩn cấp & cảnh sát → magenta

## Evidence

`docs/design/evidence/wave-3b-travel-hero-card-local-grammar-frame-and-magnet-hover/`

Capture: `node scripts/capture-travel-hero-card-local-grammar-frame-and-magnet-hover.mjs`
