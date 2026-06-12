# Local flagship scene salvage — dormant reference pack

**Generated:** 2026-06-12
**Pack:** `PACK_LOCAL_FLAGSHIP_SCENE_SALVAGE_DORMANT_FROM_WIP`

## Source

* Parked WIP worktree: `c:\KNG\ket-noi-eu`
* Parked branch: `viona/visual-tile-wip-isolate` @ `6e49303` (superseded by PR #54 / `3766063`)
* Salvage base: `origin/master` @ `0becdfa`
* Salvage branch: `viona/local-flagship-scene-salvage`

## Copied files (untracked → clean branch)

| File | Role |
|------|------|
| `src/components/viona/local/LocalFlagshipSceneAssetLayer.tsx` | PNG-primary flagship micro-scene layer with vector fallback |
| `src/design/vionaLocalFlagshipSceneAssets.ts` | Asset registry for `assets/viona/reference/local/flagships/` |
| `src/components/viona/local/LocalCommandCenterPanel.tsx` | Reference-style Local command-center panel chrome |

## Dormant status

* **No live wiring** — none of these symbols are imported by screens, `App.tsx`, or navigation.
* **No runtime claim** — PNG requires remain commented; missing assets resolve to null and procedural vector fallback.
* **No assets copied** — target folder placeholders not required; registry uses commented `require()` stubs only.
* **Travel / App / navigation untouched** on this branch.

## Gates

Salvage commit validated with: `tsc`, forbidden claims (default/strict), AI readiness, route inventory, `git diff --check`, smoke, conflict-marker grep.

## Future pack recommendation

When operator approves Local flagship PNG artwork:

1. Import PNGs under `assets/viona/reference/local/flagships/`
2. Uncomment registry requires in `vionaLocalFlagshipSceneAssets.ts`
3. Wire `LocalFlagshipSceneAssetLayer` into Local flagship tiles behind feature flag or Reference Lab only first
4. Optionally use `LocalCommandCenterPanel` in Reference Lab / design review before production Local hub

Do not wire from this salvage branch without explicit Local visual pack scope and QA evidence.
