# VIONA Wave 3B — Local reference 100% match (geometry pack)

**Pack:** `VIONA.WAVE_3B.LOCAL_REFERENCE_100_MATCH_GEOMETRY.1`  
**Status:** Ready for visual review — **NOT COMMITTED**  
**Baseline audit score:** 74/100  
**Target commit gate:** ≥ 92/100 (geometry slice only; luminance pack may still be required)

## Changes

| Area | Before | After |
|------|--------|-------|
| Flagship min-height | 110–118px | **136 / 142 / 144px** (mobile / tablet / desktop) |
| Scene slot height | ~50% | **58%** (+ wash 60%, veil 36%) |
| Panel header | 4 text bands + chips | Title row + **1 combined meta line** (subtitle · trust) + chips |
| Card grid container | `flagshipTray` bordered box | **`flagshipFloor`** — no inner border/fill |
| Desktop width | Full cell stretch | **`maxWidth: 176px`** per flagship tile + centered grid |

## Evidence

`docs/design/evidence/wave-3b-local-reference-100-match-geometry/` — `scripts/capture-local-reference-100-match-geometry.mjs`

## Next pack (if < 92)

`LOCAL_REFERENCE_100_MATCH_SCENE_LUMINANCE.1` — interior bloom, vector scale, muddy fill lift.

---

## Scene luminance follow-up (2026-05-20)

Pack `LOCAL_REFERENCE_100_MATCH_SCENE_LUMINANCE.1` applied on top of this geometry — **heights and slot % unchanged**. See `VIONA_WAVE_3B_LOCAL_REFERENCE_100_MATCH_SCENE_LUMINANCE.md` and evidence `wave-3b-local-reference-100-match-scene-luminance/`. Estimated composite after luminance: **~90–93** (pending capture QA).
