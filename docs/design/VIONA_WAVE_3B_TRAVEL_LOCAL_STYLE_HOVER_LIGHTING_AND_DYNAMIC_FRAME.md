# VIONA Wave 3B — Travel Local-style hover, lighting, and dynamic frame

## Goal

Bring Travel hub opening stack closer to Local/Home interaction quality without changing layout, copy, routes, or Travel midnight/cyan identity.

## Local reference (read-only audit)

| Behavior | Local | Travel (before) |
|----------|-------|-----------------|
| Card hover lift | `-2px` + `scale(1.006)` on flagship/quickHelp (web fine pointer) | Partial glass glow only |
| Card press | `scale(0.988)` | Opacity-only on some tiles |
| Hero frame lit | Direct hover **or** non-default `activeHeroKey` from card hover | Image crossfade only; frame stayed cyan/static |
| Hero rim | Animated border opacity 0→0.6, accent from semantic visual | Static cyan frame |
| Hero wash | White brighten wash 0→5% on lit | None |
| Network edge / pulse | `LocalLightingNetworkEdge` + `LocalHeroNetworkPulse` boosted when lit | Travel hero chrome orbs only |

## Travel implementation

### Card hover / focus / press

- **Flagship + perspective**: `TravelGlassCard` with `visual="flagship"` — web lift, semantic glow boost, rim/edge bloom, press compress via `travelWebCardHoverMotionStyle`.
- **Utility pills**: `TravelUtilityPill` — lift `-1.5px`, scale `1.004`, stronger capsule glow shadow, focus mirrors hover, press `scale(0.988)`.

### Dynamic hero lighting

- Existing `TravelHeroChrome` layers: atmospheric cyan gradient, edge bloom, transit-path glow (diagonal, not horizontal scanline), bottom handoff, subject-side highlight.
- Hero image brighten wash (animated 0→5%) when frame is lit.
- Bottom handoff gradient into flagship row preserved.

### Dynamic hero frame semantic reaction

UI-only state in `TravelScreen`:

- `activeTravelHeroFrameAccent` — drives `TravelGlassCard` `accent` on hero (default `cyan`).
- `travelHeroDirectHover` — direct hero pointer hover.
- `travelCardHoverAccent` — flagship or utility hover accent.
- `travelHeroFrameLit` — OR of above + non-default hero image key → `heroFrameBoosted`.

Flagship hover: image crossfade + frame accent (airport/taxi `cyan`, translation `violet`, emergency `magenta`).

Utility hover: frame accent shifts to scenario semantic color; hero image unchanged.

### Artifacts avoided

- No horizontal cyan scanline (removed in prior wave; not reintroduced).
- `heroFrameEdgeGlow` remains a 1px bottom rim only.
- Hero text veil + left scrim preserve readability.

## Files touched

- `src/screens/b2c/TravelScreen.tsx`
- `src/components/travel/TravelGlassCard.tsx`
- `src/components/travel/TravelAppTile.tsx`
- `scripts/capture-travel-local-style-hover-lighting-and-dynamic-frame.mjs`
- `docs/design/evidence/wave-3b-travel-local-style-hover-lighting-and-dynamic-frame/*`

## QA

Capture script (port 8093):

```bash
npx expo start --web --port 8093
node scripts/capture-travel-local-style-hover-lighting-and-dynamic-frame.mjs
```

Manual web: hover each flagship, utility tile, perspective card; confirm hero frame glow/accent shifts subtly with no layout jump.
