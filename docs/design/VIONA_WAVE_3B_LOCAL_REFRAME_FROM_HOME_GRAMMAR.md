# VIONA Wave 3B — Local reframe from Home grammar

**Pack:** `VIONA.WAVE_3B.LOCAL_REFRAME_FROM_HOME_GRAMMAR.1`  
**Type:** Structure pack (not final polish)  
**Reference:** `docs/design/VIONA_WAVE_3B_HOME_VISUAL_GRAMMAR_AUDIT_FOR_LOCAL.md`

## Intent

Replace the dense Local command-center opening with Home-like hierarchy:

1. **Local Dynamic Hero** — copy left, visual right, CTAs + trust strip (no in-hero tile grid)
2. **Four Local Hero Cards** — `VionaFashionWorldCard` grammar via `LocalHomeParityCard`
3. **Compact Quick Actions** — `VionaQuickActionPill` strip
4. **Existing modules** — unchanged handlers, moved below the fold

## Components

| Component | Role |
|-----------|------|
| `LocalDynamicHero` | Cinematic hero panel; asset `viona-hero-local-1280x428.png` |
| `LocalHeroCardsRow` | My Requests, Booking Assist, Legal & Wealth, Browse Services |
| `LocalQuickActionsRow` | Restaurants, Transit, Rentals, Classifieds, AI Receptionist, Language |
| `LocalOpeningStageLayout` | Vertical rhythm wrapper (`local-opening-stage`) |
| `LocalHomeParityCard` | Thin wrapper over `VionaFashionWorldCard` |

## Safety copy

- Hero subtitle and CTAs use `localHub.reframe.*` keys (en/vi).
- Trust strip reuses `localCommerce.safety.pillRequestOnly`, `pillNoPayment`, plus `localHub.reframe.trustMerchantFirst`.
- No instant booking, payment success, or guaranteed fulfillment claims.

## Evidence

Run (Expo web on port 8088):

```bash
node scripts/capture-local-reframe-from-home-grammar.mjs
```

Output: `docs/design/evidence/wave-3b-local-reframe-from-home-grammar/`

## Drift boundaries (unchanged)

- `HomeScreen.tsx` — not modified
- Payment/wallet, AI service logic, SOS — not modified
- Routes and navigation handlers — preserved (`testID`s unchanged on flagship cards)
- `LocalCommandCenterPanel` — no longer mounted on Local hub (component file untouched)

## Removed from above-the-fold (not deleted)

- Duplicate booking-assist quick-help strip (still available via hero card + Leona flows)
- Four `PremiumAppTile` flagships inside command center (replaced by hero cards row)
