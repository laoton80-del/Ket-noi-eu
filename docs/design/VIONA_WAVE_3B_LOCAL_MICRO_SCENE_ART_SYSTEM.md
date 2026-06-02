# VIONA Wave 3B — Local micro-scene art system

**Pack:** `VIONA.WAVE_3B.LOCAL_MICRO_SCENE_ART_SYSTEM.1`  
**Status:** Ready for visual review — **NOT COMMITTED**

## Decision

Command-center layout/geometry is correct. Flagship micro-scenes moved from draft wireframe SVG to a **dedicated filled luminous art system**.

## Architecture

| Layer | File | Role |
|-------|------|------|
| Router | `LocalVectorMicroScene.tsx` | When `replicaFlagship` + flagship key → art system |
| Art system | `LocalFlagshipMicroScene.tsx` | Four filled SVG illustrations + shared platform/glow primitives |
| Fallback | `LocalVectorMicroScene.tsx` scene functions | Secondary / non-flagship tiles unchanged |

## Flagship scenes

1. **My requests** — tracker path, filled nodes, status beacon (emerald + cyan)
2. **Booking assist** — filled calendar body, 2×2 cells, glowing draft slot (cyan + emerald)
3. **Legal & wealth** — filled scales, document, shield (gold + cyan; no payment symbols)
4. **Discover** — storefront awning, service pillars, hub door (violet + emerald)

## Art rules

- SVG vector only; no PNG/raster
- Filled shapes + rim highlights; not stroke-only wireframes
- One hero object + 2–3 support details
- Platform glow under composition
- `preserveAspectRatio="xMidYMax meet"` in lower scene band

## Evidence

`docs/design/evidence/wave-3b-local-micro-scene-art-system/`  
`node scripts/capture-local-micro-scene-art-system.mjs`

## Estimated composite

**~94–96 / 100** (reference PNG compare recommended)

## Commit

**DO NOT COMMIT** until flagship scenes match uploaded VIONA reference quality.
