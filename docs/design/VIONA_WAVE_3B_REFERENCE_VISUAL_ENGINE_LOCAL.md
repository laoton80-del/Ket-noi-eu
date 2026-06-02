# VIONA Wave 3B — Reference Visual Engine (Local)

Pack: `VIONA.WAVE_3B.REFERENCE_VISUAL_ENGINE_LOCAL.1`

## Purpose

Reusable Local-only **material and light system** for command-center panel and flagship cards — not layout geometry, not card height tuning.

North star: uploaded six-universe VIONA reference (crystal glass, layered refraction, semantic neon, premium micro-scene icon art).

## Architecture

| Layer | File |
|-------|------|
| Tokens | `src/design/vionaReferenceVisualTokens.ts` |
| Primitives | `src/components/viona/VionaReferenceGlass.tsx` |
| Panel | `src/components/viona/local/LocalCommandCenterPanel.tsx` → `VionaReferenceGlassPanel` |
| Flagship cards | `src/components/viona/PremiumAppTile.tsx` → `VionaReferenceGlassCard` (`commandCenterFlagship`) |
| Micro-scenes | `src/components/viona/local/LocalFlagshipMicroScene.tsx` |

## Token groups

- `emerald`, `cyan`, `gold`, `violet`, `magenta`, `neutral glass`
- Per semantic: crystal/deep fill, inner rim, edge highlight, specular top, lower refraction, semantic glow, floor reflection, scene bloom, text veil
- Panel: crystal gradient, horizon glow, flagship floor glow, refraction grid opacity, backdrop blur

## Glass primitives

- `VionaGlassSurface` — layered transparent fills
- `VionaGradientBorder` — thin semantic neon edge
- `VionaInnerRim`, `VionaSpecularShine`, `VionaRefractionGlow`, `VionaAmbientGlow`
- `VionaFloorReflection`, `VionaSceneBloom`, `VionaTextReadabilityVeil`
- Composites: `VionaReferenceGlassCard`, `VionaReferenceGlassPanel`

## Safety (unchanged)

- REQUEST-ONLY · NO CHARGE · NO PAYMENT CAPTURED · CONFIRMED ≠ PAID
- No paid/settled/payout/escrow/guaranteed booking/fake merchant/payment success/dispatch/AI fulfillment cues in art

## QA capture

```bash
npx expo start --web --port 8088
node scripts/capture-viona-reference-visual-engine-local.mjs
```

Evidence: `docs/design/evidence/wave-3b-reference-visual-engine-local/`

## Visual scoring (honest)

Score each capture 0–10 on: glass transparency, layered lighting, card shell vs reference, micro-scene art, product family.

**Any score &lt; 8 → NOT READY.** Do not commit until reference parity confirmed side-by-side with uploaded PNG.
