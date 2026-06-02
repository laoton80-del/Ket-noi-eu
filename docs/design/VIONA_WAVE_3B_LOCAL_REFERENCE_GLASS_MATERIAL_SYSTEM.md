# VIONA Wave 3B — Local reference glass material system

**Pack:** `VIONA.WAVE_3B.LOCAL_REFERENCE_GLASS_MATERIAL_SYSTEM.1`  
**Status:** Ready for visual review — **NOT COMMITTED**  
**Baseline:** ~60–70% vs uploaded reference (opaque shells)  
**Scope:** Material/glass/lighting only — micro-scene artwork unchanged

## Tokens

`src/design/vionaGlassMaterialTokens.ts`

- Panel: crystal fill, inner rim, specular top, horizon glow, flagship floor reflection, backdrop blur
- Flagship card: transparent surface, glass tint, inner rim, specular shine, bottom refraction, scene floor glow, CTA glass orb

## Integration

| Surface | File |
|---------|------|
| Command-center panel | `LocalCommandCenterPanel.tsx` |
| Flagship tiles | `PremiumAppTile.tsx` (`commandCenterFlagship`) |

## Evidence

`docs/design/evidence/wave-3b-local-reference-glass-material-system/`  
`node scripts/capture-local-reference-glass-material-system.mjs`

## Estimated composite

**~78–84 / 100** (material layer); full reference match still needs micro-scene art rebuild pack.

## Commit

**DO NOT COMMIT** until panel + cards read as crystal glass vs reference PNG.
