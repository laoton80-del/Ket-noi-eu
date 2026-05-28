# VIONA Wave 3B — Local theme-invariant premium glass fix

**Pack:** `VIONA.WAVE_3B.LOCAL_THEME_INVARIANT_PREMIUM_GLASS_FIX.1`
**Goal:** Local hero and four flagship cards keep premium dark-glass frame, border, glow, and Home-like hover in both app Day/Night toggle states.

## Root cause

Local opening visuals were wired to `useVionaHomeDaylightBoost()` (`daylightBoost`):

| Surface | `daylightBoost === false` | `daylightBoost === true` |
|---------|---------------------------|---------------------------|
| **Hero** | Premium dark scrim, top gold glow, `FASHION_HOME_FRAME_BORDER` | Weak `FASHION_HOME_DAYLIGHT_*` scrim/text; no top glow; lighter frame |
| **Cards** | `glassMaterialMode: 'default'` (no edge-lit hover) | `glassMaterialMode: 'edgeLit'` **without** Home’s `FashionHomeWorldCardGlassLayers` host stack → flat/invisible rim |

Toggling the theme button swapped between these branches, so frame/glow and hover quality appeared to “disappear.”

## Fix (theme-invariant Local opening)

1. **Stop passing** `daylight={daylightBoost}` from `LocalScreen` into `LocalOpeningStageLayout`.
2. **`LocalDynamicHero`** — always premium dark-glass branch: strong left scrim, top glow, gold frame stroke, white headline copy. Hero PNGs unchanged (daylight/golden-hour).
3. **`LocalHomeParityCard`** — on web, always edge-lit interior + Home glass host layers (`fashionHomeWorldCardGlassHostStyle`, material/inner-rim box-shadow, corner/bottom gradients) regardless of app theme.
4. **`LocalHeroCardsRow`** — `hoveredHeroKey` drives `edgeLitHoverBoost` and hero crossfade (unchanged behavior).
5. **Global theme toggle** on Local command rail unchanged; only Local hero/card surfaces ignore `daylightBoost`.

## Files touched

- `src/screens/b2c/LocalScreen.tsx`
- `src/components/viona/local/LocalOpeningStageLayout.tsx`
- `src/components/viona/local/LocalDynamicHero.tsx`
- `src/components/viona/local/LocalHeroCardsRow.tsx`
- `src/components/viona/local/LocalHomeParityCard.tsx`
- `src/design/vionaLocalHeroVisuals.ts`

## Capture

```powershell
$env:EXPO_CAPTURE_PORT='8093'; node scripts/capture-local-final-hero-assets.mjs
```

Evidence: `docs/design/evidence/wave-3b-local-final-hero-assets/`

## Manual QA

1. Open Local — note hero frame/glow and card rims.
2. Tap Day/Night on command rail once — hero/cards should look **the same** (premium shell).
3. Desktop: hover each of the four hero cards — rim brighten, image lift, hero crossfade.

## Out of scope

- Home, routes, handlers, assets, global theme storage, other universes.
