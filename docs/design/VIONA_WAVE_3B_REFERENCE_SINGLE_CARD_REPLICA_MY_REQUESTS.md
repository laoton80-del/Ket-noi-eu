# VIONA Wave 3B — Single-Card Replica (My Requests)

Pack: `VIONA.WAVE_3B.REFERENCE_SINGLE_CARD_REPLICA_MY_REQUESTS.1`

## Visual truth

`docs/design/reference/viona-reference-local-card-my-requests.png`

Comparison-only — not app artwork.

## Lab

| Piece | File |
|-------|------|
| Side-by-side lab | `src/components/viona/reference/VionaReferenceSingleCardLab.tsx` |
| Proportions | `vionaReferenceLabSingleCardMyRequests` in `vionaReferenceVisualTokens.ts` |

**LEFT:** reference PNG · **RIGHT:** implemented card (lab-only shell + SVG beacon).

## Dev route (env-gated)

- URL: `/viona-reference-single-card-my-requests`
- `EXPO_PUBLIC_VIONA_REFERENCE_SINGLE_CARD_LAB=true` (restart Expo after set)
- Not enabled in `__DEV__` alone — explicit env only

## Capture

```bash
EXPO_PUBLIC_VIONA_REFERENCE_SINGLE_CARD_LAB=true npx expo start --web --port 8088
node scripts/capture-viona-reference-single-card-my-requests.mjs
```

Evidence v1: `docs/design/evidence/wave-3b-reference-single-card-my-requests/`
Evidence v2.1: `docs/design/evidence/wave-3b-reference-single-card-my-requests-v2/`
Evidence v3.1: `docs/design/evidence/wave-3b-reference-single-card-my-requests-v3/`

## v3.1 changes

- Pin scale 0.68 (~10% smaller vs v2.1), lowered into starburst/mesh
- 30 mesh nodes, 24 edges, 12 background lines, 5 foreground nodes
- 10-ray starburst + dual beam + base bloom
- Darker black crystal body; minimal card green wash
- Softer broad outer border glow (1px border)
- Warmer emerald title hue

## v2.1 changes

- Lab CTA removed (reference crop has none; production may re-add later)
- Dense lower network landscape (12 nodes, mesh lines, terrain curves)
- Base starburst + vertical beam + platform glow under pin
- Smaller integrated pin with halo + request-status check marker (lab only)
- Softer border/glass; subtle lower atmosphere; darker top for text
- Subtitle split into three reference-style lines

## Scoring (0–10 each)

| Dimension | Gate |
|-----------|------|
| Card shell parity | ≥ 8 |
| Black crystal feel | ≥ 8 |
| Gradient border quality | ≥ 8 |
| Icon artwork quality | ≥ 8 |
| Lighting/refraction | ≥ 8 |
| Same product family | ≥ 8 |

**Any &lt; 8 → NOT MATCHED.** Do not proceed to 4-card panel.

## Safety

- No payment/success/check cues in SVG
- No production Local / PremiumAppTile changes
