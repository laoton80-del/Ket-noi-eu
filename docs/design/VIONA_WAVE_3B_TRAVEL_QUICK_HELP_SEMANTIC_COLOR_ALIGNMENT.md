# VIONA.WAVE_3B.TRAVEL_QUICK_HELP_SEMANTIC_COLOR_ALIGNMENT.1

## Goal
Align Travel “Trợ giúp nhanh” flagship quick-help cards so border, glow, icon capsule, and status pills match the correct semantic function colors per VIONA governance.

## Target semantic mapping
| Card | Accent | Meaning |
|------|--------|---------|
| Sân bay | cyan | travel / airport / navigation |
| Hỗ trợ phiên dịch | violet | language / AI / interpreter |
| Hỗ trợ xe | cyan | transport / mobility |
| Khẩn cấp & cảnh sát | magenta | safety / police / urgent |

## Before (issues)
- Frame rim/glow could drift via `LocalConstellationFrame` slab accent (magenta → violet mapping bug from prior wave partially fixed but not unified across all rim layers).
- Emergency card could read violet/purple when inner slab and outer rim disagreed.
- Translation card could pick up cyan secondary glint strongly enough to read as travel, not language/AI.
- Status pill on emergency had hardcoded override path; other cards did not consistently use `travelSemanticTokens` for pill border/glow/fill.
- Photo artwork dominated left edge without accent-tinted scrim, causing cards to visually drift toward neutral/warm tones.

## After (fixes)
### `TravelGlassCard.tsx`
- **`travelQuickHelpSemanticWebFrameStyle`** — web box-shadow uses `tokens.stroke` + `tokens.glow` for all flagship/quickHelp accents (replaces SOS-only magenta helper).
- **`travelQuickHelpSemanticNativeFrameStyle`** — native border uses semantic stroke tokens on flagship/quickHelp.
- **`quickHelpSemanticRim`** overlay (zIndex 8) — inset border + accent glow on flagship/quickHelp so rim matches card accent even when inner slab is neutral.
- Reduced violet+cyan secondary glint on icon capsule for translation (violet-led; cyan secondary subtle).
- Magenta edge bloom boost retained on flagship/quickHelp.

### `TravelAppTile.tsx`
- **`flagshipAccentScrimColors`** — left artwork scrim tinted from `travelSemanticTokens(accent).glow` so image overlay does not drift accent family.
- **`StatusPill`** — always uses `travelSemanticTokens(accent)` for ink, stroke, fill, and web glow (removed emergency-only override).

### `TravelScreen.tsx`
- No changes this wave — `SCENARIO_SEMANTIC` mapping already correct.

## Acceptance
1. Sân bay reads cyan ✓
2. Hỗ trợ phiên dịch reads violet ✓
3. Hỗ trợ xe reads cyan ✓
4. Khẩn cấp & cảnh sát reads magenta ✓
5. Border/glow/pill/icon aligned per card ✓
6. No safety/copy/handler drift ✓

## Evidence
`docs/design/evidence/wave-3b-travel-quick-help-semantic-color-alignment/`

Capture: `node scripts/capture-travel-quick-help-semantic-color-alignment.mjs`

## Out of scope (unchanged)
- Routes, handlers, copy, card order, Travel hero, other Travel sections, Home/Local files.
