# VIONA Wave 3B — Local hero daylight variants spec

**Pack:** `VIONA.WAVE_3B.LOCAL_HERO_DAYLIGHT_VARIANTS_SPEC.1`  
**Type:** Spec update only (no image generation)

## Objective

Ensure Local hero art direction is day-friendly and globally useful, rather than night-only.

## Mood model

Supported moods:

- `daylight`
- `goldenHour`
- `nightNeon` (optional/future)

Preferred mood by hero key:

- `default`: `goldenHour` (or `daylight`)
- `myRequests`: `daylight`
- `bookingAssist`: `goldenHour`
- `legalWealth`: `daylight` (or `goldenHour`)
- `browseServices`: `daylight` (or `goldenHour`)

## Asset naming strategy

Required now (base set):

- `local-hero-default-1600x520.png`
- `local-hero-my-requests-1600x520.png`
- `local-hero-booking-assist-1600x520.png`
- `local-hero-legal-wealth-1600x520.png`
- `local-hero-browse-services-1600x520.png`

Optional later (night variants):

- `local-hero-default-night-1600x520.png`
- `local-hero-my-requests-night-1600x520.png`
- `local-hero-booking-assist-night-1600x520.png`
- `local-hero-legal-wealth-night-1600x520.png`
- `local-hero-browse-services-night-1600x520.png`

## Art direction guardrails

- Local is not cyberpunk-only/night-only.
- Prefer realistic cinematic **daylight** or **golden-hour** local city/community scenes.
- Add subtle VIONA lighting network only; keep it restrained.
- Keep left 42% text-safe.
- Keep visual subject/action center-right.
- No baked text.
- No baked UI controls/buttons.
- No fake cues:
  - payment success/settled
  - confirmed/accepted legal result
  - rescue/emergency response success
  - official approval/success claims

## Technical notes

- Runtime remains fallback-safe if mood-specific variants are missing.
- Base heroes are source-of-truth now; night variants are additive later.
