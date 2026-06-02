# VIONA WAVE 3B — Dynamic Hero Network Lighting Color Parity

**Wave ID:** `VIONA.WAVE_3B.DYNAMIC_HERO_NETWORK_LIGHTING_COLOR_PARITY.1`

## Problem

Home default hero showed a harsh cyan bottom/right edge strip while the network was gold-led. Travel hero network switched entire color to violet/magenta/gold on card hover instead of staying cyan-led.

## Semantic rules

| Surface | Network primary | Network secondary | Frame / edges |
|---------|-----------------|-------------------|---------------|
| Home default | Gold | Cyan (nodes only) | Gold edges — no cyan strip |
| Home travel card | Cyan | Route blue | Cyan edges |
| Travel baseline | Cyan `#84EEFF` | Violet-blue `#66B6FF` | Cyan frame |
| Travel hover | Cyan (fixed) | Subtle semantic hint | Frame shifts via TravelGlassCard |

## Files

- `src/components/viona/homeHeroSemanticLighting.ts` — edge accent map + semantic lighting
- `src/components/travel/travelHeroSemanticLighting.ts` — Travel network resolver
- `src/components/travel/TravelHeroLightingNetwork.tsx` — cyan-led network wiring
- `src/screens/HomeScreen.tsx` — semantic edge colors
- `src/screens/b2c/TravelScreen.tsx` — unified network lighting + softer handoff

## Capture

```bash
npx expo start --web --port 8093
node scripts/capture-dynamic-hero-network-lighting-color-parity.mjs
```
