# VIONA Wave 3B — Local hero cinematic asset import and opening QA

**Pack:** `VIONA.WAVE_3B.LOCAL_HERO_CINEMATIC_ASSET_IMPORT_AND_OPENING_QA.1`  
**Type:** Final visual readiness check (structure preserved)

## Scope

- Validate Local opening hierarchy and hero readability/crop for commit readiness.
- Keep approved structure unchanged:
  1. `LocalDynamicHero`
  2. `LocalHeroCardsRow`
  3. `LocalQuickActionsRow` (`LOCAL FOR YOU`)
  4. Existing modules below (preserved)

## Hero asset status

- Preferred cinematic asset path checked:
  - `assets/viona/local/hero/viona-local-hero-cinematic-v1.png`
- Asset not present in repository for this pack.
- Fallback retained:
  - `src/assets/viona/home/viona-hero-local-1280x428.png`

## Hero QA tuning applied

- Added short-viewport hero compaction in `LocalDynamicHero`:
  - lower min/max hero height for landscape + short screens
  - prevents oversized hero in `844x390` while keeping premium proportion
- Refined web crop anchor:
  - desktop: `72% 38%`
  - narrow: `74% 40%`
  - compact/landscape: `76% 42%`
- Slight readability tuning:
  - stronger left scrim near copy rail
  - slightly stronger bottom handoff
  - preserves bright right-side cinematic field

## Opening hierarchy check

- Hero remains dominant.
- Four hero cards remain second priority.
- LOCAL FOR YOU remains compact third priority.
- Lower modules remain preserved and de-emphasized; no dashboard density reintroduced.

## Drift boundaries

- No structure changes to Local opening.
- No module deletion.
- No handler/route changes.
- No payment/wallet/AI/SOS/backend/auth changes.
- No fake production claims introduced.

## Evidence capture

Run:

```bash
node scripts/capture-local-hero-cinematic-opening-qa.mjs
```

Output:

`docs/design/evidence/wave-3b-local-hero-cinematic-opening-qa/`
