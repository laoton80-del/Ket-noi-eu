# VIONA Pack AE.2 World Stage Home Audit

## Summary

- **What changed:** B2C `HomeScreen` first fold was rebuilt as **VIONA World Stage**: a single **aurora / editorial hero** (`LinearGradient` `vionaTokens.gradients.multiverseHero` + depth border + subtle rim glow), three **world entrance** cards via `VionaUniverseCard` with `layout="worldStage"` (glass/hero surface, left accent rail, 44px icon well), a **glass trust strip** with the existing VIO wallet chip and a short trust line, and **Care Heart Fund** as a **secondary impact** module (`CharityWidget` `impactSecondary`, soft rose, no amount fakes). Shell tweaks: **desktop tab scene** `paddingTop` increased so floating **account/language** chips clear the hero; **SOS FAB** sits slightly lower on desktop web to reduce overlap with scrolled content; **SOS visible label** uses **Safety Assist** / **Hỗ trợ an toàn** (`sos.fabLabel`) without changing hold-to-trigger behavior.
- **Why prior pastel-card layout was insufficient:** Gold-forward “hub + tile grid” read as **dashboard / template**, not a **global flagship** first impression; duplicate hero copy and flat mini-cards failed **cinematic / quiet luxury** direction.
- **Why World Stage is now the Home direction:** One atmospheric moment + three clear **entrances** communicates VIONA in seconds, aligns with **Global Editorial Futurism** and **Strategic Pastel** (atmosphere, not pastel dashboard).

## Manifesto Alignment

| Manifesto rule | Implementation |
| --- | --- |
| Light-first, high-contrast ink | Hero copy uses `vionaTokens.colors.ink` / `softInk`; gradient is background only |
| Strategic Pastel System | Gradient token; universe accents remain Jade / Sapphire / Iris via tokens |
| No charity-first | Care module only after hero + trust strip; kicker clarifies secondary impact |
| Trust & clarity | Status pills Lite / Pilot / Demo / Coming soon; travel gated by existing `travelEnabled` |
| Premium global companion | `VionaSurface` hero + `shadows.hero`, breathing room, editorial typography |

## Visual Direction

- **Global Editorial Futurism:** Left accent rail on entrance cards, strong headline hierarchy, no stock illustration.
- **Quiet Luxury:** Soft aurora, restrained borders, white-glass cards—not saturated flat pastels filling the whole card.
- **Cinematic Tech:** Full-width graded stage, edge glow frame, generous vertical rhythm.
- **Strategic pastel, not pastel dashboard:** Pastel lives in **gradient atmosphere** and **accent rails**, not stacked candy tiles.

## Files Changed

| File | Reason |
| --- | --- |
| `src/screens/HomeScreen.tsx` | World Stage hero, entrances, trust strip, Care demotion, utility chip i18n |
| `src/design/vionaTokens.ts` | `gradients.multiverseHero` for aurora hero |
| `src/components/viona/VionaUniverseCard.tsx` | `layout="worldStage"` (flagship card + default pastel layout preserved) |
| `src/components/ui/CharityWidget.tsx` | `impactSecondary`, `home.impact.*`, `charityBody` i18n, soft rose surface |
| `src/navigation/MainTabNavigator.tsx` | Desktop `sceneStyle.paddingTop` so utilities clear hero |
| `src/components/SOSFloatingButton.tsx` | Lower FAB on desktop web (spacing only) |
| `src/i18n/locales/en.json` | `home.worldStage.*`, `home.impact.*`, trust/utility/wallet a11y; `sos.fabLabel` |
| `src/i18n/locales/vi.json` | Same scope (Smart Trio) |
| `docs/audit/VIONA_PACK_AE2_WORLD_STAGE_HOME_AUDIT.md` | This audit |

## Safety / Scope

Confirm **no** changes to: payment execution, booking mutations, wallet business rules, backend/API, DB/Prisma, Twilio, AI provider calls, route names, or feature flag definitions. **No** fake production or dispatch claims. **No** new emergency behavior—SOS still **hold-to-trigger** only.

## Visual Acceptance

| Check | Result (expected) |
| --- | --- |
| First fold feels flagship | Pass |
| Hero has signature visual moment | Pass |
| User understands VIONA in ~3 seconds | Pass |
| Care Fund is secondary | Pass |
| No dashboard-heavy first fold | Pass |
| Utility does not block hero | Improved on desktop (scene padding); residual mobile debt → AE.3 |
| SOS does not block hero | FAB lowered on desktop web; FAB is bottom-corner |
| No fake production claims | Pass |

## Remaining Debt

- **AE.3** Utility Dock + Safety Assist (full chip choreography, all breakpoints, Smart Trio density).
- **AE.4** Local / Travel / Academy full universe screens (beyond Home entrances).
- **AE.5** B2B / Admin visual system alignment.
- **AE.6** Responsive QA (narrow web, tablet, safe areas).
- **Copy:** Receptionist block on Home still partially fixed Vietnamese — out of scope for this pack.

## Validation

Run locally on branch `pack-ae2-viona-world-stage-home` (2026-05-07):

- `npm ci` — **BLOCKED on this Windows run** (`EPERM` unlink `lightningcss.win32-x64-msvc.node` — AV/process lock). Dependencies already present; subsequent scripts **PASS**.
- `npm run typecheck` — **PASS**
- `npm run lint` — **PASS** (warnings only)
- `npm run ci:release-discipline` — **PASS**
- `npm run brand:i18n-readiness` — **PASS** (allowlisted WARNs)
- `npm run design:readiness` — **PASS**

Web smoke: **not run here** (`npm ci` EPERM left `node_modules` inconsistent; `npx expo` could not resolve `dotenv`). On a clean tree: `npm ci` → `npm exec expo start --web --clear` → `/home`; expect `200` HTML + JS bundle `application/javascript`.
