# VIONA Wave 3B — Local hero asset system and size lock

**Pack:** `VIONA.WAVE_3B.LOCAL_HERO_ASSET_SYSTEM_AND_SIZE_LOCK.1`
**Type:** Asset architecture + registry + wiring (no image generation, no business logic changes)

## Scope

- Added Local-only hero asset registry and visual config.
- Wired opening-stage hover state to dynamic hero key switching.
- Added safe fallbacks so missing future assets never crash.

## Locked filenames and dimensions

Dynamic hero assets (required target size: **1600x520**):

- `local-hero-default-1600x520.png`
- `local-hero-my-requests-1600x520.png`
- `local-hero-booking-assist-1600x520.png`
- `local-hero-legal-wealth-1600x520.png`
- `local-hero-browse-services-1600x520.png`

Optional future night variants (not required in current pack):

- `local-hero-default-night-1600x520.png`
- `local-hero-my-requests-night-1600x520.png`
- `local-hero-booking-assist-night-1600x520.png`
- `local-hero-legal-wealth-night-1600x520.png`
- `local-hero-browse-services-night-1600x520.png`

Optional card crops (required target size: **640x360**):

- `local-card-my-requests-640x360.png`
- `local-card-booking-assist-640x360.png`
- `local-card-legal-wealth-640x360.png`
- `local-card-browse-services-640x360.png`

Asset folder reserved:

- `assets/viona/local/hero/`

## Registry and visual config

- `src/design/vionaLocalHeroAssets.ts`
  - exports `LocalHeroVisualKey`
  - exports `LOCAL_HERO_ASSETS`, `LOCAL_HERO_CARD_ASSETS`
  - exports `getLocalHeroAsset(key)`, `getLocalHeroCardAsset(key)`
  - safe fallback behavior to current Local hero/card images
- `src/design/vionaLocalHeroVisuals.ts`
  - visual spec map per hero key
  - includes accent, secondary accent, network intensity, object position, scrim strength, mood metadata, and expected filenames

## Daylight-first art direction

- Local should feel **daily-life, friendly, premium, and globally useful**.
- Local is **not** full cyber-night by default.
- Preferred moods by key:
  - `default`: `goldenHour` or `daylight`
  - `myRequests`: `daylight` / `goldenHour`
  - `bookingAssist`: `goldenHour`
  - `legalWealth`: `daylight` / `goldenHour`
  - `browseServices`: `daylight` / `goldenHour`
- Keep subtle VIONA network lighting only; avoid dense neon dominance.
- Keep left **42% text-safe zone**, with subject/action centered to the right.
- No baked text, logos, or UI controls in source imagery.
- No fake production cues: payment success, accepted/confirmed legal outcome, rescue/emergency response, or guaranteed success states.

## Interaction wiring

- `LocalOpeningStageLayout` now owns visual-only `activeHeroKey` state.
- Default key is `default`.
- `LocalHeroCardsRow` sends hover events (`onHeroCardHover`, `onHeroCardLeave`) on desktop web.
- `LocalDynamicHero` resolves hero image by `activeHeroKey` and crossfades on key change.
- Mobile/touch press behavior remains unchanged.

## Safety boundaries

- No route changes.
- No handler removal.
- No payment/wallet/AI/SOS/backend/auth/classifieds business logic changes.
- No Home or other-universe screen changes.

## Evidence

Run:

```bash
node scripts/capture-local-hero-asset-system-size-lock.mjs
```

Output:

`docs/design/evidence/wave-3b-local-hero-asset-system-size-lock/`
