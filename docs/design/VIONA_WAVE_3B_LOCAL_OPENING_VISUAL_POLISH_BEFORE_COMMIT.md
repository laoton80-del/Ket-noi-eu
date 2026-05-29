# VIONA Wave 3B — Local opening visual polish before commit

**Pack:** `VIONA.WAVE_3B.LOCAL_OPENING_VISUAL_POLISH_BEFORE_COMMIT.1`  
**Type:** Final visual polish pass (IA unchanged)

## Scope

- Preserve approved Local IA and behavior.
- Improve perceived quality of opening visuals to be closer to Home:
  - hero readability/crop validation
  - four hero cards visual fill
  - compact LOCAL FOR YOU retained
  - lower sections remain de-emphasized and lower-priority

## Changes

- Four hero cards now use lightweight photographic backgrounds (existing approved assets):
  - `viona-home-local-night-market.png`
  - `viona-home-travel-airport.png`
  - `viona-home-business-shop-import.png`
  - `viona-home-academy-learning.png`
- No IA reordering.
- No handler or route changes.
- No payment/wallet/AI/SOS/backend logic changes.

## Why

The previous card shells were structurally correct but could read as visually empty.  
Adding restrained photo-forward fills aligns card grammar with Home world-card quality while keeping Local hero as dominant.

## QA capture

Run:

```bash
node scripts/capture-local-opening-visual-polish-before-commit.mjs
```

Output:

`docs/design/evidence/wave-3b-local-opening-visual-polish-before-commit/`
