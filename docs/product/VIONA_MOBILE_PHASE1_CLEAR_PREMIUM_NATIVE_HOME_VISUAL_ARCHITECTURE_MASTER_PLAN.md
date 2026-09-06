# VIONA — Mobile Clear Premium Companion
# Phase 1 Native Home Visual Architecture Master Plan

**Document type:** Docs-only visual architecture master plan (planning; **not** runtime implementation).
**Mode:** Dedicated local docs branch · exact three new docs · uncommitted · zero stage / commit / push / PR.

**Dedicated planning branch:** `docs/viona-mobile-phase1-clear-premium-native-home-visual-architecture-master-plan`
**Created from:** `b21d407b26788cebf5cc28f84be9c64f8b2f1f1f` (Phase 0 isolation plan commit)

**Companion spec:** `docs/design/VIONA_MOBILE_PHASE1_CLEAR_PREMIUM_NATIVE_HOME_VISUAL_SPEC.md`
**Evidence:** `docs/design/evidence/cursor-viona-mobile-phase1-clear-premium-native-home-visual-architecture-master-plan/README.md`

**Authorization:**

```text
APPROVE_VIONA_MOBILE_PHASE1_CLEAR_PREMIUM_NATIVE_HOME_VISUAL_ARCHITECTURE_MASTER_PLAN_PACKET_ON_DEDICATED_LOCAL_DOCS_BRANCH_FROM_B21D407B26788CEBF5CC28F84BE9C64F8B2F1F1F_WITH_EXACT_THREE_NEW_DOCS_UNCOMMITTED_ZERO_STAGE_ZERO_COMMIT_ZERO_PUSH_ZERO_PR_ZERO_RUNTIME_CHANGE_ZERO_WEB_VISUAL_CHANGE_ZERO_NAVIGATION_CHANGE_ZERO_SOS_BEHAVIOR_CHANGE_ZERO_FUNCTION_REMOVAL
```

**Source authorities:**

1. `docs/product/VIONA_MOBILE_CLEAR_PREMIUM_COMPANION_DESIGN_SYSTEM_AND_HOME_ARCHITECTURE_MASTER_PLAN.md`
2. `docs/design/VIONA_MOBILE_CLEAR_PREMIUM_COMPANION_DESIGN_SYSTEM_SPEC.md`
3. `docs/product/VIONA_MOBILE_PHASE0_NATIVE_PRESENTATION_ISOLATION_IMPLEMENTATION_PLAN.md`
4. Completed Phase 1 strict read-only Home inventory audit

**Preserved audit classification:**

```text
READY_FOR_VIONA_MOBILE_PHASE1_CLEAR_PREMIUM_NATIVE_HOME_VISUAL_ARCHITECTURE_MASTER_PLAN
```

This packet does **not** authorize runtime implementation, token activation, asset generation, navigation change, SOS change, web restyle, design-lock amendment, staging, commit, push, or PR.

PR #450 is independent and must not be touched.

---

## 1. Phase 0 dependency lock

```text
PHASE1_RUNTIME_REQUIRES_PHASE0_NATIVE_PRESENTATION_ISOLATION_COMPLETE
VIONA_MOBILE_PHASE0_NATIVE_PRESENTATION_ISOLATION_PLANNED_NOT_IMPLEMENTED
```

**CLEAR PREMIUM NATIVE HOME MAY BE DESIGNED NOW BUT MUST NOT BE ACTIVATED BEFORE PHASE 0 IS COMPLETE.**

Phase 0 remains a **plan**, not runtime isolation. Native Home still uses `SHARED_ADAPTIVE_NATIVE_REUSE`. Restyling shared adaptive components would change web mobile/tablet.

Do not claim `VIONA_NATIVE_PRESENTATION_ISOLATED`.

---

## 2. North star

```text
VIONA CLEAR PREMIUM COMPANION
CLARITY BEFORE DECORATION
ADAPT UX PRINCIPLES
DO NOT CLONE MYTOUR
REQUEST_ONLY_NO_CHARGE
VIONA_NATIVE_LIGHT_FIRST_CLEAR_PREMIUM_CARVE_PROPOSED_NOT_ACTIVATED
VIONA_WEB_VISUAL_ARCHITECTURE_PRESERVED
NO_FUNCTION_REMOVAL
```

Native Home should feel: calm, premium, Vietnamese-first, global companion, scan-first, touch-first, one-hand friendly, contextual, trustworthy.

Avoid: OTA clone, dashboard wall, chatbot-only Home, promotion feed, dark-glass overload, decorative noise, too many simultaneous priorities.

Home is **Companion OS Home**, not a marketing landing, OTA homepage, or AI chat canvas.

---

## 3. Information architecture

| # | Module | Placement |
|---|---|---|
| 1 | Contextual header | **MUST_BE_ABOVE_FOLD** |
| 2 | Primary Find / Search / Ask | **MUST_BE_ABOVE_FOLD** (slot even if search depth is unconfirmed) |
| 3 | Universe launcher (Local, Travel, Academy, Business) | **MUST_BE_ABOVE_FOLD** |
| 4 | Quick actions | **SHOULD_BE_EARLY** |
| 5 | Contextual companion | **CONTEXTUAL** (hide if empty) |
| 6 | Relevant discovery | **BELOW_FOLD** / hide if empty |
| 7 | One Local **or** Travel contextual module | **CONTEXTUAL** |
| 8 | AI contextual entry | **OPTIONAL** / **GATED** |
| 9 | Account / activity cue | **SHOULD_BE_EARLY** as chrome; optional Home chip only with real data |
| 10 | Four-tab navigation | **SAFETY_PRESERVE** (not redesigned in Phase 1) |
| 11 | Global SOS reachability | **SAFETY_PRESERVE** (shell) |

**Priority:** PRIMARY = universe launcher. SECONDARY = Find / Ask. TERTIARY = quick actions and contextual modules.

---

## 4. Above-fold contract (phone portrait)

First screen:

- compact header (greeting + identity; Account/language remain shell-owned);
- Find / Ask entry (or labeled slot; no fake results);
- 2×2 universe launcher;
- minimal / short identity treatment — **not** a magazine hero;
- at most a **preview** of quick actions (first row peek, not eight glass pills).

Editorial hero must not dominate the first screen.

---

## 5. Universe launcher

Four tiles only: **Local · Travel · Academy · Business**.

| Universe | Label | Role | Image | Chip | CTA | Accent (proposed meaning) | A11y | Gated |
|---|---|---|---|---|---|---|---|---|
| Local | Local | Nearby services, requests, Vietnamese businesses | KEEP / RE-CROP existing daylight card | Honest Lite / Active text chip | `goUniverseLocal` → `TabLocal` | Emerald / teal | “Local. {chip}. Open Local.” | Always navigable |
| Travel | Travel | Travel companion | KEEP / RE-CROP | Pilot / Coming Soon if flag off | `goUniverseTravel` or no-op + chip | Cyan / sky | Include chip in label | Flag: tile remains; no fake booking |
| Academy | Academy | Learning | KEEP / RE-CROP | Demo / Lite text chip | `goUniverseAcademy` → `TabAi` | Violet / indigo | Include chip | Keep route |
| Business | Business | Merchant / B2B shell | KEEP / RE-CROP | Pilot text chip | `goUniverseBusiness` | Navy / gold | Include chip | Role shell; **not** a B2C tab |

**Not in the 2×2:**

- Account = chrome → `PersonalHub` (visual discoverability only).
- SOS = global shell (not an ordinary launcher tile).

No fake readiness. Chips are text-primary; color is secondary.

---

## 6. Find / Search / Ask

**Current fact:** `HomeScreen` has no search field.

Plan a unified **Find** field with optional **Ask** chip.

- Find routes into Local / Travel search when those surfaces exist.
- Ask opens Leona / interpreter only through existing protected handlers.
- If search depth is unconfirmed: labeled slot, no fabricated results.

AI: contextual, optional, cost-aware, non-dominant. Core navigation works when AI is unavailable.

---

## 7. Quick actions

Preserve **all** current capabilities. Show **4–6** in the primary strip; overflow in More.

| Action | Class | Future placement |
|---|---|---|
| Request / book services | **PROMINENT** | Primary strip |
| Nearby support | **CONTEXTUAL** | Merge visually with Local; keep reachable |
| Quick translate | **SECONDARY** | Strip or Ask overflow |
| AI assistant | **SECONDARY** | Ask chip / AI card; not hero |
| Documents / vault | **CONTEXTUAL** | Account utility; keep reachable |
| Travel Lite | **SECONDARY** | Strip; gated with Travel tile |
| Learning | **CONTEXTUAL** | Academy tile duplication — keep, do not delete |
| SOS chip | **SOS entry** | Triggers canonical shell flow only — not a second hold control |

Duplicated actions are **repositioned**, never deleted.

---

## 8. Card taxonomy (Phase 1 Home)

| Family | Use |
|---|---|
| UNIVERSE TILE | 2×2 launcher |
| ACTION CARD | Compact quick-action |
| STATUS CARD | Companion / real activity |
| DISCOVERY CARD | Sparse, hide-if-empty |
| ACCOUNT / ACTIVITY CARD | Optional real cue; chrome remains owner |
| AI ASSIST CARD | Contextual, gated |

SOS is **not** ordinary Home card chrome. Do not use one identical container for every capability.

---

## 9. Header

Candidate: `VionaNativeHomeHeader`.

Content: greeting, compact VIONA identity, locale/context cue.

Account and language **remain in shell chrome**. Home must not duplicate Account ownership.

---

## 10. Contextual companion

Hide-if-empty. Potential real contexts: trip, request, learning, local task, business task.

No fake activity, trip, or request. Empty = disappear, not fabricate.

---

## 11. Discovery

Contextual and sparse. Possible: Local, Travel, Care, **honest demo** only if labeled Demo/Gated.

Avoid news-feed look, banner feed, promo wall, fake live briefing. Current briefing rail (`Alert.alert` demo) stays **GATED** / labeled Demo or is omitted until real data.

---

## 12. AI UX

Must not dominate Home.

- Small Ask affordance on Find.
- Contextual AI card only when meaningful.
- Beta / Gated / unavailable states required.
- No `AI_ALWAYS_AVAILABLE`.
- No uncontrolled cost path; keep existing paywall / `openProtected` / mini-app gates.

---

## 13. Account

Ownership: chrome → `PersonalHub`.

Phase 1 may improve **visual discoverability** of chrome (label, contrast, hit area). Do not create a fifth tab, a duplicate Account hub, wallet-balance fiction, or payment-state fiction. Optional Home cue uses **real data only**.

---

## 14. SOS

Preserve:

- `V7_SOS_HOLD_TO_TRIGGER_MS = 3000`
- canonical `src/screens/b2c/SOSModal.tsx`
- exact-one global shell host

Phase 1 may improve **awareness** of reachability only.

Do not: create another host; place SOS as a commerce/launcher tile; add a second hold interaction; gamify safety; fake police / ambulance / provider dispatch.

Home quick-action SOS remains an **entry** into `triggerSafetyAssist` / shell, not a second modal.

---

## 15. Written wireframes

Hierarchy only. Touch targets: 44–48 (existing spec). Not runtime pixels.

### 15.1 Phone portrait

```text
[ Context header ]
[ Find / Ask ]
[ Local ][ Travel ]
[ Academy ][ Business ]
[ Quick Actions preview ]
[ Companion if real ]
[ Discovery ]
[ AI optional ]
[ Care / legacy / secondary ]
[ four-tab nav + SOS shell ]
```

### 15.2 Phone landscape

```text
[ Compact header | Find/Ask ]
[ Local ][ Travel ][ Academy ][ Business ]   <- 4-across compact
[ Quick actions single row ]
[ Companion / discovery if space ]
[ tabs + SOS; safe areas ]
```

Require: collapsed/absent hero; no stretched portrait.

### 15.3 Tablet portrait

```text
[ Header + Find/Ask spanning ]
[ Local ][ Travel ][ Academy ][ Business ]   <- 4-across larger
optional 2-column:
  [ launcher + actions ] | [ companion / discovery ]
[ tabs + SOS; no web command bar ]
```

Native tablet identity. Not web desktop.

### 15.4 Tablet landscape

```text
[ bounded two-pane ]
  LEFT: header, Find, 2x2 or 4-across launcher, actions
  RIGHT: companion / discovery (hide empty)
[ max readable width; density up; not desktop Fashion-Tech ]
[ shell Account + SOS preserved ]
```

Tablet ≠ Web desktop.

Visual anatomy for all four is in the companion spec.

---

## 16. Visual system

Detailed rules live in `VIONA_MOBILE_PHASE1_CLEAR_PREMIUM_NATIVE_HOME_VISUAL_SPEC.md`.

Direction: light-first **proposed carve** (not activated); solid calm surfaces; restrained shadow; Montserrat hierarchy; photography in tiles not full-bleed magazine hero; one leading accent per module.

Do not activate runtime tokens in this packet.

---

## 17. Token strategy

Do **not** modify `vionaTokens.fashionTech`, `premiumTileVisualTokens`, or other web-shared tokens.

Plan future namespace `vionaNativeClearPremium` consumed only by native presentation after Phase 0.

| Class | Meaning |
|---|---|
| CURRENT | Exists in repo today |
| PROPOSED | Planning-only; not runtime |

```text
VIONA_NATIVE_LIGHT_FIRST_CLEAR_PREMIUM_CARVE_PROPOSED_NOT_ACTIVATED
```

---

## 18. Semantic color (proposed meanings)

Not one rigid color per universe. One leading accent per module; no uncontrolled multi-color competition.

| Domain | Leading family |
|---|---|
| Travel | cyan / sky / blue |
| Local | emerald / teal / contextual warm |
| Academy | violet / indigo |
| Business | navy / gold / emerald |
| Account | neutral / premium gold / contextual |
| SOS | red **only** for genuine safety / critical |

---

## 19. Typography

**CURRENT:** Montserrat (`FontFamily` regular–extrabold). Do not replace the family.

Roles: display (rare), page title, section title, body, metadata, caption, button, status.

Premium from hierarchy and spacing, not excessive weight.

---

## 20. Imagery

| Asset | Treatment |
|---|---|
| `viona-hero-human-constellation-1280x428.png` | **RE-CROP_LATER** or **REPLACE_LATER** — not first-screen dominant |
| Local / Travel / Academy / Business daylight cards | **KEEP** / **RE-CROP_LATER** for 2×2 |
| Heavy dark overlay | Drop on native isolated opening |

No asset creation in this packet. Future art direction is a separately authorized asset pack.

---

## 21. Function-preservation matrix

Never **DELETE**.

| Capability | Current entry | Future placement | Visual | Readiness | Guard | Phase | Class |
|---|---|---|---|---|---|---|---|
| Local | World card, tab, quick actions | Launcher + tab | UNIVERSE TILE | Active / Lite | REQUEST_ONLY | 1 | RESTYLE_PHASE1 |
| Travel | World card, tab, Travel Lite | Launcher + tab | UNIVERSE TILE | Flag / Coming Soon | No fake booking | 1 | RESTYLE_PHASE1 |
| Academy | World card, `TabAi` | Launcher + tab | UNIVERSE TILE | Demo/Lite | No fake cert | 1 | RESTYLE_PHASE1 |
| Business | World card | Launcher + role shell | UNIVERSE TILE | Pilot | Tenant; not 6th tab | 1 | RESTYLE_PHASE1 |
| Account | Chrome → PersonalHub | Chrome (+ optional real cue) | Chrome | Active | No fake wallet | 1 | SAFETY_PRESERVE |
| SOS | Shell 3000ms; Home entry | Shell | Safety chrome | Lite/active | Exact-one | 1 | SAFETY_PRESERVE |
| Request / book | Quick action | Prominent action | ACTION CARD | Active | REQUEST_ONLY | 1 | KEEP / RESTRUCTURE_PHASE1 |
| Nearby | Quick action | Contextual / Local | ACTION CARD | Active | REQUEST_ONLY | 1 | REPOSITION_PHASE1 |
| Translate | Quick action | Secondary / Ask | ACTION CARD | Auth | Cost firewall | 1 | REPOSITION_PHASE1 |
| AI assistant | Quick action, utility, suggestions | Ask / AI card | AI ASSIST | Gated | Cost + confirm | 1 | REPOSITION_PHASE1 |
| Documents | Quick action + utility | Account utility | ACCOUNT CARD | Auth | Auth | 1 | REPOSITION_PHASE1 |
| Travel Lite | Quick action | Secondary | ACTION CARD | Flag | No fake booking | 1 | KEEP |
| Learning | Quick action | Contextual / Academy | ACTION CARD | Lite | No fake cert | 1 | REPOSITION_PHASE1 |
| Wallet / VIO | Utility + desktop bar | Account | ACCOUNT CARD | Honest empty | Ledger | 1 | REPOSITION_PHASE1 |
| AiEye | Utility | Business / gated | GATED | Demo | No fake calling | 1 | SHARED_UNTIL_LATER_PHASE |
| Language | Chrome sheet | Chrome / header cue | Chrome | Active | Locale honesty | 1 | SAFETY_PRESERVE |
| Care / Charity | Impact + CharityWidget | Discovery / Care | Utility | Ledger display | No fake donate-pay | 1 / later | SHARED_UNTIL_LATER_PHASE |
| Briefing | Demo alerts | Omit or labeled Demo | DISCOVERY | Demo | No fake live news | 1 | NEEDS_CONFIRMATION |
| Legacy dashboard | Expand block | Below fold | OPTIONAL | Legacy | Honest | 1 | REPOSITION_PHASE1 |
| Search | **Absent** | Find slot | Primary entry | NEEDS_CONFIRMATION | No fake results | 1 | NEEDS_CONFIRMATION |
| Notifications | Header (counts unconfirmed) | Header slot | Cue | NEEDS_CONFIRMATION | No fake badges | 1 | NEEDS_CONFIRMATION |

---

## 22. Commercial governance

Preserve `REQUEST_ONLY_NO_CHARGE`.

Do not imply live price, checkout, booking success, availability, inventory, discount, paid AI, wallet balance, or fulfilled request.

Charity: ledger / display / refresh only unless a later capability is separately authorized.

---

## 23. Accessibility (future Phase 1 acceptance)

- 44–48 touch targets
- Contrast ≥ 4.5:1 on proposed light native surfaces
- Screen-reader order: header → Find → launcher (with chips) → actions → below-fold
- Dynamic type; SOS not truncated
- Non-color status
- Reduced motion; linear SOS hold
- Safe areas; landscape; tablet
- Icon-only controls labeled

---

## 24. Mytour reference boundary

**Allowed:** scanability, clear grouping, direct CTA, good imagery, natural vertical scroll, stable navigation.

**Do not copy:** exact layout, palette, promo density, banner system, icons, wording, OTA-specific IA.

```text
ADAPT UX PRINCIPLES
DO NOT CLONE MYTOUR
```

---

## 25. Future component map (do not create)

Domain stays in `HomeScreen` / existing hooks. Presentation is native-only after Phase 0.

| Candidate | Responsibility | Props (concept) | Data / domain | Native vs shared | Testability | Rollback |
|---|---|---|---|---|---|---|
| `VionaNativeHomeHeader` | Greeting, identity, locale cue | greeting lines | HomeScreen | Native presentation | Static + a11y labels | Swap internals |
| `VionaNativeHomePrimaryEntry` | Find + optional Ask | onFind, onAsk, labels | HomeScreen routes | Native UI; reuse universe search later | No fake-result tests | Hide Ask if AI off |
| `VionaNativeUniverseLauncher` | 2×2 / 4-across | four items: title, chip, image, onPress | `goUniverse*` | Native; do not restyle `VionaFashionWorldCard` in place | Handler statics | Remount old tiles only inside native boundary |
| `VionaNativeQuickActions` | 4–6 + More | existing item model | same handlers | Native | Capability list golden | Restore eight-pill density inside native |
| `VionaNativeCompanionModule` | Hide-if-empty | optional models | HomeScreen | Native | Empty = unmounted | Unmount |
| `VionaNativeDiscoverySection` | Sparse discovery | optional | HomeScreen | Native | Demo labeled | Unmount |
| `VionaNativeHomeOpeningStage` | Phase 0 boundary | opening props | Phase 0 plan | **Prerequisite** | Phase 0 tests | Phase 0 rollback contract |

---

## 26. Web preservation

| Surface | Class |
|---|---|
| Native header / Find / launcher / actions / companion / discovery | **NATIVE_ONLY** |
| Handlers, flags, i18n, auth paywall | **SHARED_LOGIC + NATIVE_PRESENTATION** |
| `VionaFashionHomeAdaptiveComposition` visuals | **FROZEN** |
| `VionaFashionWorldCard` visuals | **FROZEN** |
| `fashionTech` / `premiumTileVisualTokens` | **FROZEN** |
| Web desktop command bar / daylight / hover | **FROZEN** |
| `MainTabNavigator` / `routes.ts` | **FROZEN** |

Do not require web restyle.

---

## 27. Migration sequence (planning only)

Every step needs **separate** operator authorization.

0. Phase 0 isolation **complete** (runtime)
1. Native token namespace / parity setup
2. Header
3. Find / Ask
4. Universe launcher
5. Quick actions
6. Companion
7. Discovery / Care
8. Responsive phone / tablet / landscape
9. Accessibility
10. Regression proof (web freeze + six universes + SOS)

---

## 28. Acceptance model (future implementation, not this packet)

- Phase 0 already complete
- Web unchanged
- Clear hierarchy; launcher above fold
- Home usable with AI disabled
- Local, Travel, Academy, Business, Account, SOS reachable
- SOS behavior unchanged (3000ms, exact-one, canonical modal)
- No fake commerce
- Phone portrait / landscape and tablet portrait / landscape green
- Accessibility green
- Rollback of native internals possible while Phase 0 boundary remains
- Design Mode Lock amendment, if ever required, is a **separate** governance packet

---

## 29. Rollback

Revert **native presentation internals** (`VionaNativeHomeOpeningStage` children after Phase 0). Leave the Phase 0 presentation boundary intact.

Do not require rollback of web, API, DB, auth, routes, or SOS backend.

---

## 30. Risk register

| Risk | Severity | Likelihood | Mitigation | Proof |
|---|---|---|---|---|
| WEB REGRESSION | High | High if shared restyle | Native-only modules; freeze shared visuals | Diff denylist + web mount goldens |
| FUNCTION LOSS | High | Medium | No DELETE; chips | Function matrix tests |
| VISUAL OVERLOAD | Medium | High | Short identity; 2×2; 4–6 actions | Portrait wireframe review |
| OTA REDUCTION | High | Medium | Companion IA; sparse discovery | IA checklist |
| AI DOMINANCE | Medium | Medium | Ask as chip; works if AI off | AI-off path |
| SOS DUPLICATION | High | Medium | No second host | SOS statics |
| ACCOUNT DISCOVERABILITY | Medium | High | Chrome labeling, not fifth tab | Chrome a11y |
| NAVIGATION DRIFT | High | Low if denied | Option A four tabs | `routes.ts` / tabs frozen |
| TABLET STRETCHING | Medium | Medium | 4-across / two-pane; never web desktop | Tablet wireframes |
| DESIGN LOCK DRIFT | High | Medium | Carve not activated | Lock file untouched |
| FAKE COMMERCE | High | Medium | REQUEST_ONLY; hide empty | Copy/guards |
| CARD TAXONOMY OVERLOAD | Medium | Medium | Six families max on Home | Spec |
| ASSET MISMATCH | Medium | Medium | RE-CROP existing; no pack now | Asset pack later |
| ACCESSIBILITY REGRESSION | High | Medium | 44–48, order, contrast | A11y criteria |
| PHASE0_DEPENDENCY_BYPASS | High | Medium | Explicit runtime gate | Isolation tests before Phase 1 UI |

---

## 31. Status

This document is an **implementation-ready visual architecture PLAN**. Isolation and Clear Premium remain not implemented / not activated.

```text
VIONA_MOBILE_PHASE1_RUNTIME_REQUIRES_PHASE0_NATIVE_PRESENTATION_ISOLATION_COMPLETE
```

**Next action (exactly one):** separately authorize a strict read-only review of this three-file packet.

Do not implement runtime.
