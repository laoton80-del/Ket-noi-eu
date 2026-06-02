# VIONA Wave 3B — Local reference 100% match (scene luminance pack)

**Pack:** `VIONA.WAVE_3B.LOCAL_REFERENCE_100_MATCH_SCENE_LUMINANCE.1`  
**Status:** Ready for visual review — **NOT COMMITTED**  
**Baseline (post-geometry):** ~87–89 / 100  
**Target commit gate:** ≥ 92 / 100

## Scope

Interior bloom and luminous vector micro-scenes for **command-center flagship** tiles only. Geometry from `LOCAL_REFERENCE_100_MATCH_GEOMETRY.1` is preserved (heights, 58% scene slot, 60% wash band, 36% text veil, `flagshipFloor`, desktop max-width 176px).

## Changes

| Area | Implementation |
|------|----------------|
| Replica palette | `replicaFlagship` → brighter stroke/ink, +24% stroke mul, layered `NeonPath` / `NeonLine` glow |
| Scene staging | `SceneStage` scale **1.26** for replica; shell fill **+8%** |
| Shared replica base | `FlagshipReplicaBase` — dual ambient orbs + luminous platform |
| My requests | Emerald/cyan timeline; bright check node; short arc (no long network) |
| Booking assist | Large cyan calendar grid; luminous emerald appointment beam |
| Legal & wealth | Gold scales pillar + cyan document + shield (no payment cues) |
| Discover / community | Violet hub + emerald nodes; short paired arcs |
| Card integration | Scene wash opacity **0.32**; subtle `flagshipFloor` ambient gradient |
| Non-flagship scenes | Unchanged (non-replica branch) |

## Files

- `src/components/viona/local/LocalVectorMicroScene.tsx`
- `src/components/viona/PremiumAppTile.tsx` (wash opacity token)
- `src/components/viona/local/LocalCommandCenterPanel.tsx` (floor ambient only)

## Evidence

`docs/design/evidence/wave-3b-local-reference-100-match-scene-luminance/`  
Capture: `node scripts/capture-local-reference-100-match-scene-luminance.mjs`

## Estimated score (post-pack)

| Dimension | Δ | Notes |
|-----------|---|-------|
| Micro-scene quality | +12–16 | Replica paths, bloom, semantic vividness |
| Premium / wow | +4–6 | Interior luminance vs muddy wireframe |
| Color and glow | +2–3 | Wash + platform integration |
| **Composite** | **~90–93** | Visual QA on captures required to confirm ≥ 92 |

## Preserved

- All Local modules below panel unchanged
- Safety chips: REQUEST-ONLY, NO CHARGE, NO PAYMENT CAPTURED, CONFIRMED ≠ PAID
- No routes, payment, wallet, AI, SOS, i18n, or PNG assets

## Commit

**DO NOT COMMIT** until captures confirm reference-grade flagship scenes and composite ≥ 92.

---

## Micro-final follow-up (2026-05-20)

Pack `LOCAL_REFERENCE_100_MATCH_MICRO_FINAL.1` — booking calendar hero simplification, discover center mass, flagship wash **0.36**. See `VIONA_WAVE_3B_LOCAL_REFERENCE_100_MATCH_MICRO_FINAL.md` and evidence `wave-3b-local-reference-100-match-micro-final/`.
