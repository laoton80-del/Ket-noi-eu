# VIONA WAVE 3B — Travel Card Hover Parity With Local

**Pack:** `VIONA.WAVE_3B.TRAVEL_CARD_HOVER_PARITY_WITH_LOCAL.1`  
**Goal:** Add Local-like premium hover/focus/press effects to Travel cards without layout, route, handler, or copy drift.

## Local hover audit (reference)

| Signal | Local (`LocalHomeParityCard`, `LocalQuickActionsRow`) | Travel before | Travel after |
|--------|------------------------------------------------------|---------------|--------------|
| Lift | `-1.5px` (utility), `-1px` (world cards) | `-2px` flagship / `-1.5px` utility | `-3px` flagship / `-2px` utility & connected |
| Scale (hover) | `1.004` | `1.006` flagship / `1.004` utility | `1.008` flagship / `1.006` utility & connected |
| Scale (press) | ~`0.994` (Home world) | `0.988` | `0.988` (unchanged, within spec) |
| Transition | `160ms` ease / cubic-bezier | `240ms` | `200ms` |
| Border glow | Semantic rim intensifies on hover | Partial (frame only) | Semantic stroke + stronger controlled glow |
| Icon capsule | Brightens (`edgeLitHoverBoost`) | Static | `materialActive` border/glow/ink lift |
| Image | `contrast(1.01) saturate(1.01)` | None | `contrast(1.02) saturate(1.02) brightness(1.03)` + white wash |
| Status pill | Responds to hover | Static | Active border/glow/ink on hover |
| Focus | Mirrors hover | Partial | Focus mirrors hover (existing handlers) |
| Hero reaction | Card hover → hero lighting | Already wired | Preserved (`onTravelHeroCardHover`) |

## Implementation

### `TravelGlassCard.tsx`
- Motion: flagship/quickHelp `-3px` / `1.008`; standard `-2px` / `1.006`; press `0.988`; `200ms` transition.
- Semantic web frames: stronger hover glow delta for flagship/quickHelp; new `travelStandardSemanticWebFrameStyle`.
- Material layers: hover lift multiplier `1.16`; corner accent + interior well brighten; subtle white wash overlay.
- `TravelIconCapsule`: optional `materialActive` for semantic border/glow/ink intensification.
- Export `travelCardImageHoverStyle` for artwork micro-lift.

### `TravelAppTile.tsx`
- Flagship + perspective: track hover; pass `materialActive` to capsule; `StatusPill active`; image filter + brighten overlay.
- Utility pills: semantic token borders/glow; `-2px` / `1.006` hover; `200ms` transition.

### `TravelScreen.tsx`
- `TravelConnectedLink`: semantic accent border/glow, lift/scale on hover/focus, press compression.

## Semantic hover color mapping

| Card / function | Accent |
|-----------------|--------|
| Sân bay | cyan |
| Hỗ trợ phiên dịch | violet |
| Hỗ trợ xe | cyan |
| Khẩn cấp & cảnh sát | magenta |
| Airport / transport / map utilities | cyan |
| Restaurant / local trust | emerald or cyan (existing scenario token) |
| Interpreter / language | violet |
| Emergency / police | magenta |
| Value / business connected links | gold (subtle) |

Rules enforced: single semantic rim per card; emergency stays magenta; interpreter stays violet.

## Hero reaction

Existing dynamic hero hover sync preserved — card hover updates hero frame/light via `travelCardHoverAccent`; returns to cyan baseline on leave.

## QA

Evidence: `docs/design/evidence/wave-3b-travel-card-hover-parity-with-local/`  
Capture: `node scripts/capture-travel-card-hover-parity-with-local.mjs` (port 8093, consent `travelLocation.v1 = '0'`).

Manual hover QA: quick-help ×4, utility/scenario tiles, perspective ×3, connected universe links.

## Safety

No changes to Home, Local (except read-only reference), App.tsx, global.css, navigation, PremiumAppTile/reference-lab, layout sizes, copy, routes, or handlers.
