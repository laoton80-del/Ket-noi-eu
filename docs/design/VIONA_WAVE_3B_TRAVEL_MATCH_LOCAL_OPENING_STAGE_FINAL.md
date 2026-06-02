# VIONA Wave 3B — Travel Match Local Opening Stage Final

**Wave ID:** `VIONA.WAVE_3B.TRAVEL_MATCH_LOCAL_OPENING_STAGE_FINAL.1`

## Problem

Travel hero was ~218px vs Local ~430–504px. Bottom tab bar visible on first opening view at 1366×768.

## Solution

### Hero (Local parity)
- Frame aspect **1600/624** with full-bleed cover (Travel airport asset)
- Desktop min **430px**, max **504px** (viewport-budget lock)
- `computeTravelOpeningStageFirstViewLock` mirrors LocalOpeningStageLayout

### Opening stack
1. Dynamic hero
2. Quick-help kicker (`travelHub.quickHelpKicker`)
3. 4 flagship cards (180px desktop min)
4. Utility panel (`travelHub.scenariosKicker`) — 52px bridge on desktop lock

### Dock / tab bar
- Hide React Navigation tab bar on Travel focus (web ≥768)
- `showDock: false` on desktop web (≥1024) — Local parity

## Evidence

`docs/design/evidence/wave-3b-travel-match-local-opening-stage-final/`  
Script: `scripts/capture-travel-match-local-opening-stage-final.mjs`
