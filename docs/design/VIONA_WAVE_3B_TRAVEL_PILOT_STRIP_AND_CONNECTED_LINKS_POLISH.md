# VIONA WAVE 3B — Travel Pilot Strip and Connected Links Polish

**Task:** `VIONA.WAVE_3B.TRAVEL_PILOT_STRIP_AND_CONNECTED_LINKS_POLISH.1`

## Problem

After Travel Packs 1–3 (hero + scenario tiles), the **pilot/readiness strip** and **connected-universe links** still used flatter surfaces (`LocalConstellationFrame` + generic rail pill glass). They felt visually weaker than the upgraded `TravelGlassCard` / `TravelAppTile` stack.

## Fix (TravelScreen only)

1. **`TravelPilotStrip`** — `TravelGlassCard` quiet/standard cyan material; readiness chips use `travelSemanticTokens('cyan')`; responsive `travelSecondarySurfaceMetrics(width)`.
2. **`TravelConnectedLink`** — compact `TravelGlassCard` rows with semantic accents:
   - Local → **cyan**
   - Academy → **violet**
   - Business → **gold**
3. Web hover/focus/press inherited from `TravelGlassCard` (Pack 3 behavior).

## Unchanged

- Pilot/demo/lite/preview label copy and keys
- Connected-universe handlers (`openLocalUniverse`, `openAcademyUniverse`, `openBusinessUniverse`)
- Hero, tiles, consent gate, safety copy, routes

## Evidence

```powershell
$env:EXPO_CAPTURE_PORT=8093; node scripts/capture-travel-pilot-strip-and-connected-links-polish.mjs
```
