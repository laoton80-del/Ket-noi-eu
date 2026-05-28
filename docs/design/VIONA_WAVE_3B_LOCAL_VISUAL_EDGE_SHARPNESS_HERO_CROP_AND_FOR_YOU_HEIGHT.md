# VIONA Wave 3B — Local edge sharpness, hero crop, For You height

**Pack:** `VIONA.WAVE_3B.LOCAL_VISUAL_EDGE_SHARPNESS_HERO_CROP_AND_FOR_YOU_HEIGHT.1`

Final visual tuning after daylight hero assets. No image replacement, no IA/route/handler changes.

## A. Border / frame sharpness

- Hero frame keeps the crisp 1px stroke (`premiumCrispEdgeStroke(FASHION_HOME_FRAME_BORDER)` → inset `0 0 0 1px` on web, `borderWidth: 1` native).
- Added `premiumFrameInnerHighlight()` — a 1px top highlight line — so the hero edge reads sharper and matches Home premium-frame grammar. Single intentional layered highlight, no blurry double border.
- Glow kept subtle (top gold glow strip + frame shadow unchanged).
- Hero cards (`LocalHeroCardsRow` → `LocalHomeParityCard`) already carry a crisp 1px **semantic accent** inner rim with `edgeLitHoverBoost` on hover (theme-invariant pass). Hover still sharpens rim/glow Home-style. No cell-level border added (would double the rim).

## B. Dynamic hero crop tuning

- `HERO_ASPECT` set to `1600 / 520` to match the delivered daylight assets exactly, so `objectFit: cover` crops minimally.
- Frame-height floors lowered (compact 204→184, narrow 240→212, default 280→264) and narrow max 320→300 so the wide composition is not forced into an over-tall frame on small widths (which caused horizontal over-zoom).
- `objectFit: cover` + `objectPosition` from `vionaLocalHeroVisuals.ts` retained. No scale/transform present or added. Left text-safe scrim unchanged.
- No layout shift between hover/crossfade states (opacity-only crossfade).

## C. Local For You button height

- `VionaQuickActionPill` is shared with Home, so `LocalQuickActionsRow` now renders a Local-scoped pill (`LocalQuickActionPill`) instead — Home untouched.
- Responsive `minHeight`: **46px** mobile/tablet, **50px** desktop (≥1080px). Pill shape (`radius.pill`) preserved; icon capsule 24px with thin accent rim; label allows 2 lines, vertically centered.
- Compact grid columns unchanged (2 / 3 / 4 / 8 by width). Not converted to hero cards.

## Handler preservation

All eight handlers passed straight through, unchanged: Restaurants, Transit, Rentals & housing, Classifieds, Nails & Spa, Community events, AI Receptionist, Language assist.

## Files

- `src/components/viona/local/LocalDynamicHero.tsx`
- `src/components/viona/local/LocalQuickActionsRow.tsx`
- `docs/design/VIONA_WAVE_3B_LOCAL_VISUAL_EDGE_SHARPNESS_HERO_CROP_AND_FOR_YOU_HEIGHT.md`

## Capture

```powershell
$env:EXPO_CAPTURE_PORT='8093'; node scripts/capture-local-final-hero-assets.mjs
```
