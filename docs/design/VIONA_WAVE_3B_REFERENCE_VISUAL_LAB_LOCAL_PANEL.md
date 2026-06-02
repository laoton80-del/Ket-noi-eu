# VIONA Wave 3B — Reference Visual Lab (Local Panel)

Pack: `VIONA.WAVE_3B.REFERENCE_VISUAL_LAB_LOCAL_PANEL.1`

## Purpose

Isolated **reference visual lab** for one Local Universe panel from the uploaded six-universe reference. Not production `LocalScreen`, not `PremiumAppTile`, not `LocalCommandCenterPanel`.

North star: uploaded reference PNG (visual truth). Code/SVG only — no generated poster art.

## Component

| Piece | File |
|-------|------|
| Lab panel + cards + micro-scenes | `src/components/viona/reference/VionaReferenceLocalPanelLab.tsx` |
| Lab proportions | `vionaReferenceLabLocalPanel` in `src/design/vionaReferenceVisualTokens.ts` |
| Glass primitives (reuse) | `src/components/viona/VionaReferenceGlass.tsx` |

## Lab cards (English, visual-only)

1. My Requests — emerald beacon micro-scene
2. Booking Assist — cyan calendar micro-scene
3. Legal & Wealth — gold scales micro-scene
4. Community Events / Services — violet community hub micro-scene

## Dev capture route

- URL: `/viona-reference-local-panel-lab`
- Enabled in `__DEV__` or `EXPO_PUBLIC_VIONA_REFERENCE_LOCAL_PANEL_LAB=true`
- `testID`: `viona-reference-local-panel-lab`, `viona-reference-local-panel-lab-panel`

## QA capture

```bash
npx expo start --web --port 8088
node scripts/capture-viona-reference-local-panel-lab.mjs
```

Evidence: `docs/design/evidence/wave-3b-reference-local-panel-lab/`

## Scoring (0–10 each)

| Dimension | Gate |
|-----------|------|
| Panel resemblance | ≥ 8 |
| Crystal glass | ≥ 8 |
| Card shell | ≥ 8 |
| Icon artwork | ≥ 8 |
| Lighting/refraction | ≥ 8 |
| Product family | ≥ 8 |

**Any score &lt; 8 → NOT MATCHED.** Do not suggest production integration.

## Safety

Lab is visual-only. No payment, wallet, SOS, AI, or request handlers.
