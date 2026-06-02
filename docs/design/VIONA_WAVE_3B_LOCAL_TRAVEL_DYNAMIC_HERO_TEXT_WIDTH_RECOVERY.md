# VIONA WAVE 3B — Local + Travel Dynamic Hero Text Width Recovery

**Pack:** `VIONA.WAVE_3B.LOCAL_TRAVEL_DYNAMIC_HERO_TEXT_WIDTH_RECOVERY.1`

## Root cause

| Issue | Cause |
|-------|-------|
| Narrow text column | Nested `maxWidth` on title (680) vs subtitle (620) inside 680 stack |
| Local visual squeeze | `leftScrim` hard `maxWidth: 420px` capped readable area |
| Travel chip wrap | `flexWrap: 'wrap'` + 680px box too tight for 3 Czech chip labels |
| Ugly title wrap | 44–46px title in 520–680px column forced multi-line vertical stack |

## Fix

- Unified copy stack width: **46% viewport (1024–1365) / 48% (≥1366)**, clamped **680–760px**
- Title/subtitle/chips share **same stack width** (no nested narrower caps)
- Typography balanced: **42/44px title**, **20px subtitle** (was 44–46 / 21)
- Travel chips: **`flexWrap: 'nowrap'`** on desktop + `flexShrink: 0` on labels
- Local scrim: **52% width**, dynamic `maxWidth` up to **824px** (stack + 64)
- Local `nowrap` title: **≥1366 only** (1024 may wrap naturally)

## Evidence

`docs/design/evidence/wave-3b-local-travel-dynamic-hero-text-width-recovery/`

Capture: `node scripts/capture-local-travel-dynamic-hero-text-width-recovery.mjs`
