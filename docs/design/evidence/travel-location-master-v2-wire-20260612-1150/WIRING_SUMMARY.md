# Travel location master v2 — wiring summary

**Pack:** `PACK_TRAVEL_LOCATION_MASTER_V2_WIRE`  
**File:** `src/screens/b2c/TravelScreen.tsx`

## Hero mapping (`TRAVEL_DYNAMIC_HERO_ASSETS`)

| Hero key | v2 asset |
|----------|----------|
| `default`, `journey`, `transit`, `family`, `global`, `cityConcierge` | `travel-airport-web-normal-master-v2.png` |
| `interpreter`, `localGuide` | `travel-prague-charles-bridge-castle-web-normal-master-v2.png` |
| `rides` | `travel-paris-eiffel-web-normal-master-v2.png` |
| `emergencyPolice` | `travel-berlin-city-web-normal-master-v2.png` |

## Framing changes

- `TRAVEL_DYNAMIC_HERO_IMAGE_COVER_SCALE_*` → **1** (removed 0.72/0.7 dezoom for 2600×800 native cover)
- `TRAVEL_ALT_MASTER_HERO_ART_DIRECTION` → cover scale **1**, light focal positions (58–60% horizontal)

## Unchanged

- Quick Help card `require()` paths (`*_card-62y.png`)
- Legacy `*_SOURCE.png` / `master-62h` requires (cards + local concierge)
- Routes, copy, safety text, navigation, touch lighting overlay stack

## Active overlay

`interpreter` / `rides` / `emergencyPolice` still use `travel-dynamic-hero-active-overlay-image` on hover; overlay sources now point at Prague / Paris / Berlin v2 masters.
