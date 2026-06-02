# VIONA Wave 3B — Travel Local Assistance DEEP_PANEL_HARD_VALUES PACK_4

**Task ID:** `VIONA.UI.TRAVEL.LOCAL_ASSISTANCE.DEEP_PANEL_HARD_VALUES.PACK_4`  
**Scope:** `src/screens/b2c/TravelScreen.tsx` — Local Map Concierge / Local Assistance panel only.

## Changes

| Control | Before (Pack 3) | After (Pack 4) |
|--------|------------------|----------------|
| Scene band height @ 1366 desktop | 238 normal / 224 fs | **292** normal / **268** fs |
| Panel minHeight @ 1366 | none (content sum) | **560** normal / **540** fs |
| Image focal (landscape desktop) | 52% 36% | **60% 48%** |
| Search title (desktop) | 14px | **19px** |
| Search subtitle (desktop) | 10.5px | **14px** |
| Search icon orb (desktop) | 36px | **48px** |
| Category chip text (desktop) | 9.5px | **13.5px** |
| Category chip icon (desktop) | 10px | **17px** |
| Demo suggestion text (desktop) | 9.5px | **13.5px** |
| Primary CTA label (desktop) | 11.5px | **15px** |
| Safety line (desktop) | 10px | **12px** |

## Contrast (localized, not full-image darken)

- Dark glass strip behind category chips (`localDiscoveryCategoryGlassStrip`).
- Stronger bottom scene scrim for chip row only.
- Demo row glass wrap + gradient scrim on desktop.
- Chip glass opacity increased (0.52 → 0.64 unselected).

## Evidence

`docs/design/evidence/wave-3b-travel-local-assistance-deep-panel-hard-values-pack-4/`

Capture: `node scripts/capture-travel-local-assistance-deep-panel-hard-values-pack-4.mjs` (port **8095**).
