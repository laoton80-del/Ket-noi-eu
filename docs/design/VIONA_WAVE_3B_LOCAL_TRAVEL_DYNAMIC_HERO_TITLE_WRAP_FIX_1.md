# VIONA WAVE 3B — Local + Travel Dynamic Hero Title Wrap Fix

**Pack:** `VIONA.WAVE_3B.LOCAL_TRAVEL_DYNAMIC_HERO_TITLE_WRAP_FIX.1`

## Root cause

| Issue | Cause |
|-------|-------|
| Local 2-line wrap on desktop | `numberOfLines={2}` + narrow `maxWidth` (520–560px) forced wrap |
| Travel ellipsis | `numberOfLines={2}` truncates with RN ellipsis when Czech/long copy exceeds 2 lines at 520px |

## Fix

### Local (desktop ≥1024)
- Removed `numberOfLines={2}` on title
- `whiteSpace: 'nowrap'` on web desktop only (`titleNoWrap: true`)
- Title `maxWidth`: **720px** (1024–1365) · **760px** (≥1366)
- Copy stack `maxWidth`: **720px** · **760px**

### Travel (all breakpoints)
- Removed `numberOfLines={2}` on hero title — full text, natural wrap
- Title `maxWidth`: **680px** · **720px** (large desktop)
- Text stack `maxWidth`: **680px** · **720px** (dynamic inline)
- `textSafeWidthPercent`: 58 → **62**

## Evidence

`docs/design/evidence/wave-3b-local-travel-dynamic-hero-title-wrap-fix-1/`

Capture: `node scripts/capture-local-travel-dynamic-hero-title-wrap-fix-1.mjs`
