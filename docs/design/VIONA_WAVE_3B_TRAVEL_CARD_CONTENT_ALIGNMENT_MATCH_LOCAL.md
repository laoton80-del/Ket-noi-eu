# VIONA WAVE 3B — Travel Card Content Alignment Match Local

**Wave ID:** `VIONA.WAVE_3B.TRAVEL_CARD_CONTENT_ALIGNMENT_MATCH_LOCAL.1`

## Problem

Travel flagship and perspective image cards used `justifyContent: 'flex-end'`, pinning icon/title to the bottom like poster captions. Local `VionaFashionWorldCard` uses `flex-start` with icon + title in the upper content zone.

## Fix

- Flagship + perspective inner stacks: `flex-end` → **`flex-start`**
- Added left text scrim on flagship image cards (Local grammar)
- Lightened bottom veils; perspective CTA pinned to footer via `marginTop: 'auto'`
- Slightly increased top padding (+2px) to match Local vertical rhythm

## Capture

```bash
npx expo start --web --port 8093
node scripts/capture-travel-card-content-alignment-match-local.mjs
```
