# VIONA Wave 3B — Home Dynamic Hero Semantic Light / Frame Cleanup + For You Scale

Task ID: `VIONA.WAVE_3B.HOME_DYNAMIC_HERO_SEMANTIC_LIGHT_FRAME_CLEANUP_AND_FOR_YOU_SCALE.1`

## Fixes

### A. Academy semantic lighting
- **Root cause:** Academy `secondaryAccent` was `accentMagenta` (`#ff7cc6`), used for the secondary network node and second pulse dot → visible pink segment.
- **Fix:** Academy secondary → `#B56DFF` (violet family, matches Local hero academy spec).

### B. Double hero frame
- **Root cause:** Stacked neutral shell rim + inset inner rim + inner frame depth + semantic frame tint + hover border (1.5px).
- **Fix:** Single rim grammar — rest shell uses one outer rim + depth; lit state defers shell rim to depth-only + one semantic hover border (1px).

### C. For You scale
- Pill `minHeight` 46→48, capsule 28→30, icon 18→19, label 14/18→15/19.

## Evidence

`docs/design/evidence/wave-3b-home-polish/`

## Commit status

NOT COMMITTED.
