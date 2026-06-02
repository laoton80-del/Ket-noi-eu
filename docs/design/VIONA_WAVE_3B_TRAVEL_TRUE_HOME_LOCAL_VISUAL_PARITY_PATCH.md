# VIONA Wave 3B — Travel True Home/Local Visual Parity Patch

**Wave ID:** `VIONA.WAVE_3B.TRAVEL_TRUE_HOME_LOCAL_VISUAL_PARITY_PATCH.1`
**Rework v2:** `VIONA.REWORK.TRAVEL_TRUE_HOME_LOCAL_PARITY_BEFORE_PUSH.1`
**Rework v3:** `VIONA.REWORK.TRAVEL_APP_TILE_GRID_PARITY_BEFORE_COMMIT.1`

## Problem (v1 — too large)

First visual parity pass overshot Home/Local hub grammar:
- Hero 256–292px + aspect ratio felt like cinematic banner, not app hub
- Flagship cards 136px tall, vertical stack — wide dashboard panels
- Scenario grid still dominated; dock clipped content

## Problem (v2 — dashboard rows)

Hero rework landed, but card/grid still felt like old Travel dashboard:
- Quick-help horizontal row stretched full shell width (116px tall panels)
- Scenario 4-column full-bleed spread — wide shallow tiles
- Bottom dock cut first scenario row

## Rework targets (v3 — app tile grid)

### Hero (unchanged from v2, asset unchanged)
| Viewport | min | max |
|----------|-----|-----|
| Desktop ≥1024 | 218px | 238px |
| Tablet 768+ | 188px | 206px |
| Landscape <520h | 152px | 168px |
| Mobile | 112px | 126px |

Full-bleed cover, no aspect-ratio blow-up, stronger left scrim.

### Flagship quick-help row
- Desktop height **102px** (96–108 band)
- **Vertical compact app-tile** layout: icon + status row, title, 1-line subtitle
- 38px icon capsule, 5px grid gap, `PremiumTileGrid` 3-col with `wrapCells`
- Hub rail **max-width 1040px** centered on desktop — reduces horizontal dominance

### Scenario utility layer
- Desktop tile **80px**, compact horizontal row (36px capsule + copy)
- **3 columns** at ≥768 (was 4 at desktop)
- Grid gap **6px**, group gap **1px**, hub rail max-width **1040px**
- 8px bridge to scenarios kicker
- Scroll bottom extra **96px** for dock clearance

## Preserved

Midnight canvas, cyan travel glow, hero asset, all copy/handlers/routes/safety labels.

## Evidence

`docs/design/evidence/wave-3b-travel-true-home-local-visual-parity-patch/`
Script: `scripts/capture-travel-true-home-local-visual-parity-patch.mjs`

## Backup

`backup/travel-parity-too-large-26bc1c7` — pre-rework commit preserved.
