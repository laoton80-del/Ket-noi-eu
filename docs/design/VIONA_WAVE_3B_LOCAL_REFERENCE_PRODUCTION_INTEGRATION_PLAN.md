# VIONA Wave 3B — Local Reference Production Integration Plan (Phase E)

**Status: PLAN ONLY — not implemented in REBUILD.1 pack.**

## Prerequisites

- Material lab primitives validated vs reference
- My Requests single-card lab ≥8 on all dimensions
- Remaining three flagship cards pass individual ≥8 gates
- Panel composition lab ≥8 on all dimensions

## Production-safe components (candidate)

| Lab primitive | Production target | Notes |
|---------------|-------------------|-------|
| `VionaCrystalPanelLab` | `LocalCommandCenterPanel` shell | Replace or wrap `VionaReferenceGlassPanel` |
| `VionaCrystalCardLab` | `PremiumAppTile` `commandCenterFlagship` path | New opt-in variant, not default until QA |
| `VionaSpecularOverlayLab` | Shared glass layer module | Merge into `VionaReferenceGlass` or parallel export |
| `VionaRefractionOverlayLab` | same | |
| `VionaLuminousFloorLab` | Panel + card floor | |
| `VionaTextGlowLab` | Flagship card typography | i18n strings unchanged |
| `MyRequestsHeroScene` | Dedicated flagship art component | Per-card siblings for booking/legal/community |

## Tokens migration

| Lab token file | Production target |
|----------------|-------------------|
| `vionaCrystalLabTokens.ts` | Merge patterns into `vionaReferenceVisualTokens.ts` after lab sign-off |
| Lab proportions | `vionaReferenceLabLocalPanel` / card metrics |

## Assets (hybrid strategy)

| Asset | Use |
|-------|-----|
| `docs/design/reference/viona-reference-local-card-my-requests.png` | QA comparison only |
| Future: `assets/viona/lab-overlays/` | Optional specular/refraction PNG strips if SVG insufficient |
| Per-flagship SVG scenes | `src/components/viona/local/flagshipScenes/` (new, post-gate) |

## Production files to touch (next pack only)

- `src/screens/b2c/LocalScreen.tsx` — wire new panel only after lab gate
- `src/components/viona/local/LocalCommandCenterPanel.tsx` — shell swap
- `src/components/viona/PremiumAppTile.tsx` — flagship card material path
- `src/components/viona/local/LocalFlagshipMicroScene.tsx` — replace with dedicated scenes or deprecate generic path
- `src/design/vionaReferenceVisualTokens.ts` — promoted lab values
- `App.tsx` / routes — remove or keep dev lab routes behind env

## Explicitly not in integration pack

- Payment / wallet / SOS / AI routes
- i18n copy meaning changes
- Safety chip semantics
- Business handlers

## Rollout order

1. Promote material primitives to shared module
2. Ship My Requests flagship scene + card shell behind feature flag
3. Add remaining flagship scenes one-by-one with individual QA
4. Swap panel composition
5. Remove legacy procedural tweaks from production Local path
