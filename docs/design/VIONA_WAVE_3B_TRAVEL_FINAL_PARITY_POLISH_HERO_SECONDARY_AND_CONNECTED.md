# VIONA WAVE 3B — Travel Final Parity Polish (Hero, Secondary, Connected)

**Wave ID:** `VIONA.WAVE_3B.TRAVEL_FINAL_PARITY_POLISH_HERO_SECONDARY_AND_CONNECTED.1`  
**Scope:** Travel hub only — final visual parity with Home/Local grammar while preserving Travel midnight/cyan identity.

## User feedback addressed

1. Dynamic hero text too small / not premium enough → larger desktop/fullscreen headline, stronger glow, visible trust rail.
2. Destination panel too dark → `standard` intensity + cyan glass wash + brighter input/text.
3. Local support panel too dark → `standard` intensity + glass wash + brighter map shell.
4. Connected universes mismatch → Local `LocalConnectedUniverseLinks` grammar (Pressable row, icon + title + subtitle, hover rim).
5. Perspective section collapsed by default → `expanded = true` on first paint.

## Files touched

- `src/screens/b2c/TravelScreen.tsx`
- `scripts/capture-travel-final-parity-polish-hero-secondary-and-connected.mjs`
- `docs/design/evidence/wave-3b-travel-final-parity-polish-hero-secondary-and-connected/*`

## Safety

No booking/payment/SOS/AI fulfillment claims added. Copy keys unchanged in meaning; connected subtitles reuse existing `localHub` subtitle strings.

## Capture

```bash
npx expo start --web --port 8093
node scripts/capture-travel-final-parity-polish-hero-secondary-and-connected.mjs
```

Viewports: 390×844, 844×390, 768×1024, 1024×768, 1366×768, 1366×768 fullscreen.
