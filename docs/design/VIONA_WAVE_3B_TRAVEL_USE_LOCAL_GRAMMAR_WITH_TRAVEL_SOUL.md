# VIONA Wave 3B — Travel Use Local Grammar With Travel Soul

**Wave ID:** `VIONA.REWORK.TRAVEL_USE_LOCAL_GRAMMAR_WITH_TRAVEL_SOUL.1`

## Problem

Travel still used a separate layout system (3 wide quick-help tiles + grouped scenario dashboard rows) instead of the same VIONA hub grammar as Local/Home.

## Solution — Local grammar, Travel soul

### A. Travel Dynamic Hero
- Full-width premium hero (existing asset + midnight cyan scrim)
- Hub-weight height band (218–238px desktop), not cinematic wall

### B. Four flagship cards (Local `LocalHeroCardsRow` parity)
| # | Scenario ID | Accent | Handler |
|---|-------------|--------|---------|
| 1 | `airport` | cyan | `TravelFlightSearch` — journey/airport overview |
| 2 | `translation` | violet | Live interpreter (travel) |
| 3 | `taxi` | cyan | Leona call help (demo) |
| 4 | `emergency` | magenta | `EmergencySOS` |

- Desktop: 4 across @ ≥1024, 180px min height
- Mobile: carousel / 2-col grid like Local

### C. Travel utility grid (Local cho bạn parity)
Panel title: existing `travelHub.scenariosKicker`

8 compact utility pills (4-col desktop @ 1024–1479):
`airport`, `taxi`, `transit`, `hotel`, `restaurant`, `shopping`, `hospital`, `translation`

### D. Secondary below fold
Pilot strip, direction selector, destination helper, local connected support, connected universes — unchanged handlers.

## Preserved

Midnight canvas, cyan accents, all copy keys, routes, consent gate, SOS, Leona, cravings modal, connected universe handlers, safety labels.

## Evidence

`docs/design/evidence/wave-3b-travel-use-local-grammar-with-travel-soul/`  
Script: `scripts/capture-travel-use-local-grammar-with-travel-soul.mjs`
