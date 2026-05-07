# VIONA Pack AD Apex Shell Modernization Audit

## 1. Summary

- Updated shell visuals to a compact, content-first desktop/web experience with a narrower left rail and cleaner tab labeling.
- Rebalanced top utility behavior so floating controls stay in a dedicated header zone while screen content starts below that zone.
- Polished Home, Local, Travel, and Auth paywall presentation to feel more premium while preserving pilot/demo truth labels and all existing product logic.
- Out of scope remains unchanged: payment execution logic, booking mutations, wallet internals, backend/API, DB/Prisma, Twilio production, AI provider execution, route names, and feature-flag behavior.

## 2. Screenshot Findings

| Finding | Before risk | Fix |
|---|---|---|
| sidebar too wide | Desktop rail looked like an old dashboard column and constrained content width | Reduced desktop rail width and tuned label/icon density for compact app-rail behavior |
| utility cluster scattered | VIO/account/language controls appeared as separate floating items with weak hierarchy | Added top utility safe area and aligned shell spacing so controls live in a predictable header zone |
| Smart Trio overlay | Floating language chip could visually collide with first content cards | Reserved header breathing room from navigation scene level and kept chip in utility zone |
| Local text-heavy | Local clarity section felt like dense compliance text | Switched to summary-first audience chips and cleaner compact sections |
| Travel flat/spec-like | Travel direction cards felt list-like and low contrast | Added premium card depth, stronger action-row composition, and clearer CTA affordance |
| modal i18n/polish | Parent screens could force non-locale text and modal looked utility-like | Removed hardcoded parent overrides and refined modal spacing, tone, and button contrast |
| SOS/content overlap risk | Floating utility stack and content competed on desktop headers | Moved content start lower via top safe zone; preserved SOS behavior without business logic changes |

## 3. Files Changed

| File | Reason |
|---|---|
| `src/navigation/MainTabNavigator.tsx` | Compact desktop rail, shorter desktop labels, active tile treatment, top utility safe area, remove hardcoded paywall copy override |
| `src/screens/HomeScreen.tsx` | Move VIO credits pill into hero utility flow, widen premium shell, reduce floating overlap pressure, remove hardcoded paywall copy override |
| `src/components/localCommerce/LocalCommerceClarityBlock.tsx` | Summary-first audience chips and cleaner compact readability |
| `src/components/travel/TravelDirectionSelector.tsx` | Premium card polish, tighter action rows, stronger CTA/readability |
| `src/components/AuthPaywallModal.tsx` | Spacing/contrast polish for premium auth gate presentation |

## 4. Design Rules Applied

- compact rail
- content-first layout
- top utility cluster
- premium cards
- summary-first Local
- premium Travel cards
- modal consistency

## 5. What This Does Not Do

- no payment
- no booking mutation
- no wallet change
- no DB/Prisma
- no backend/API
- no Twilio
- no AI provider
- no route changes
- no feature flag changes

## 6. Validation

- npm ci
- typecheck
- lint
- ci:release-discipline
- brand:i18n-readiness
- pilot:rehearsal-readiness
- gate:production-readiness

## 7. Visual Acceptance Checklist

| Screen | Expected | Result placeholder |
|---|---|---|
| Home | Premium hierarchy, tighter utility cluster, no utility overlap on first cards | TODO |
| Local | Summary-first clarity block, compact readable status flow | TODO |
| Travel | More premium direction cards with inline status clarity | TODO |
| AuthPaywallModal | Full locale consistency and refined premium spacing | TODO |
| Smart Trio chip/sheet | Header-zone placement with clear readability | TODO |
| SOS overlay | Remains critical and visible without covering key labels/CTA | TODO |

## 8. Remaining Debt

- B2B/Admin visual checks still needed
- full mobile device QA still needed
- final native-speaker localization review later
- no public beta yet
