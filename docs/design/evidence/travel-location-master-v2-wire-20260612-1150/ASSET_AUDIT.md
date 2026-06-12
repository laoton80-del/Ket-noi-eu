# Travel location master v2 — asset audit

**Pack:** `PACK_TRAVEL_LOCATION_MASTER_V2_WIRE`
**Branch:** `viona/travel-multi-scene-restore`
**Generated:** 2026-06-12

## Incoming verification

All four operator PNGs in `_incoming-travel-master-v2-local-standard/` verified with `pngjs`:

| File | Size | SHA256 | Match ASSET_REPORT |
|------|------|--------|-------------------|
| `travel-airport-web-normal-master-v2.png` | 2600×800 | `96462816…f1c9c` | YES |
| `travel-prague-charles-bridge-castle-web-normal-master-v2.png` | 2600×800 | `de9bddad…4d3f3` | YES |
| `travel-paris-eiffel-web-normal-master-v2.png` | 2600×800 | `a6151cad…a30a` | YES |
| `travel-berlin-city-web-normal-master-v2.png` | 2600×800 | `dce5e90b…fd26` | YES |

**Resize:** not required — assets already normalized to audited target **2600×800** (~3.25:1).

## Promotion

Copied unchanged to `assets/viona/dynamic-hero/travel/` (same filenames). Old `*_SOURCE.png` / `master-62h` assets retained on disk.

## Out of scope (not committed)

- `viona-travel-master-v2-2600x800.zip`
- Quick Help card tiles (`*_card-62y.png`)
- Local concierge secondary scene (`TRAVEL_LOCAL_CONCIERGE_SCENE` still uses `master-62h`)
