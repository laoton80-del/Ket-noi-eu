# VIONA Wave 3B — Local reference 100% match (micro-final pack)

**Pack:** `VIONA.WAVE_3B.LOCAL_REFERENCE_100_MATCH_MICRO_FINAL.1`  
**Status:** Ready for visual review — **NOT COMMITTED**  
**Baseline (post-luminance):** ~90–91 / 100  
**Target:** ≥ 92 / 100; as close as possible to uploaded six-universe reference

## Scope

Micro-final pass on **replica flagship** vector scenes only. No layout geometry, panel structure, ordering, routes, copy, or i18n changes.

## Residual gaps addressed

| Gap | Fix |
|-----|-----|
| Booking reads as grid + beam | Single centered **calendar hero** (100×88); 2×3 strong cells; active slot marker **inside** cell (no external beam/arc) |
| Discover center weak at 390px | Center hub **r28 / r20 / r11** + emerald cross; lighter pavilion stroke; 2 side nodes + 1 short arc |
| 390px interior fill | Flagship wash **0.36**; stronger text veil top stop; `FlagshipReplicaBase` orb/plate +4% opacity |

## Files

- `src/components/viona/local/LocalVectorMicroScene.tsx`
- `src/components/viona/PremiumAppTile.tsx` (wash + veil tokens only)

## Evidence

`docs/design/evidence/wave-3b-local-reference-100-match-micro-final/`  
`node scripts/capture-local-reference-100-match-micro-final.mjs`

## Estimated composite

**~92–94 / 100** (pending reference PNG side-by-side)

## Commit

**DO NOT COMMIT** until visual QA confirms ≥ 92 against uploaded reference.
