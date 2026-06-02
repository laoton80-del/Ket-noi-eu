# VIONA WAVE 3B — Travel Secondary Cinematic Scene Card

**Pack:** `VIONA.WAVE_3B.TRAVEL_SECONDARY_CINEMATIC_SCENE_CARD.6`

## Goal

Stop wireframe/debug-map treatment. Convert Destination Lens + Local Map Concierge into **cinematic scene cards** with premium image composition (Local hero/card richness grammar).

## Scene assets (secondary zone only — not opening hero)

| Card | Asset |
|------|-------|
| Destination Lens | `viona-travel-dynamic-global-airport-v1.png` |
| Local Concierge | `local-card-browse-services-640x360.png` |

## Visual model

- **Background:** travel/local scene image at low opacity
- **Overlay:** dark glass veil + vignette + semantic glow
- **Map/route/pin:** secondary overlay layer only — **no dominant grid**
- **Focal:** glowing pin + pulse rings + route arc

## Mobile overlap fix

- `TRAVEL_MOBILE_FLOATING_CHROME_RESERVE_PX`: 240
- Mobile `scrollBottomExtra`: 420
- Mobile `hubScrollTailHeight`: 320
- `experienceZoneMobileFloatSpacer`: 200px before escape bar
- `connectedStripMarginBottom`: 64

## Safety

Copy and handlers unchanged — no operational claims.

## Evidence

`docs/design/evidence/wave-3b-travel-secondary-cinematic-scene-card/`
