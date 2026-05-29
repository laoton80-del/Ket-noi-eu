# VIONA Wave 3B — Local install final hero assets

**Pack:** `VIONA.WAVE_3B.LOCAL_INSTALL_FINAL_HERO_ASSETS.1`  
**Type:** Asset installation + mapping verification (no logic/routing changes)

## Asset existence check

Verified in `assets/viona/local/hero/`:

- `local-hero-default-1600x520.png`
- `local-hero-my-requests-1600x520.png`
- `local-hero-booking-assist-1600x520.png`
- `local-hero-legal-wealth-1600x520.png`
- `local-hero-browse-services-1600x520.png`
- `local-card-my-requests-640x360.png`
- `local-card-booking-assist-640x360.png`
- `local-card-legal-wealth-640x360.png`
- `local-card-browse-services-640x360.png`

## Mapping installed

- Dynamic hero registry now requires all 5 Local hero files with safe fallback behavior.
- Hero cards now require all 4 Local card files with safe fallback behavior.
- Hover mapping remains:
  - My Requests -> `myRequests` hero
  - Booking Assist -> `bookingAssist` hero
  - Legal & Wealth -> `legalWealth` hero
  - Browse Services -> `browseServices` hero
  - Leave -> `default` hero

## Safety

- No handler or route changes.
- No payment/wallet/AI/SOS/backend/auth/classifieds/merchant logic changes.

## Evidence

Run:

```bash
node scripts/capture-local-final-hero-assets.mjs
```

Output:

`docs/design/evidence/wave-3b-local-final-hero-assets/`
