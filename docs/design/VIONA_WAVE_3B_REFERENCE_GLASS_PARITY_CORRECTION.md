# VIONA Wave 3B — Reference Glass Parity Correction

Pack: `VIONA.WAVE_3B.REFERENCE_GLASS_PARITY_CORRECTION.1`

## Intent

Shift Local command-center from **frosted/teal milky glass** to **dark crystal glass** per uploaded six-universe reference:

- Dark transparent bodies (not large semantic washes)
- Vivid thin gradient borders + edge glow
- Inner rim, corner/top specular, lower refraction band
- Skyline visible through panel
- Luminous micro-scenes on dark card floor

## Changes

| Area | Correction |
|------|------------|
| Tokens | Lower body tint alphas; brighter 4-stop borders; semantic color on edges/refraction only |
| `VionaReferenceGlass` | Removed ambient/scene bloom washes; added corner specular + top edge line |
| Panel | Reduced horizon/floor fog; skyline first; crisp white/cyan top rail |
| Flagship cards | No scene wash overlay; veil-only text protection |
| Micro-scenes | +hero mass/brightness; removed decorative particles |

## QA

```bash
npx expo start --web --port 8088
node scripts/capture-viona-reference-glass-parity-correction.mjs
```

Evidence: `docs/design/evidence/wave-3b-reference-glass-parity-correction/`

Gate: any dimension &lt; 8 → **NOT READY**. Do not commit until reference parity confirmed.
