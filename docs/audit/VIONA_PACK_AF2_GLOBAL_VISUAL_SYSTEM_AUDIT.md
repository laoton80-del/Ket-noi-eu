# VIONA Pack AF.2 Global Visual System Harmonization Audit

## Summary
Pack AF.2 harmonizes Home visual surfaces into the Fashion-Tech Human Constellation system after AF.0 visual gate completion. The update focuses on design tokens, reusable dark-glass primitives, and Home surface consistency only.

## Why AF.2 follows AF.0
AF.0 resolved structural shell gating (single top shell, legacy chrome suppression). AF.2 now aligns remaining mixed-style cards and strips so the Home experience reads as one coherent premium system.

## Areas touched
- Quick action strip
- QR pay + dual clock tiles
- Briefing cards
- Care impact strip
- Hero abstract visual slot
- Fashion-Tech status pill styling
- Supporting dark-glass primitive components

## Files changed
- `src/design/vionaTokens.ts`
- `src/components/viona/VionaStatusPill.tsx`
- `src/components/viona/VionaGlassPanel.tsx`
- `src/components/viona/VionaQuickActionPill.tsx`
- `src/components/viona/VionaInfoTile.tsx`
- `src/components/viona/index.ts`
- `src/screens/HomeScreen.tsx`
- `src/i18n/locales/en.json`
- `src/i18n/locales/vi.json`
- `docs/design/VIONA_FASHION_TECH_VISUAL_SYSTEM.md`

## Visual system decisions
- Added Fashion-Tech token aliases/roles for surfaces, borders, text, accents, glow, and status color meaning.
- Introduced reusable glass panel and action/tile primitives to reduce one-off styling.
- Replaced residual white/gray blocks on Home with dark elevated or glass surfaces.

## What changed on Home
- Quick actions now render as glass-panel pills with controlled accent glow.
- QR pay and dual clock shifted from white legacy cards to dark elevated info tiles.
- Briefing cards now use the same glass language as upper Home surfaces.
- Care strip remains secondary but tuned with warm accent and restrained prominence.
- Hero placeholder upgraded with richer constellation routes/nodes/city-light gradient layering.
- Production local assets are now wired to the hero and all four primary world cards:
  - Hero: `viona-home-hero-constellation.png`
  - Local: `viona-home-local-night-market.png`
  - Travel: `viona-home-travel-airport.png`
  - Academy: `viona-home-academy-learning.png`
  - Business: `viona-home-business-shop-import.png`

## What this does not do
- no AF.1 shop import
- no payment
- no booking
- no backend/API
- no DB/Prisma
- no Twilio
- no AI provider
- no route changes
- no feature flag changes
- no fake production state

## Validation
- `npm ci`
- `npm run typecheck`
- `npm run lint`
- `npm run ci:release-discipline`
- `npm run brand:i18n-readiness`
- `npm run design:readiness`

## Web smoke
- Start Expo web on dedicated AF.2 port.
- Verify `/home` returns HTTP 200 + `text/html`.
- Verify web bundle returns HTTP 200 + `application/javascript`.
- Verify no 500 and no `application/json` MIME regression for the bundle path.

## Visual checklist
- top shell remains single
- no floating Account
- no floating Language
- no red SOS orb
- no bottom desktop tab
- Local/Travel/Academy/Business primary
- Care secondary
- quick actions polished
- QR/Dual clock polished
- briefing polished
- hero visual placeholder improved
- no white old cards dominating Home
