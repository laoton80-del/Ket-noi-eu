# VIONA Wave 3B — Local reference 100% match (text-fit final gate)

**Pack:** `VIONA.WAVE_3B.LOCAL_REFERENCE_100_MATCH_TEXT_FIT_FINAL_GATE.1`  
**Status:** Ready for visual review — **NOT COMMITTED**  
**Baseline (post micro-final):** ~92–94 / 100

## Scope

Final gate: localized **title fit**, header rhythm, and **Legal / My Requests** scene brightness balance only. No geometry, routes, i18n keys, or panel structure changes.

## Changes

| Area | Fix |
|------|-----|
| Flagship titles | **2 lines** (`numberOfLines={2}`); full text block width; **11/13** compact extrabold |
| Flagship subtitles | **1 line**, 8.5px / 10.5 line-height |
| Panel header | Tighter padding; meta **7.5px**; chip row gap/margin reduced |
| Legal / My Requests scenes | Slightly stronger core fill, hero orb, and stroke weights |

## Evidence

`docs/design/evidence/wave-3b-local-reference-100-match-text-fit-final-gate/`  
`node scripts/capture-local-reference-100-match-text-fit-final-gate.mjs`

## Estimated composite

**~93–95 / 100** (reference PNG compare recommended)

## Commit

**DO NOT COMMIT** until Czech flagship titles read complete on 390×844 captures.
