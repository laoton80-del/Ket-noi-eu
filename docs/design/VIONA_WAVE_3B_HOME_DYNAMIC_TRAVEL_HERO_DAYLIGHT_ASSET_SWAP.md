# VIONA WAVE 3B — Home Dynamic Travel Hero Daylight Asset Swap

**Task:** `VIONA.WAVE_3B.HOME_DYNAMIC_TRAVEL_HERO_DAYLIGHT_ASSET_SWAP.1`

## Home dynamic Travel hero mapping

| Role | New asset | Previous (retained) |
| --- | --- | --- |
| Living hero when Travel active/hovered | `assets/viona/home/viona-home-travel-hero-daylight-1600x520.png` | `src/assets/viona/home/viona-hero-travel-1280x428.png` |

## Code change

`src/screens/HomeScreen.tsx` — `IMG_HERO_DESKTOP_TRAVEL` only, used in `LIVING_HERO_DESKTOP_IMAGE.travel`.

## Untouched

| Surface | Asset constant |
| --- | --- |
| Small Travel world card | `IMG_HOME_TRAVEL` → `viona-home-travel-daylight-card-v1.png` |
| Travel universe page | `TravelScreen.tsx` → `viona-travel-hero-default-1600x520.png` |
| Local / Academy / Business living heroes | unchanged |

## Evidence

```powershell
$env:EXPO_CAPTURE_PORT=8093; node scripts/capture-home-dynamic-travel-hero-daylight-asset-swap.mjs
```
