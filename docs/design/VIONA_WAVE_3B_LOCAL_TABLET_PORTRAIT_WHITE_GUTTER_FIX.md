# VIONA Wave 3B — Local tablet portrait white gutter fix

**Pack:** `VIONA.WAVE_3B.LOCAL_TABLET_PORTRAIT_WHITE_GUTTER_FIX.1`
**Type:** Web layout + capture background fix (no IA/asset/logic changes)

## Root cause

- On web at exactly `768px` viewport width, the app navigation shell keeps `maxWidth: 600` (`isLargeScreen` is `width > 768`).
- Local had no way to escape the app shell `maxWidth: 600` constraint at exactly `768px` web width.
- Default `html`/`body` background remained light, so the outer gutters appeared white in captures.

## Changes

- `src/screens/b2c/LocalScreen.tsx`
  - While Local is focused on web, widen ancestor shell hosts capped at `600px` to `width/maxWidth: 100%` (Local-only, restored on blur).
  - Paint `html`/`body` with Local canvas (`#050B14`) while Local hub is focused.
  - Add `rootWebTabletFull` width constraints on `#local-hub-root` for tablet web.
  - Avoid `100vw` negative-margin breakout (it caused left-side clipping).
- `scripts/capture-local-final-hero-assets.mjs`
  - Set dark canvas background on `html`/`body` before capture.
  - Mirror the `600px` ancestor widen in capture evaluate for evidence consistency.

## Safety

- No route/handler/payment/wallet/AI/SOS/backend/classifieds/merchant changes.
- Hero/card asset mapping unchanged.
