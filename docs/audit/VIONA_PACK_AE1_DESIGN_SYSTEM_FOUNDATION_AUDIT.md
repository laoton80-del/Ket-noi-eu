# VIONA Pack AE.1 Design System Foundation Audit

## 1. Summary
- Added a centralized design token module at `src/design/vionaTokens.ts` and a design barrel at `src/design/index.ts`.
- Added reusable VIONA foundation primitives under `src/components/viona/` for surfaces, buttons, status pills, universe cards, utility dock, safety assist, and modal shell.
- Added read-only readiness guard `scripts/design-system-readiness-check.mjs` and npm script `design:readiness` to verify AE.1 anchors.
- Foundation is done before redesign to prevent patchwork visual drift across Home/Local/Travel and to enforce manifesto-level consistency.
- Out of scope in AE.1: redesign of major production screens and behavioral changes.

## 2. Manifesto Alignment
| Manifesto rule | Foundation support |
|---|---|
| Global Companion Minimalism | Shared surface variants in `VionaSurface` and disciplined token palette in `vionaTokens` |
| Light-first surfaces + strong typography | `colors.surface/elevatedSurface` and typography scale (`display`, `h1`, `h2`, `title`, `body`, `meta`, `caption`) |
| Utility dock cohesion | `VionaUtilityDock` groups account/language/VIO controls in one visual primitive |
| Safety clarity + anti-mispress posture | `VionaSafetyAssist` standardizes mode labeling (`lite`, `pilot`, `ready`) and status signaling |
| Status transparency | `VionaStatusPill` unifies tone taxonomy (`lite`, `pilot`, `demo`, `request`, `gated`, `comingSoon`, `safe`, `warning`) |
| Modal hierarchy | `VionaModalSurface` provides title/subtitle/action structure with controlled elevation and spacing |
| Responsive shell intent | layout tokens define compact rail width, content width, desktop/mobile paddings, utility height, and safe dock offset |

## 3. Current UI Pattern Audit
| Area | Current pattern | Risk | Foundation action |
|---|---|---|---|
| colors | Mixed hardcoded hex/RGBA across Home/ProfileSwitcher/SOS/Modal | Inconsistent tone and trust signature | Centralize color tokens in `vionaTokens.colors` |
| typography | Ad-hoc `fontSize/fontWeight` per component | Weak hierarchy consistency | Standardize with `vionaTokens.typography` scale |
| spacing | Mixed local padding/margin values | Uneven rhythm and density drift | Normalize via numeric spacing scale in `vionaTokens.spacing` |
| radius | Different card/chip corner radii per screen | Fragmented component language | Use shared radius map (`sm`..`pill`) |
| shadows | Custom shadows per component | Visual noise and platform mismatch | Use shared shadow presets (`none`, `soft`, `medium`, `hero`) |
| surfaces/cards | Multiple card styles implemented independently | Rework cost for every redesign pack | Use `VionaSurface` variant system |
| status pills | Several custom inline pill styles | Status semantics look inconsistent | Use `VionaStatusPill` with fixed tone taxonomy |
| buttons | Mixed local button styles and semantics | CTA hierarchy inconsistency | Use `VionaButton` variant/size system |
| modal | Modal visual patterns differ across components | User trust and hierarchy inconsistency | Use `VionaModalSurface` as base modal shell |
| utility dock | Account/language/VIO can feel detached | Floating/flickering visual identity | Use `VionaUtilityDock` primitive for integrated controls |
| Safety Assist | SOS visuals still vary by area | Mispress and comprehension risk | Use `VionaSafetyAssist` foundation style/state model |
| responsive shell | Desktop/mobile spacing tuned ad-hoc | Regression risk between viewports | Lock layout tokens under `vionaTokens.layout` |

## 4. Files Changed
| File | Purpose |
|---|---|
| `src/design/vionaTokens.ts` | Core AE.1 design tokens (colors, gradients, spacing, radius, typography, shadows, layout) |
| `src/design/index.ts` | Design barrel exports |
| `src/components/viona/VionaSurface.tsx` | Shared surface/card primitive |
| `src/components/viona/VionaButton.tsx` | Shared CTA primitive |
| `src/components/viona/VionaStatusPill.tsx` | Shared status chip primitive |
| `src/components/viona/VionaUniverseCard.tsx` | Shared universe entry-card primitive |
| `src/components/viona/VionaUtilityDock.tsx` | Shared utility dock primitive |
| `src/components/viona/VionaSafetyAssist.tsx` | Shared safety assist primitive |
| `src/components/viona/VionaModalSurface.tsx` | Shared modal surface primitive |
| `src/components/viona/index.ts` | Primitive barrel exports |
| `scripts/design-system-readiness-check.mjs` | Read-only foundation readiness check |
| `package.json` | Added `design:readiness` script |

## 5. Components Added
- VionaSurface
- VionaButton
- VionaStatusPill
- VionaUniverseCard
- VionaUtilityDock
- VionaSafetyAssist
- VionaModalSurface

## 6. What This Does Not Do
- no Home redesign
- no Local redesign
- no Travel redesign
- no payment
- no booking
- no wallet
- no backend/API
- no DB/Prisma
- no Twilio
- no AI provider
- no route changes
- no feature flag changes

## 7. Validation
- `npm ci`
- `npm run typecheck`
- `npm run lint`
- `npm run ci:release-discipline`
- `npm run brand:i18n-readiness`
- `npm run design:readiness`

## 8. Next Pack Recommendation
- AE.2 Home First-Love Redesign using these primitives
- AE.3 Utility Dock + Safety Assist wiring
- AE.4 Universe Redesign
