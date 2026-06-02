# VIONA WAVE 3B — Local Opening Stage Premium Air Gap Parity

**Pack:** `VIONA.WAVE_3B.LOCAL_OPENING_STAGE_PREMIUM_AIR_GAP_PARITY.1`

## Change

Added responsive display-only bonus to `heroCardsBridge` `marginTop` in `LocalOpeningStageLayout`. Hero first-view lock math unchanged (hero height and card dimensions fixed).

| Breakpoint | Before | After | Δ |
|------------|--------|-------|---|
| Desktop web (≥1024) | 6px | 20px | +14px |
| Desktop fullscreen | 16px | 24px | +8px |
| Tablet (768–1023) | 6px* | 20px | +14px |
| Mobile (<768) | 6px | 14px | +8px |
| Landscape short (h<520 or wide) | — | ~55% of bonus | compact |

\*Tablet previously inherited desktop 6px base (no width branch).

Travel parity reference (same pack family): desktop 20px, fullscreen 24px, tablet 22px, mobile 24px.

Optional cards → “Local cho bạn” bridge unchanged (52px normal / 6px fullscreen lock paths sufficient).

## Evidence

`docs/design/evidence/wave-3b-local-opening-stage-premium-air-gap-parity/`

Capture: `node scripts/capture-local-opening-stage-premium-air-gap-parity.mjs`
