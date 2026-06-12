# Wiring root cause — location master v2 bleed

**Pack:** `PACK_TRAVEL_LOCATION_MASTER_V2_WIRING_FIX_HERO_ONLY`  
**Branch:** `viona/travel-multi-scene-restore` @ `0e0bea9` (before fix)

## Cause of repeated airport image

`TRAVEL_DYNAMIC_HERO_ASSETS` in commit `0e0bea9` pointed **all** hero keys at location master v2 files, including utility contexts (`transit`, `family`, `global`, `cityConcierge`) and alternate scene keys (`rides`, `interpreter`, `emergencyPolice`). `travelDynamicHeroAsset()` was the single resolver for the top hero.

Side effects:

1. **Utility / lower-section hovers** (`TRAVEL_SCENARIO_DYNAMIC_HERO_KEY`) drove hero keys like `transit` / `family` → airport **v2**, so the top hero looked like airport even when operators expected legacy scene art or city masters only on Quick Help flagship hovers.
2. **Stacked hero** kept airport v2 on the default layer under Prague/Paris/Berlin overlays, so airport could read through when the overlay did not fully occlude.
3. **Cards** were already wired to `TRAVEL_FLAGSHIP_CARD_ASSETS` (`*_card-62y.png`) and were **not** mapped to v2 in code — perceived “all airport” on cards was likely hero bleed + utility-hover airport v2 dominance in the opening viewport, not card `require()` paths.

## Hero-only map (fix)

`TRAVEL_HERO_LOCATION_MASTER_V2_IMAGES` + `TRAVEL_HERO_LOCATION_MASTER_V2_BY_KEY` — used **only** by `travelTopHeroImageSource()` for top hero:

| Key | v2 location |
|-----|-------------|
| `default`, `journey` | airport |
| `interpreter`, `localGuide` | prague |
| `rides` | paris |
| `emergencyPolice` | berlin |

Utility keys (`transit`, `family`, `global`, `cityConcierge`) fall back to legacy `TRAVEL_DYNAMIC_HERO_ASSETS` (62h / `*_SOURCE`).

## Card artwork map (unchanged semantics)

`TRAVEL_QUICK_HELP_CARD_IMAGES` (alias `TRAVEL_FLAGSHIP_CARD_ASSETS`):

| Card | Asset |
|------|-------|
| airport | `travel-airport-web-normal-card-62y.png` |
| translation | `travel-translation-assist-web-normal-card-62y.png` |
| taxi | `travel-rides-assist-web-normal-card-62y.png` |
| emergency | `travel-emergency-police-web-normal-card-62y.png` |

## Lower panels

`TRAVEL_LOCAL_CONCIERGE_SCENE` → legacy `master-62h` (unchanged).  
`TRAVEL_SITUATION_NETWORK_BG_PREMIUM` → dedicated situation network PNG (unchanged).
