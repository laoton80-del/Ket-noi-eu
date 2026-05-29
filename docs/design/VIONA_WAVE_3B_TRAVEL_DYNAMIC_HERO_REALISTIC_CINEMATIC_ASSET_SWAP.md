# VIONA WAVE 3B — Travel Dynamic Hero Realistic Cinematic Asset Swap

**Task:** `VIONA.WAVE_3B.TRAVEL_DYNAMIC_HERO_REALISTIC_CINEMATIC_ASSET_SWAP.1`

## Asset mapping

| Role | New asset | Previous (retained) |
| --- | --- | --- |
| Travel dynamic hero default | `assets/viona/travel/viona-travel-hero-default-1600x520.png` (1600×520) | `src/assets/viona/home/viona-hero-travel-1280x428.png` (1280×428) |

## Code change

`src/screens/b2c/TravelScreen.tsx` — `IMG_TRAVEL_HERO` require path only. Hero layout, `resizeMode="cover"`, text veil, CTAs unchanged.

## Crop note

1600×520 ≈ 3.08:1 vs prior 1280×428 ≈ 2.99:1 — similar aspect; `heroCinematicImage` anchors right 72% with cover crop.

## Evidence

```powershell
$env:EXPO_CAPTURE_PORT=8093; node scripts/capture-travel-dynamic-hero-realistic-cinematic-asset-swap.mjs
```
