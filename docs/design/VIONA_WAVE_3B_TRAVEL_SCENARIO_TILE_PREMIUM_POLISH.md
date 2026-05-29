# VIONA WAVE 3B — Travel Scenario Tile Premium Polish

**Task:** `VIONA.WAVE_3B.TRAVEL_SCENARIO_TILE_PREMIUM_POLISH.1`

## Problem

After hero Pack 1–2, Travel scenario tiles still routed through `PremiumAppTile` (shared reference-lab surface). Tiles felt **flat**, **inconsistent** with midnight `TravelGlassCard` material, and lacked strong web hover/focus feedback — while global `PremiumAppTile.tsx` WIP must stay unstaged.

## Fix (Travel-scoped only)

1. **Revert hub tiles to `TravelAppTile`** — uses `TravelGlassCard` + `TravelIconCapsule` (midnight cinematic, not Home daylight).
2. **`travelAppTileMetrics(width)`** — responsive min-heights keep 1366×768 compact:
   - Scenario: 100px (≥1024) / 104px (768–1023) / 108px (&lt;768)
   - Quick help: 108 / 110 / 112px
3. **`TravelGlassCard` polish** — stronger standard-tile glow/rim; web hover lift (`translateY -1.5`, `scale 1.008`); focus mirrors hover; press `scale 0.988`.
4. **`TravelAppTile` polish** — semantic status pill fill, accent title glow, icon row spacing, dual-accent capsule secondary.

## Unchanged

- All 9 scenarios + 3 quick-help tiles
- Copy, status labels (preview/demo/lite/pilot/safety)
- Handlers, routes, consent gate, pilot strip
- Hero stage metrics (Pack 2)

## Evidence

```powershell
$env:EXPO_CAPTURE_PORT=8093; node scripts/capture-travel-scenario-tile-premium-polish.mjs
```
