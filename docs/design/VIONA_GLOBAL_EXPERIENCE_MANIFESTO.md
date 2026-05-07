# VIONA Global Experience Manifesto

## 1. Product Feeling

VIONA must feel:
- clear
- premium
- warm
- global
- trustworthy
- calm but powerful
- human + AI, not AI-only

VIONA must not feel:
- dashboard
- admin panel
- crypto app
- charity app
- travel-only app
- booking-only app
- prototype
- template
- floating mascot app
- restaurant/chef-style UI

## 2. First Impression Standard

Within 3 seconds, user must understand:
- VIONA is a multiverse companion OS.
- Local / Travel / Academy are main spaces.
- AI and Safety support exist but do not fake production actions.
- The user can choose a path immediately.

Signal rules for first fold:
- One flagship headline, one supporting sentence, one action direction.
- No compliance wall and no long text block above the fold.
- Show trust indicators early (safety label, pilot truth label, language clarity).

## 3. Visual Direction

Global Companion Minimalism:
- Light-first surfaces with high readability.
- Strong typography hierarchy before decorative effects.
- Subtle gradients for depth only, never for noise.
- Minimal decoration and no random floating elements.
- Strong but controlled accents to direct action, not decorate empty space.

Visual grammar:
- Canvas -> hero -> utility -> action cards -> trust/support cards.
- Every screen has one primary purpose and one primary CTA group.

## 4. Color Direction

Final palette and usage:
- `ink` (`#0B1628`): primary text, major headings, key iconography.
- `cloud` (`#F3F7FC`): page background and soft container fills.
- `white` (`#FFFFFF`): card surface, modal body, content contrast base.
- `blue` (`#21519A`): navigation emphasis, active state, utility affordance.
- `indigo` (`#183C73`): deep confidence tones for premium shell accents.
- `teal` (`#1A8FA0`): trust-positive support, language and context highlights.
- `coral` (`#E67C6A`): warmth moments, human support and empathy accents.
- `safety red` (`#C84B5A`): Safety Assist and critical caution only.

Color governance:
- Use red only for safety/critical states.
- Use blue/indigo for navigation confidence and structure.
- Keep saturation moderate to preserve calm premium tone.

## 5. Typography Direction

Type scale:
- display: hero headline and flagship surface statement.
- heading: section-level intent and key screen modules.
- title: card-level action labels.
- body: short explanatory copy.
- meta: trust labels, status context, timing hints.
- caption: helper notes, legal-lite and pilot-lite clues.

Rhythm and contrast:
- Larger vertical spacing between hierarchy levels than between peers.
- Bold contrast between display/heading and body/meta.
- Keep body lines short and scannable.
- Avoid equal-weight text blocks that flatten decision priority.

## 6. Shell Rules

- compact rail on desktop; no visual dominance over content.
- no heavy top navy band.
- utility dock anchored and integrated (not detached floating chips).
- content-first layout with clear first fold.
- safe spacing for notches, tab bars, and floating safety surfaces.
- desktop rule: wide readability zones and stable dock alignment.
- mobile rule: one-column flow, no overlap, thumb-safe actions.

## 7. Home Rules

- Multiverse Hero is primary.
- Care Heart Fund is secondary.
- Quick actions below hero.
- No text wall above first action row.
- No mixed language in one UI block.
- No fake production claims for payment, booking, or emergency response.

Home hierarchy contract:
1. Hero communicates what VIONA is.
2. Universe cards communicate where to go.
3. Utility and trust cards communicate control and confidence.

## 8. Utility Dock Rules

- Account / Language / VIO belong together.
- No floating debug chips in production-facing surfaces.
- No clipping at right edge or safe area boundaries.
- No overlap with hero headline or first action row.
- Dock must read like one global control bar.

## 9. Safety Assist Rules

- SOS/Safety Assist must be understandable at first glance.
- Hold-to-trigger and anti-mispress behavior is mandatory.
- Label is required in all supported locales.
- Confirmation is required before sensitive actions.
- Lite/Pilot copy is required when real dispatch is not active.
- No fake emergency dispatch or fake authority resolution.

## 10. Universe Rules

### Local
- emotional goal: belonging and practical momentum.
- first impression: trusted local Vietnamese network with native-language access.
- primary user action: discover and start a service path.
- safety copy requirement: show booking/status truth (Lite/Pilot/Gated).
- forbidden claims: no guaranteed fulfillment or paid confirmation if not real.

### Travel
- emotional goal: calm confidence while moving.
- first impression: guided journey with safety and context.
- primary user action: choose direction and open one travel action.
- safety copy requirement: emergency support is assistive, not authority replacement.
- forbidden claims: no fake provider fulfillment, no fake premium fulfillment.

### Academy
- emotional goal: growth with cultural connection.
- first impression: practical learning pathway, not exam theater.
- primary user action: enter lesson/tutor flow.
- safety copy requirement: mark beta/lite for AI grading or certification.
- forbidden claims: no official certification guarantee when not production-ready.

### B2B AI Receptionist
- emotional goal: revenue confidence for merchants.
- first impression: industry-aware assistant with controlled operations.
- primary user action: setup/demo/pilot request flow.
- safety copy requirement: actions requiring policy/human confirmation must be explicit.
- forbidden claims: no autonomous DB/payment/inventory mutation claims.

## 11. Card / Surface Rules

- hero surface: strongest hierarchy, broad spacing, clear primary intent.
- universe card: concise title, one-line value, status clarity.
- trust card: confidence cues (safety, language, support), no hype.
- impact card: emotional support/CSR context, never steals hero spotlight.
- status pill: short, uppercase or compact semantics, high contrast, no clutter.
- modal: clear title/body/CTA hierarchy, backdrop separates context, dismiss clarity.
- evidence/admin card: dense but readable, explicitly not consumer-primary styling.

## 12. Motion / Interaction Rules

- subtle and purposeful only.
- no gimmick loops and no mascot floating shell.
- hover/press states must reinforce affordance, not distract.
- transitions should clarify hierarchy changes.
- modal behavior: open focus, stable reading order, clear exit action.

## 13. Content Rules

- clear first, poetic second.
- short sentences and direct verbs.
- no over-explaining above the fold.
- Smart Trio consistency across labels and summaries.
- public brand usage: VIONA / VIO Credits.
- forbidden in public UI: ViGlobal / KNG / VIG Token.
- always disclose Demo/Lite/Pilot truth where applicable.

## 14. Visual Acceptance Gate

Grade scale:
- Fail
- Conditional
- Pass
- Pass with delight

Checklist to grade each screen:
- Home
- Local
- Travel
- Academy
- B2B
- Admin
- Modal
- Mobile
- Desktop

Minimum release rule:
- Consumer path cannot ship if Home/Local/Travel is below Pass.
- Safety or trust-critical modal cannot ship below Pass.
- Conditional requires documented mitigation and owner.

## 15. Implementation Roadmap

### AE.1 Design System Foundation
- Standardize tokens: color, radius, spacing, typography, elevation.
- Align utility, status, modal, and card primitives.

### AE.2 Home First-Love Redesign
- Lock hero hierarchy and first-fold clarity.
- Finalize secondary placement for impact/support content.

### AE.3 Universe Redesign
- Apply Local/Travel/Academy universe-specific experience rules.
- Enforce status and safety copy consistency.

### AE.4 B2B/Admin Redesign
- Separate operational density from consumer tone.
- Keep trust and clarity without dashboard heaviness.

### AE.5 Responsive QA
- Validate desktop/mobile hierarchy, overlap, spacing, and readability.
- Run visual acceptance gate and close Conditional items.
