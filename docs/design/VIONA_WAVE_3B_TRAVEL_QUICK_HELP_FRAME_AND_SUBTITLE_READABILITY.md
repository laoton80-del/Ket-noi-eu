# VIONA WAVE 3B — Travel Quick Help Frame & Subtitle Readability

**Pack:** `VIONA.WAVE_3B.TRAVEL_QUICK_HELP_FRAME_AND_SUBTITLE_READABILITY.1`

## Goals

1. Restore visible premium semantic frames/rims on 4 Travel quick-help cards
2. Improve subtitle readability under card titles (Local parity)
3. Keep card grammar, order, images, copy, routes unchanged

## Local vs Travel audit

| Area | Local reference (`VionaFashionWorldCard` + `fashionHomeWebDaylightWorldCardMaterialStyle`) | Travel before | Travel after |
|------|---------------------------------------------------------------------------------------------|---------------|--------------|
| Outer rim | Single semantic `boxShadow` stroke + controlled glow | Rest glow too faint; inner rim missing on web frame | **Stronger rest/hover glow (62/2C → 82/3A), inset inner rim, singular stroke via `suppressAccentRim`** |
| Inner edge | Dedicated inner-rim layer (`inset 0 0 0 1px`) | No inset inner edge on quick-help web frame | **`inset 0 0 0 1px ${tokens.glow}72` rest, strokeHover on hover** |
| Glow strength | Modest outer semantic bloom on hover | `glowMul` 2.04, rest radius 8 | **Flagship `glowMul` 2.34, rest radius 9, opacity 1.14** |
| Subtitle color | `mutedOnDark` + text shadow | `INK_SUB` at 0.94 opacity, no shadow | **`rgba(210,222,238,0.94)` + Local-like shadow; hover → `rgba(218,228,242,0.98)`** |
| Subtitle size | 12/17 | 10/14 | **11/15 (still below title weight)** |
| Text scrim | Left gradient for copy legibility | 58% width, lighter mid-stop | **62% width, max 292px, darker mid-stop (0.84→0.46→0)** |
| Hover frame | Rim intensifies, no double border | Rim lift present but quiet | **Hover multipliers 1.52/2.24 outer glow; magnetic hover preserved** |

## Semantic accents (unchanged)

| Card | Accent |
|------|--------|
| Sân bay | cyan |
| Hỗ trợ phiên dịch | violet |
| Hỗ trợ xe | cyan (+ cyan capsule secondary) |
| Khẩn cấp & cảnh sát | magenta |

Emergency stays magenta; interpreter stays violet. Frame, glow, capsule, and badge share one accent family per card.

## Files changed

- `src/components/travel/TravelGlassCard.tsx` — frame/rim/glow intensity
- `src/components/travel/TravelAppTile.tsx` — subtitle readability + text scrim

## Evidence

`docs/design/evidence/wave-3b-travel-quick-help-frame-and-subtitle-readability/`

Capture: `node scripts/capture-travel-quick-help-frame-and-subtitle-readability.mjs`

Prereq: `npx expo start --web --port 8093`
