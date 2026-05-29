# VIONA WAVE 3B — Home World Cards Daylight Assets Integration

**Task:** `VIONA.WAVE_3B.HOME_WORLD_CARDS_DAYLIGHT_ASSETS_INTEGRATION.1`

## Asset mapping

| World card | New daylight asset | Previous (night, retained) |
| --- | --- | --- |
| Local | `assets/viona/home/viona-home-local-daylight-card-v1.png` | `assets/UI/viona-home-card-local-v1.png` |
| Travel | `assets/viona/home/viona-home-travel-daylight-card-v1.png` | `assets/UI/viona-home-card-travel-v1.png` |
| Academy | `assets/viona/home/viona-home-academy-daylight-card-v1.png` | `assets/UI/viona-home-card-academy-v1.png` |
| Business / Merchant | `assets/viona/home/viona-home-business-daylight-card-v1.png` | `assets/UI/viona-home-card-business-v1.png` |

## Code change

`src/screens/HomeScreen.tsx` — updated `IMG_HOME_*` require paths only. All `backgroundImage={IMG_HOME_*}` usages unchanged.

## Preserved

- Night v1 PNGs in `assets/UI/` (not deleted)
- Home layout, routes, handlers, copy
- Dynamic hero assets
- World-card hover / edge-lit glass / semantic rims
- Luminous (Bật đèn) default mode

## Evidence

```powershell
$env:EXPO_CAPTURE_PORT=8093; node scripts/capture-home-world-cards-daylight-assets.mjs
```

Output: `docs/design/evidence/wave-3b-home-world-cards-daylight-assets/`
