# VIONA Wave 3B — Local Card Hover Parity With Home

Task ID: `VIONA.WAVE_3B.LOCAL_CARD_HOVER_PARITY_WITH_HOME.1`

## Home hover grammar reused

- `createFashionHomeWebWorldCardPointerHandlers` — pointer enter/leave + magnetic tracking
- `fashionHomeWebWorldCardHostMotionStyle` — subtle lift (-1px), scale 1.004, magnetic tilt
- `fashionHomeWebDaylightWorldCardMaterialStyle` — semantic hover edge glow
- `fashionHomeWebDaylightWorldCardInnerRimStyle` — rim sharpen on hover
- `fashionHomeWebDaylightTransitionStyle` — 200ms ease on box-shadow/transform
- Edge-lit corner boost + `LocalLightingNetworkEdge` boosted tier
- `VionaFashionWorldCard` edgeLit image filter + icon capsule brighten

## Local change

`LocalHomeParityCard` now hosts pointer handlers and magnetic motion directly (replacing deprecated `fashionHomeWebWorldCardHostHoverMotionStyle`). `LocalHeroCardsRow` wires hero crossfade via `onHeroHoverChange` without duplicate cell `onMouseEnter` handlers.

## Evidence

`docs/design/evidence/wave-3b-local-hover-parity/`

## Commit status

NOT COMMITTED.
