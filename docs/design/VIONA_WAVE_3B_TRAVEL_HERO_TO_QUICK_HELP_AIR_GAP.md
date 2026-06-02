# VIONA WAVE 3B — Travel Hero to Quick Help Air Gap

**Pack:** `VIONA.WAVE_3B.TRAVEL_HERO_TO_QUICK_HELP_AIR_GAP.1`

## Change

Added `TRAVEL_HERO_TO_QUICK_HELP_AIR_GAP_BONUS_PX = 14` to the display `heroToFlagshipGap` only (via `travelHeroToQuickHelpAirGap()`). Hero first-view lock math is unchanged so hero height and card dimensions stay fixed.

| Breakpoint | Before | After | Delta |
|------------|--------|-------|-------|
| Desktop web (≥1024) | 6px | 20px | +14px |
| Desktop fullscreen | 10px | 24px | +14px |
| Tablet (768–1023) | 8px | 22px | +14px |
| Mobile (<768) | 10px | 24px | +14px |

Applied on `heroCardsBridge` `marginTop` only. Lower sections (`flagshipToUtilityGap`, utility bridge) unchanged.

## Evidence

`docs/design/evidence/wave-3b-travel-hero-to-quick-help-air-gap/`

Capture: `node scripts/capture-travel-hero-to-quick-help-air-gap.mjs`
