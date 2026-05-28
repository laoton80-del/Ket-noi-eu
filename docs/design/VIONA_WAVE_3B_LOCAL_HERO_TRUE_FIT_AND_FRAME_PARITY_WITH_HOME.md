# VIONA Wave 3B — Local hero true-fit + frame parity with Home

**Pack:** `VIONA.WAVE_3B.LOCAL_HERO_TRUE_FIT_AND_FRAME_PARITY_WITH_HOME.1`

No image assets replaced. No IA/route/handler/business-logic changes. Not committed.

## Root cause — over-zoom
The hero frame height was derived from `useWindowDimensions().width` and clamped to a fixed `maxHeight` (400). On real layouts the rendered frame is narrower than the window (rail padding / column), so the frame aspect diverged from the 1600×520 image aspect, and `objectFit: cover` cropped to fill — reading as over-zoom. The default `objectPosition` (`72% 38%`) also pushed the composition to the far-right edge, showing mostly the right-side tree/building.

## Root cause — uneven frame/border
The previous pass added `premiumFrameInnerHighlight()` — a straight 1px line at `top:1, left:12, right:12`. Against the large `radius.xxl` corners it cut across the rounded corner and read as a broken second border. Home's hero frame uses **only** `premiumFrameEdgeOverlay` + `premiumCrispEdgeStroke` (a single crisp 1px line).

## A. Image fit / objectPosition
- Frame now uses `aspectRatio: HERO_ASPECT` (`1600/520`) so height derives from the **real** rendered width → `cover` matches the composition with minimal/no crop ("image sits inside the frame").
- `minHeight` floors (compact 184 / narrow 212 / default 248) keep copy readable; `maxHeight` (compact 300 / default 440) stops the banner getting too tall on wide single-column layouts. Since `aspectRatio` only grows height on wide frames, copy is never clipped more than before.
- Image media layer: `width:100%`, `height:100%`, `objectFit: cover`, `objectPosition` from config. **No scale transform, no negative inset.** Redundant objectPosition ternary removed.
- `objectPosition` tuned away from the far-right edge: default `72% 38%` → `58% 42%`; bookingAssist `70% 40%` → `62% 42%` (myRequests / legalWealth / browseServices unchanged).
- Crossfade remains opacity-only on a same-sized layer → no layout shift.

## B. Frame parity with Home
- Removed `premiumFrameInnerHighlight()` from the hero → single crisp 1px outer border, matching Home grammar.
- Single `premiumCrispEdgeStroke(FASHION_HOME_FRAME_BORDER)` over `premiumFrameEdgeOverlay(radius.xxl)`; image clip sits under the border (border `zIndex` above media), scrim doesn't dull it.
- Hero cards (`LocalHeroCardsRow` → `LocalHomeParityCard`) already share the Home world-card edge-lit system (consistent semantic accent rim + `edgeLitHoverBoost`); left unchanged to avoid double borders.

## C. Theme-invariant
Hero/cards have no daylight branch — premium dark-glass frame, glow, scrim, rim, and hover persist in both app theme states. Unchanged by this pass.

## D. Local For You
Not modified.

## Files changed
- `src/components/viona/local/LocalDynamicHero.tsx`
- `src/design/vionaLocalHeroVisuals.ts`
- `docs/design/VIONA_WAVE_3B_LOCAL_HERO_TRUE_FIT_AND_FRAME_PARITY_WITH_HOME.md`

## Capture
```powershell
$env:EXPO_CAPTURE_PORT='8093'; node scripts/capture-local-final-hero-assets.mjs
```
