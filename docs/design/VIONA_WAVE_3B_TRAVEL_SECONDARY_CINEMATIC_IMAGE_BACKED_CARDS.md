# VIONA WAVE 3B — Travel Secondary Cinematic Image-Backed Cards

**Pack:** `VIONA.WAVE_3B.TRAVEL_SECONDARY_CINEMATIC_IMAGE_BACKED_CARDS.7`

## Goal

Image-backed cinematic cards for Destination Lens + Local Map Concierge — visible daylight scenes with map/route overlays as **secondary** layers only.

## Assets used (existing)

| Card | Asset |
|------|-------|
| Destination Lens | `assets/viona/home/viona-home-travel-daylight-card-v1.png` |
| Local Concierge | `assets/viona/home/viona-home-local-daylight-card-v1.png` |

## TODO — dedicated secondary-zone assets (when art ready)

Replace with purpose-built files (same require paths after install):

- `viona-travel-destination-lens-cinematic-v1.png`
- `viona-travel-local-concierge-cinematic-v1.png`

## Visual model

- Full-opacity scene image + directional left veil (text) / open right (scene)
- Cyan route glow (destination) · emerald/cyan pin arc (local) as accent overlays
- No dominant debug grid

## Mobile overlap fix

- `TRAVEL_MOBILE_FLOATING_CHROME_RESERVE_PX`: 280
- Mobile `scrollBottomExtra`: 560
- Mobile `hubScrollTailHeight`: 480
- `experienceZoneMobileFloatSpacer`: 360
- `universeBridgeMobileClearance`: 220 (inside connected section)

## Safety

Copy and handlers unchanged.

## Evidence

`docs/design/evidence/wave-3b-travel-secondary-cinematic-image-backed-cards/`
