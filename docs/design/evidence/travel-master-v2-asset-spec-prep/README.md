# Travel master v2 asset spec prep — evidence note

**Pack:** `PACK_TRAVEL_MASTER_V2_ASSET_SPEC_PREP`
**Date:** 2026-06-12
**Branch context:** `viona/travel-multi-scene-restore` @ `8ace3ea` (restore art-directed alternate hero scenes)

## Summary

Travel multi-scene hero **runtime architecture is restored** and active-layer proof succeeded:

- Alternate heroes render on `travel-dynamic-hero-active-overlay-image` (translation → `interpreter`, taxi → `rides`, emergency → `emergencyPolice`).
- Default/journey master remains on the base layer (accepted).
- Hover lighting network is present; heavy full-image wash is suppressed on alternates.
- Art-directed cover dezoom + focal nudge is applied per alternate key in `TravelScreen.tsx`.

## Why code-only polish hit an asset ceiling

Operator verdict and QA evidence (`travel-restore-alt-hero-art-directed-premium-frame-20260612-0816/`) show:

- Current alternate **source rasters** are too close/cropped for the wide master hero frame.
- Dezoom and object-position tuning improve framing but cannot recover subjects that were composed for a tighter crop.
- The default Travel airport master is acceptable; **translation / rides / emergency** need new masters, not more code scaling.

## Next required step

**New Travel master v2 assets** following **Local Bright** ultra-wide standard.

Staging spec and drop folder:

`assets/viona/dynamic-hero/_incoming-travel-master-v2-local-standard/README.md`

Required v2 filenames:

1. `travel-translation-assist-web-normal-master-v2.png`
2. `travel-rides-assist-web-normal-master-v2.png`
3. `travel-emergency-police-web-normal-master-v2.png`

Optional: `travel-airport-web-normal-master-v2.png` if default is replaced later.

## Scope of this pack

- **Docs / spec only** — no runtime, navigation, or asset binary changes.
- No `TravelScreen.tsx` edits in this pack.
- Wiring pack to follow after operator-approved PNGs land in the incoming folder.

## Recommendation

**A) Drop in Travel master v2 assets** per staging README, then run a wire + light art-direction tune pack.
