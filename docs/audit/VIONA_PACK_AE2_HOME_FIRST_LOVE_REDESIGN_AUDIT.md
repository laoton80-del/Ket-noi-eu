# VIONA Pack AE.2 Home First-Love Redesign Audit

## 1. Summary

- **What changed:** `HomeScreen` first fold was rebuilt around a **Strategic Pastel** multiverse hero (manifesto gradient), three **tap-through universe entry cards** (Local / Travel / Academy) using **AE.1** `VionaUniverseCard` + `vionaTokens`, a **glass trust strip** with the existing VIO wallet chip and a short trust line, and **VIONA Care Heart Fund** moved to a **secondary impact** treatment via `CharityWidget` `impactSecondary` (impact pastel, smaller hero than the multiverse block). `VionaUniverseCard` now uses **universe pastel surfaces** and accent colors from tokens. Utility shortcut chips that were Vietnamese-only in copy were wired to **new i18n keys** (en/vi only).
- **Why Home needed first-love redesign:** Prior layout duplicated multiverse messaging, leaned **gold / dashboard**, and universe entries read as **draft grid tiles** inside a heavy card—poor global first impression versus the AE.0 manifesto.
- **Why Care Fund was demoted:** It must remain **meaningful but not primary**; users should understand VIONA as a **multiverse companion** first, with impact as a **warm secondary** module (no new payment/donation claims).
- **Why Multiverse Hero is primary:** Single clear story—**who VIONA is** and **three universes**—within ~3 seconds, with **high-contrast ink** on a light pastel gradient.

## 2. Manifesto Alignment

| Manifesto rule | AE.2 implementation |
| --- | --- |
| Light-first, premium, trustworthy | Hero uses manifesto gradient `#F8FAFC → #EEF4FF → #FFF8ED`; page canvas uses hero base tone; ink-first typography on hero |
| Strategic Pastel System | Universe cards use token pastels per universe; Care uses `colors.impact`; gradient token `gradients.multiverseHero` |
| No dashboard-heavy default | Removed duplicate headline row + gold “hub” grid; universe entries are prominent **cards** with status pills |
| Care / impact not the hero | Care Heart Fund only after hero + cards + trust strip; compact impact styling |
| No fake production claims | Status labels remain **Lite / Pilot / Demo / Coming soon**; travel respects `travelEnabled` |

## 3. Strategic Pastel Usage

| Area | Pastel token | Purpose |
| --- | --- | --- |
| Hero gradient | `vionaTokens.gradients.multiverseHero` | Emotional warmth without washing out text |
| Local | `colors.universe.local.bg` / `accent` | Universe identity for Local card |
| Travel | `colors.universe.travel.bg` / `accent` | Universe identity for Travel card |
| Academy | `colors.universe.academy.bg` / `accent` | Universe identity for Academy card |
| Impact / Care | `colors.impact.bg` / `accent` | Secondary emotional module for Care Heart Fund |

## 4. Files Changed

| File | Reason |
| --- | --- |
| `src/screens/HomeScreen.tsx` | First-love hierarchy, hero, universe navigation, trust strip, Care demotion, minor i18n for shortcuts |
| `src/design/vionaTokens.ts` | Added `gradients.multiverseHero` per manifesto |
| `src/components/viona/VionaUniverseCard.tsx` | Strategic pastel fills + accent bar from tokens |
| `src/components/ui/CharityWidget.tsx` | `impactSecondary` layout, `charityBody` i18n, impact palette |
| `src/i18n/locales/en.json` | `home.universe.*`, `home.impact.*`, `home.trustStripHint`, utility chip strings |
| `src/i18n/locales/vi.json` | Same (Smart Trio scope) |
| `docs/audit/VIONA_PACK_AE2_HOME_FIRST_LOVE_REDESIGN_AUDIT.md` | This audit |

## 5. What This Does Not Do

- No payment mutation, booking mutation, or wallet logic changes
- No backend/API, DB/Prisma, Twilio, or AI provider calls added/changed
- No route name changes or new routes
- No feature flag definition changes
- No deep redesign of Local / Travel / Academy tab screens
- No full utility dock / SOS system redesign (see Remaining Debt)

## 6. Validation

Executed on branch `pack-ae2-home-first-love-redesign` (2026-05-07):

- `npm ci` — **PASS**
- `npm run typecheck` — **PASS**
- `npm run lint` — **PASS** (warnings only, no errors)
- `npm run ci:release-discipline` — **PASS**
- `npm run brand:i18n-readiness` — **PASS** (allowlisted brand WARNs)
- `npm run design:readiness` — **PASS**

Web smoke (Expo dev, `curl.exe`):

- `GET http://127.0.0.1:8081/home` — **200** `text/html`
- `GET index.ts.bundle?platform=web&dev=true&hot=false` — **200** `application/javascript; charset=UTF-8` (no `application/json` bundle MIME observed)

## 7. Visual Acceptance Checklist

| Check | Result |
| --- | --- |
| Home first fold explains VIONA in ~3 seconds | Expected PASS (hero + three universes) |
| Multiverse Hero is primary | Expected PASS |
| Care Heart Fund is secondary | Expected PASS |
| Strategic pastel visible but not childish | Expected PASS |
| Text contrast high on hero | Expected PASS |
| No dashboard-heavy feel | Expected PASS |
| No random floating mascot dominating | Expected PASS |
| No fake production claims | Expected PASS |
| Utility/SOS do not block hero (first fold) | **Partial** — shell-level SOS/chips: see AE.3 |

## 8. Remaining Debt

- **AE.3** Utility Dock + Safety Assist (Account / Language / VIO / SOS vs. hero overlap on all breakpoints)
- **AE.4** Local / Travel / Academy universe screen redesign (beyond Home entry)
- **AE.5** B2B / Admin visual system
- **AE.6** Responsive QA across web/tablet breakpoints
- **i18n:** Feature/receptionist block on Home still mixes fixed Vietnamese copy (“Tổng đài viên…”) — out of scope for full overhaul this pack; tracked for a later i18n pass if product approves string migration.
