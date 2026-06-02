# VIONA Wave 3B — Local Reference Visual Engine Rebuild

Pack: `VIONA.WAVE_3B.LOCAL_REFERENCE_VISUAL_ENGINE_REBUILD.1`

## Mission

Reference-first visual engine for Local universe hero panel. **Labs only** — no production `LocalScreen` integration in this pack.

## Lab routes (env-gated)

| Phase | URL | Env |
|-------|-----|-----|
| A Material | `/viona-reference-material-lab` | `EXPO_PUBLIC_VIONA_REFERENCE_MATERIAL_LAB=true` |
| B Single card | `/viona-reference-single-card-my-requests` | `EXPO_PUBLIC_VIONA_REFERENCE_SINGLE_CARD_LAB=true` |
| C Flagship×4 | `/viona-reference-flagship-cards-lab` | `EXPO_PUBLIC_VIONA_REFERENCE_FLAGSHIP_CARDS_LAB=true` (blocked) |
| D Panel | `/viona-reference-panel-composition-lab` | `EXPO_PUBLIC_VIONA_REFERENCE_PANEL_COMPOSITION_LAB=true` |

Legacy: `/viona-reference-local-panel-lab` (pre-engine panel lab).

## Engine primitives

| Component | Path |
|-----------|------|
| `VionaCrystalPanelLab` | `src/components/viona/reference/engine/` |
| `VionaCrystalCardLab` | same |
| `VionaSpecularOverlayLab` | same |
| `VionaRefractionOverlayLab` | same |
| `VionaLuminousFloorLab` | same |
| `VionaTextGlowLab` | same |
| `MyRequestsHeroScene` | `engine/labs/myRequests/` |
| `MyRequestsReplicaCard` | same |

Tokens: `src/design/vionaCrystalLabTokens.ts` (lab-only).

## Capture

```bash
EXPO_PUBLIC_VIONA_REFERENCE_MATERIAL_LAB=true \
EXPO_PUBLIC_VIONA_REFERENCE_SINGLE_CARD_LAB=true \
EXPO_PUBLIC_VIONA_REFERENCE_PANEL_COMPOSITION_LAB=true \
npx expo start --web --port 8088

node scripts/capture-viona-reference-material-lab.mjs
node scripts/capture-viona-reference-single-card-my-requests.mjs
node scripts/capture-viona-reference-panel-composition-lab.mjs
```

Evidence folders under `docs/design/evidence/wave-3b-reference-*`.

## Gates

- Phase B My Requests: all dimensions ≥8 before Phase C
- Phase C: each flagship card ≥8 individually
- Phase D panel: all dimensions ≥8 before production integration

See `VIONA_WAVE_3B_LOCAL_REFERENCE_PRODUCTION_INTEGRATION_PLAN.md` for Phase E (plan only).
