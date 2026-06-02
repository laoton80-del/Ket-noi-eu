# VIONA Wave 3B — Travel Fullscreen Hero Height & Lighting Fix

**Wave ID:** `VIONA.WAVE_3B.TRAVEL_FULLSCREEN_HERO_HEIGHT_AND_LIGHTING_FIX.1`

## Problems

1. Fullscreen opening stack too tall — first row of “Tình huống du lịch” cut off at 1366×768
2. Horizontal cyan line across hero mid-frame
3. Hero lacked premium VIONA lighting depth

## Fixes

### A. Fullscreen height (Local-equivalent rhythm)

- `TRAVEL_OPENING_STAGE_FULLSCREEN_HERO_MAX_TRIM_PX`: 42 → **48**
- `TRAVEL_OPENING_STAGE_FULLSCREEN_HERO_TO_CARD_GAP_PX`: 16 → **10**
- `TRAVEL_OPENING_STAGE_FULLSCREEN_FOR_YOU_PANEL_RESERVE_PX`: 148 → **162** (utility glass panel peek)
- Fullscreen flagship cards: **160px** min height (matches lock budget; was 180px from desktop metrics)
- `flagshipCellQuarterFullscreen` + `travelFlagshipLayout` override

### B. Cyan line removal

- Removed `heroRouteGlow` horizontal strip from `TravelScreen`
- Removed `heroRouteLine`, `heroRouteArc`, `heroRouteStreak` from `TravelHeroChrome`
- Replaced diagonal gold/magenta wash with subtle cyan atmospheric gradient only

### C. Premium Travel lighting

- Soft cyan atmospheric wash + left/top edge bloom
- Diagonal subject/transit path glow (not horizontal band)
- Faint constellation particles (6 points, low opacity)
- Bottom handoff glow with cyan tint into quick-help row
- Frame-edge cyan bloom on hero glass
- Reduced gold/violet orb dominance — midnight/cyan identity preserved

## Evidence

`docs/design/evidence/wave-3b-travel-fullscreen-hero-height-and-lighting-fix/`  
Script: `scripts/capture-travel-fullscreen-hero-height-and-lighting-fix.mjs`
