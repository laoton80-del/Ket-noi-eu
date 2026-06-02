# VIONA WAVE 3B — Travel Quick Help Force Visible Premium Rims

**Pack:** `VIONA.WAVE_3B.TRAVEL_QUICK_HELP_FORCE_VISIBLE_PREMIUM_RIMS.1`

## Root cause

1. `suppressAccentRim` disables `LocalConstellationFrame` web glass stroke — Travel owned rim via outer `boxShadow` only.
2. RN Web `shadowColor` / `shadowOpacity` / `shadowRadius` on the same node **conflicted** with custom `boxShadow`, washing out the 1px stroke.
3. No always-visible rim overlay above artwork (Local uses host material + inner rim + edge overlay).
4. Rest-state outer glow was too large, visually flattening the stroke against the dark stage.

## Fix

- **Stop RN shadow conflict:** quick-help web cards skip `shadowColor` / `shadowOpacity` / `shadowRadius`; host owns `boxShadow` glow only.
- **Always-visible outer stroke:** host `borderWidth: 1` + semantic `borderColor` at rest (not hover-only).
- **`TravelQuickHelpRimOverlay`:** absolute rim ring at `zIndex: 12` above artwork — reinforces stroke + soft semantic halo.
- **Inner semantic inset:** host `boxShadow` includes `inset 0 0 0 1px ${tokens.glow}` wash + top highlight + depth.
- **Hover:** `borderColor` → `strokeHover`; glow alphas intensify (rim exists before hover).
- **Native:** outer `borderWidth: 1` + semantic `borderColor`.

## Semantic accents (unchanged)

| Card | Accent |
|------|--------|
| Sân bay | cyan |
| Hỗ trợ phiên dịch | violet |
| Hỗ trợ xe | cyan |
| Khẩn cấp & cảnh sát | magenta |

## Evidence

`docs/design/evidence/wave-3b-travel-quick-help-force-visible-premium-rims/`

Capture: `node scripts/capture-travel-quick-help-force-visible-premium-rims.mjs`
