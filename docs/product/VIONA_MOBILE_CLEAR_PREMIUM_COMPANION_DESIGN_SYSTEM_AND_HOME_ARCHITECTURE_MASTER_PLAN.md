# VIONA — Mobile Clear Premium Companion
# Design System and Home Architecture Master Plan

**Document type:** Docs-only product Master Plan (planning; not implementation).
**Mode:** Audit-first · plan-only · uncommitted · zero runtime change · zero web visual change.
**Dedicated branch:** `docs/viona-mobile-clear-premium-companion-master-plan`
**Branch HEAD / origin/master:** `c6a19e203a3aa6897cffad8dc9d908f9bca9e9ec`

**Branch authorization (precedes branch creation):**

```text
APPROVE_VIONA_MOBILE_CLEAR_PREMIUM_COMPANION_MASTER_PLAN_DEDICATED_DOCS_BRANCH_FROM_ORIGIN_MASTER_C6A19E203A3AA6897CFFAD8DC9D908F9BCA9E9EC_WITH_EXACT_THREE_DOCS_PATHS_UNCOMMITTED_ZERO_STAGE_ZERO_PUSH_ZERO_PR_ZERO_RUNTIME_CHANGE_ZERO_WEB_VISUAL_CHANGE_ZERO_FUNCTION_REMOVAL
```

**Content authorization (design-scope authority):**

```text
APPROVE_VIONA_MOBILE_CLEAR_PREMIUM_COMPANION_DESIGN_SYSTEM_AND_HOME_ARCHITECTURE_MASTER_PLAN_DOCS_ONLY_ZERO_RUNTIME_CHANGE_ZERO_WEB_VISUAL_CHANGE_ZERO_FUNCTION_REMOVAL
```

**Companion spec:** `docs/design/VIONA_MOBILE_CLEAR_PREMIUM_COMPANION_DESIGN_SYSTEM_SPEC.md`
**Evidence:** `docs/design/evidence/cursor-viona-mobile-clear-premium-companion-design-system-and-home-architecture-master-plan/README.md`

**Subordinate to:** `docs/ai-context/VIONA_OPERATING_PROTOCOL.md` and founder-signed Master Blueprint.
Safety, payment, tenant, SOS, and zero-loss rules override visual ambition.

This packet does **not** authorize UI implementation, navigation mutation, web restyle, design-lock amendment, asset generation, staging, commit, PR, merge, gate dispatch, bootstrap, protection mutation, containment release, freeze release, or B1B.

PR #450 implementation branch was left clean at fixed head `7c9feafd8efa97f345884f86af2902f4a21e5833` before this dedicated docs branch was created.

---

## Locked planning markers

```text
VIONA_APP_CLEAR_PREMIUM_COMPANION_DESIGN_DIRECTION_SELECTED
VIONA_WEB_VISUAL_ARCHITECTURE_PRESERVED
NO_FUNCTION_REMOVAL
MOBILE_ONLY_VISUAL_ARCHITECTURE_EVOLUTION
VIONA_NATIVE_LIGHT_FIRST_CLEAR_PREMIUM_CARVE_PROPOSED_NOT_ACTIVATED
VIONA_NATIVE_PRESENTATION_ISOLATION_REQUIRED_BEFORE_CLEAR_PREMIUM_RUNTIME_ACTIVATION
ADAPT UX PRINCIPLES
DO NOT CLONE MYTOUR VISUAL DESIGN
REQUEST_ONLY_NO_CHARGE
```

**Distinguish:**

| Layer | Status |
|---|---|
| Selected design **direction** | Clear Premium Companion (this packet) |
| Runtime **activation** | **NOT AUTHORIZED** |
| Design-mode lock amendment | **NOT EXECUTED** |
| Shared adaptive restyle | **NOT AUTHORIZED** (would change web) |

---

## 1. Executive decision

VIONA’s next-generation **consumer native mobile** visual **direction** is:

**VIONA CLEAR PREMIUM COMPANION**

That direction is a **planning selection**. It is **not** current canonical product UI, **not** a design-lock change, and **not** runtime activation.

| Decision | Lock |
|---|---|
| Product identity | Global Vietnamese Companion OS · Super App / Mini-App Platform |
| Selected native direction | Light-first, calm premium, high readability — **proposed carve only** |
| Current canonical product UI (docs lock) | Dark / Fashion-Tech / luminous-dark remains factual (`VIONA_DESIGN_MODE_LOCK.md` **unchanged**) |
| Web | Current Fashion-Tech architecture **preserved** |
| Shared RN adaptive Home | Must **not** be restyled until native presentation isolation exists |
| Functions | Keep all capabilities; unready surfaces stay Lite / Demo / Pilot / Beta / Coming Soon / Gated / Frozen |
| Home | Companion OS Home — not marketing landing, dashboard wall, OTA homepage, or AI chatbot homepage |
| Current B2C nav (fact) | Home · Local · Travel · Academy |
| Account (fact) | chrome → PersonalHub |
| Future nav | Evaluated (Option A vs B); **not implemented** |
| Business | Universe launcher / role switch / B2B role shell — not a sixth B2C tab |
| SOS | Global safety affordance; 3000ms hold; exact-one host; never a commerce destination |
| AI | Contextual, available, not visually dominant |
| Commercial | `REQUEST_ONLY_NO_CHARGE`; no fake prices/discounts/bookings |
| Migration | Additive / controlled; isolation first |

**This Master Plan is not implementation authority.** Each future phase needs its own operator authorization, exact file allowlist, visual acceptance criteria, and rollback boundary.

---

## 2. Current verified source state

Reused from the completed audit. No broad re-exploration after branch creation.

### 2.1 Home renderer and shell-mode

| Item | Source fact |
|---|---|
| Home renderer | `src/screens/HomeScreen.tsx` |
| Shell-mode resolver | `src/navigation/fashionHomeShellMode.ts` → `legacy` \| `mobile` \| `tablet` \| `desktop` |
| Adaptive composition | `src/components/viona/VionaFashionHomeAdaptiveComposition.tsx` |
| Architecture | `SHARED_ADAPTIVE_NATIVE_REUSE` |
| Web mobile/tablet | Reuses the same adaptive composition (Phase B) |
| Native iOS/Android B2C Home | Reuses the same adaptive composition (Phase C) |
| Desktop Fashion-Tech | **Web-only**, width ≥ 769, B2C Home |
| Native desktop mode | Native **never** resolves `desktop` |
| World cards | Local, Travel, Academy, Business (+ Care/impact strip, not a tab) |
| Quick actions (current) | book/request services, quick translate, AI assistant, documents, nearby support, travel lite, learning |
| Legacy hybrid root | Retained as rollback when adaptive inactive |

**Implication:**

```text
RESTYLING SHARED ADAPTIVE HOME WITHOUT PLATFORM SPLIT CAN CHANGE WEB.
VIONA_NATIVE_PRESENTATION_ISOLATION_REQUIRED_BEFORE_CLEAR_PREMIUM_RUNTIME_ACTIVATION
```

### 2.2 Current B2C navigation (runtime truth)

| Item | Fact |
|---|---|
| Tabs | **Home · Local · Travel · Academy** (exactly four) |
| Academy route | `TabAi`, labeled Academy |
| Account | **Not** a B2C bottom tab |
| Account path | chrome (`VionaShellAccountLanguageActions`) → `PersonalHub` |
| Business | World/universe card + role switch; B2B uses a **separate** four-tab role shell |
| Local/Travel/Academy | Hide shared tab bar; in-universe rails own SOS / account / language |
| Fashion desktop | Hides tab bar; command bar owns SOS / account / language |

Do **not** describe a five-tab navigation as current runtime truth.

### 2.3 SOS (runtime truth)

| Item | Fact |
|---|---|
| Hold | `V7_SOS_HOLD_TO_TRIGGER_MS = 3000` |
| Control | `VionaGlobalSosShellAction` |
| Modal | Canonical `src/screens/b2c/SOSModal.tsx` (singular MainTabNavigator mount) |
| Hosting | Exact-one: tab chrome **or** in-screen rail **or** fashion command bar |
| Academy | Global shell SOS hidden; in-rail SOS via `VionaGlobalTopRail` |
| Min touch | 44 |

Future visual planning must preserve deliberate hold, exact-one reachability, safety semantics, no commerce styling, and no fake emergency behavior.

### 2.4 Design system (runtime / docs truth)

| Layer | Fact |
|---|---|
| Light pastel tokens | Present in `src/design/vionaTokens.ts` (`colors`, light gradients) |
| `fashionTech` dark tokens | Present in the same file |
| Premium tiles | `src/design/premiumTileVisualTokens.ts` — luminous **dark-glass** |
| Hub auras | `src/theme/colors.ts` — dark navy/charcoal core |
| Typeface | **Montserrat** (`src/theme/typography.ts`) — canonical family **exists** |
| Design-mode lock | `docs/design/VIONA_DESIGN_MODE_LOCK.md` — **dark is primary product UI**; light is presentation-only |

```text
VIONA_NATIVE_LIGHT_FIRST_CLEAR_PREMIUM_CARVE_PROPOSED_NOT_ACTIVATED
```

Light-first is **not** already canonical. This packet does **not** edit the design-mode lock.

### 2.5 Commercial

Current local commercial boundary: `REQUEST_ONLY_NO_CHARGE`.
Do not introduce fake pricing, booking, payment, inventory, discount, or fulfillment states.

---

## 3. Why mobile and web may diverge

Web is **not** inferior. It is a different canvas with a preserved architecture.

| Web (preserve) | Native app (proposed later) |
|---|---|
| Larger canvas; editorial / multi-column | One-hand usage; thumb reach |
| Fashion-Tech / luminous-dark already shipped | Faster scanning; shorter chains |
| Hover, command bar, desktop ≥769 | Touch-first; no desktop command bar on native |
| Shared adaptive composition on mobile-web | Needs **isolation** before restyle |

Divergence is a **platform split of presentation**, not a claim that web should become light-first or that native should clone web glow.

---

## 4. Mobile north star (selected direction, not activated)

**VIONA CLEAR PREMIUM COMPANION**

- Clarity before decoration
- Premium calmness
- Trust
- One-hand usability
- Natural scrolling
- Clear actions
- Semantic color (one leading accent per screen)
- Contextual AI (not dominant)
- Globally reachable SOS
- Commercial clarity without promotion overload

Premium from typography, spacing, composition, imagery, motion, consistency, touch quality — not neon, glow stacks, or decorative glass.

**Principle:** `CLARITY_BEFORE_DECORATION`

Every major native screen should answer in ~1–2 seconds: Where am I? What can I do? What is most important? What is next? How do I go back? How do I reach SOS?

---

## 5. Home information architecture (planning)

Home is **Companion OS Home**.

Planning structure:

1. Contextual header (greeting, context, notify; language/account per exact-one host rules)
2. Primary find / search / ask entry (AI as secondary chip, not full-screen chat)
3. Universe launcher (Local · Travel · Academy · Business)
4. Quick actions (4–6; preserve current capabilities; honest readiness chips)
5. Contextual companion state (slots only until real data)
6. Discovery modules (modular; hide when empty)
7. Relevant commercial module (at most one in primary flow)
8. AI contextual entry
9. Persistent navigation (current four-tab **fact**; future option evaluated in §6)
10. Global SOS reachability (shell; not a Home commerce card)

Avoid: dashboard wall · AI-chat-only Home · OTA clone · banner feed.

Quick-action capability map (preserve, do not remove):

| Current action | Planning slot |
|---|---|
| Book / request services | Local |
| Quick translate | Travel / AI contextual |
| AI assistant | Contextual AI |
| Documents / vault | Account utility |
| Nearby support | Local |
| Travel Lite | Travel |
| Learning | Academy |

---

## 6. Navigation decision study

### Current fact (not a recommendation)

Home · Local · Travel · Academy. Account via chrome → PersonalHub. Business via universe / role shell.

### OPTION A — Preserve four-tab B2C nav

Home / Local / Travel / Academy. Account stays persistent chrome/profile access.

| Criterion | Assessment |
|---|---|
| One-hand reach | Four destinations + SOS chip; lowest crowding |
| Cognitive load | Lowest; matches shipped muscle memory |
| Discoverability | Account weaker if chrome is visually quiet |
| Migration cost | **Lowest** — zero route/tab change |
| Route compatibility | Exact current `MAIN_TAB.B2C` |
| SOS coexistence | Best fit with exact-one chrome host on Home |
| Business role-mode | Unchanged (separate B2B shell) |
| Web isolation | No tab-structure change; still need Home presentation split |
| Accessibility | Fewer tab stops; Account must keep accessible name in chrome |
| Screen width | Local/Travel already hide tabs for rails — unchanged |

### OPTION B — Five-tab B2C nav

Home / Local / Travel / Academy / Account.

| Criterion | Assessment |
|---|---|
| One-hand reach | Tighter; five labels + SOS chip on phone |
| Cognitive load | Higher; Account becomes a destination |
| Discoverability | Stronger for orders/language/points (Mytour-like account clarity) |
| Migration cost | **Higher** — nav structure pack; chrome host matrix must be re-proven |
| Route compatibility | Can wrap `PersonalHub` without renaming `TabAi`; still a nav pack |
| SOS coexistence | Must re-prove exact-one hosts; more chrome density |
| Business role-mode | Must not add Business as sixth B2C tab |
| Web isolation | Tab change can affect web bottom bar unless gated native-only |
| Accessibility | Account more findable; more tab items to swipe |
| Screen width | Compact labels required; collision on small phones |

### Formal planning recommendation

**Recommend OPTION A as the default path for Phases 0–3** (preserve four-tab runtime; improve Account chrome labeling/reach if a later restyle pack is authorized).

**Keep OPTION B as a separately authorized later evaluation** after Home presentation isolation exists and Account discoverability has been measured — not as current truth, not as implementation.

Rationale: isolation + Home clarity first; nav mutation is a high-coupling change to SOS exact-one hosts and web tabs. Discoverability of Account is a real gap, but it can be improved inside chrome before adding a fifth tab.

**This recommendation is not implementation authorization.**

---

## 7. Six-universe governance

Kernel lists Home as hub plus Local / Travel / Academy / Business / Account / SOS. No universe deletion.

### Local

Nearby · search · categories · Vietnamese businesses · services · community · requests · saved · offers **when real**. Local must work **without AI**. `REQUEST_ONLY_NO_CHARGE`.

### Travel

Search/context · categories (hotel/flight/transport/explore as **capability slots**) · trip state · recommendations · service cards · Vietnamese assistance · translation · fixer · safety · embassy. Strongest allowed **clarity** borrowing from modern travel apps. **No** fake live commerce.

### Academy

Continue learning · Today · Vietnamese · culture · family · AI tutor **Beta** · progress. No sale-heavy visual language. No fake certification.

### Business

Today · Requests · Bookings · Customers · status/revenue snapshot (honest empty) · AI Receptionist (labeled) · products/services · team · settings. Premium operational UX, not consumer promo tiles. No fake operational values. Entry: universe card + role shell — **not** a B2C sixth tab.

### Account

Identity · profile · VIO Points (honest) · requests/orders · saved · language · Business mode · privacy/security · support · settings. **Current fact:** chrome → PersonalHub. Logged-out / logged-in / role switch explicit. No fake wallet.

### SOS

Separate safety contract (§14). Not a commerce universe.

---

## 8. Function-preservation matrix

Never **DELETE**. Unready = Lite / Demo / Pilot / Beta / Coming Soon / Gated / Frozen.

| Capability | Current location | Future planning location | Class | Readiness | Guard | Phase |
|---|---|---|---|---|---|---|
| Home hub | TabHome | Home tab | RESTRUCTURE_LATER native + PLATFORM_SPLIT_REQUIRED | Active shell | Honest labels | 0–1 |
| Adaptive composition | Shared web+native | Native-isolated presentation | PLATFORM_SPLIT_REQUIRED | Active | Web preserve | 0 |
| World cards L/T/A/B | Home | Home launcher | KEEP capability · RESTYLE_LATER native only | Mixed chips | Flags | 1 |
| Care / charity | Home CharityWidget | Discovery/utility | KEEP | Impact secondary | No fake donation | 1 / 8 |
| Quick actions | Home strip | Home quick actions | KEEP · RESTRUCTURE_LATER density | Active | Honest | 1 |
| Local universe | TabLocal | Local tab | RESTYLE_LATER native | Lite chips | REQUEST_ONLY_NO_CHARGE | 3 |
| Local requests | Inbox / status routes | Local + Account | KEEP | Pack-gated | No fake paid | 3–4 |
| Travel hub | TabTravel | Travel tab | RESTYLE_LATER native | `travelEnabled` / Coming Soon | No fake booking | 2 |
| Interpreter | Quick action + Travel | Same | KEEP | Pilot/Demo | Cost firewall | 2 / 8 |
| Academy | TabAi | Academy tab | KEEP route · RESTYLE_LATER | Demo chip | No fake certs | 5 |
| Business / merchant | World card + B2B tabs | Launcher + role shell | KEEP | Pilot + flags | Tenant isolation | 6 |
| B2B wholesale/import | Merchant surfaces | Business workspace | KEEP | Gated | Protocol §10.6 | 6 |
| Account / PersonalHub | Chrome → PersonalHub | Same (Option A) or fifth tab later (Option B pack) | KEEP · possible RESTRUCTURE_LATER | Active | No fake wallet | 4 |
| Language / Smart Trio | Chrome Language | Header + Account | KEEP | Active | Locale honesty | 4 / 0 |
| Role switch | ProfileSwitcher | Account + header | KEEP | Multi-role | Authz | 4 |
| VIO / wallet | Wallet / PersonalHub | Account | KEEP | Honest empty | Ledger rails | 4 |
| Documents / vault | Home quick action | Account + quick action | KEEP | Protected | Auth | 4 |
| AI assistant / Leona | Quick action | Contextual AI | KEEP | Protected | Cost + confirm | 8 |
| AI Receptionist | Business | Business | KEEP | Pilot | No fake calling | 6 |
| Broker / Admin shells | Role tabs | Out of B2C IA | KEEP | Gated | Authz | n/a |
| SOS Basic | Shell hold → SOSModal | Global SOS | SAFETY_PRESERVE | Lite/active entry | Protocol SOS | 7 |
| SOS Plus | SOS surface | SOS sheet | SAFETY_PRESERVE | Pilot/Gated | No fake Stripe | 7 |
| Notifications | Header affordance | Header | KEEP slot | NEEDS_CONFIRMATION counts | No fake badges | 1 |
| Search | Partial | Home primary entry | KEEP/add slot | NEEDS_CONFIRMATION depth | No fake results | 1 |

---

## 9. Travel

Travel may borrow **clarity** most strongly from modern travel apps (not visual clone).

Plan: search/context · categories · trip state · recommendations · hotel/flight/service **cards as slots** · Vietnamese assistance · translation · fixer · safety · embassy · saved/recent.

Photography allowed. No claimed availability, booking, discount, stock, or fulfillment without production data.

---

## 10. Local

Plan: nearby · search · categories · Vietnamese businesses · services · community · requests · saved · offers when real.

Service-card slots: image, title, category, rating, distance, price indication, availability, CTA — live claims evidence-backed later. **Works without AI.**

---

## 11. Academy

Plan: continue learning · today · Vietnamese · culture · family · AI tutor Beta · progress.

No flash-sale language, fake certification, or unsupported high-stakes grading.

---

## 12. Account

**Current fact:** chrome → PersonalHub; not a bottom tab.

Plan sections: identity · profile · VIO Points · requests/orders · saved · language · Business mode · privacy/security · support · settings.

Option A keeps this routing. Option B would be a later pack wrapping the same hub.

---

## 13. Business

Plan premium operational UX: Today · Requests · Bookings · Customers · status/revenue snapshot · AI Receptionist · products/services · team · settings.

No fake revenue, booking, order, payment, inventory, supplier, or AI calling. Do not force consumer Premium App Tiles onto every Business surface.

---

## 14. SOS safety contract

Preserve:

- 3000ms hold (`V7_SOS_HOLD_TO_TRIGGER_MS`)
- Exact-one reachability
- Canonical `SOSModal`
- Safety-first semantics
- Operating Protocol copy: SOS does not replace local emergency services

Do not: commerce banners, discounts, gamification, fake dispatch/GPS/recording/Twilio/routing, extra FABs that break exact-one hosting.

Red reserved for actual safety/critical meaning — not OTA sale chrome.

---

## 15. AI UX

AI is contextual, available, cost-aware, **non-dominant**. Home is not an AI chat interface.

Preserve personas where applicable: Minh Khang · Leona · Lễ Tân AI · Cô Giáo AI.

States: entry · minimized · expanded sheet · loading/cost guard · unavailable · Beta · tool-confirmation.

This packet authorizes **zero** runtime AI change.

---

## 16. Device architecture

Do not treat tablet as stretched phone. Web out of native redesign implementation scope.

| Device | Planning |
|---|---|
| Phone portrait | Default IA; universe 2×2 |
| Phone landscape | Compress hero; tabs + SOS reachable |
| Tablet portrait | Max content ~720–800; 4-up universe; 2-col discovery |
| Tablet landscape | Split launcher + companion; **not** desktop Fashion command bar |

Native never activates web desktop shell.

---

## 17. Migration

**ADDITIVE / CONTROLLED.** Isolation first, then controlled rollout. No big-bang replace of `HomeScreen.tsx`.

1. Native presentation boundary (flag / platform branch / dedicated composition) so web adaptive path stays
2. Map proposed tokens to native-only primitives
3. Roll out by phase with rollback to current adaptive/legacy roots

`SHARED_ADAPTIVE_NATIVE_REUSE` remains current architecture until a later isolation pack.

---

## 18. Phases

No phase is authorized by this Master Plan.

| Phase | Scope |
|---|---|
| 0 | Native presentation boundary + design primitives |
| 1 | Home |
| 2 | Travel |
| 3 | Local |
| 4 | Account (chrome first; Option B only if separately authorized) |
| 5 | Academy |
| 6 | Business |
| 7 | SOS visual/safety polish (hold/disclaimer preserved) |
| 8 | Motion / accessibility / cross-universe consistency |

---

## 19. Rollback

Every future implementation phase must include:

- Exact file allowlist
- Pre-change baseline SHA
- Visual acceptance (phone + tablet)
- Validation (typecheck, expo readiness, forbidden-claims where relevant)
- Rollback of **native presentation** without changing web, API, auth, routes, SOS backend, payment, or data model

Home: fall back to `viona-fashion-home-adaptive-root` / `viona-home-legacy-hybrid-root` without platform-wide restyle.

---

## 20. Governance

Preserve `REQUEST_ONLY_NO_CHARGE`.

This packet does **not** authorize payment, auth, API, DB, booking, AI runtime, SOS behavioral, or design-lock mutation.

Merge-governance lane (PR #450 / freeze / gate) is independent and **not** mutated here.

---

## Reference UX principles — user-provided Mytour screenshots

```text
ADAPT UX PRINCIPLES
DO NOT CLONE MYTOUR VISUAL DESIGN
```

**Adapt:** strong section hierarchy; large clear categories; predictable card grouping; obvious travel product metadata; simple scanning; clear account structure; readable order state; stable bottom navigation; strong photography; direct CTA hierarchy; natural vertical scrolling.

**Do not copy:** exact screen layout; exact top category rail; exact bottom navigation; pink/red commercial palette; promotional banner density; flash-sale composition; badges; icons; artwork; proprietary wording; product-card composition pixel-for-pixel.

---

## Home master wireframes (text only)

No image assets. SOS is shell, not a commerce card. Nav shown as **current four-tab fact**; Account chrome remains.

### PHONE PORTRAIT

```text
[safe-area top]
[ Header: greeting | notify | account/lang per exact-one host ]
[ Primary: Search / Ask / Find          (AI chip) ]
[ Universe launcher: Local | Travel | Academy | Business ]
[ Quick actions  2 x 2 or scroll ]
[ Companion slot (honest empty OK) ]
[ Discovery modules ]
[ Optional single commercial module ]
[safe-area bottom]
[ Home | Local | Travel | Academy ]
[ SOS hold in chrome on Home — exact-one ]
```

### PHONE LANDSCAPE

```text
[compact header] [search]
[quick actions row] [universe horizontal]
[discovery condensed]
[four tabs + SOS reachable]
```

### TABLET PORTRAIT

```text
[centered max-width]
[search] [quick actions row]
[universe 4-up] [two-column discovery]
[four tabs + SOS]
```

### TABLET LANDSCAPE

```text
[ left: launcher + quick actions ]
[ right: companion + discovery ]
[ four tabs; native never desktop command bar ]
[ SOS exact-one ]
```

---

## Drift report (summary)

See evidence README for the full matrix. Headlines:

- Dark design lock remains canonical; light-first is a **proposed native carve**, not activated.
- Shared adaptive Home **will change web** if restyled without isolation.
- Four-tab B2C is current truth; five-tab is an unevaluated-until-now option, now evaluated, **not** shipped.
- Account is chrome → PersonalHub.
- SOS 3000ms hold + exact-one host.
- Kernel/Handoff not edited.

---

## Classification markers

```text
VIONA_WEB_VISUAL_ARCHITECTURE_PRESERVED_IN_PLAN
VIONA_NATIVE_LIGHT_FIRST_CLEAR_PREMIUM_CARVE_PROPOSED_NOT_ACTIVATED
VIONA_NATIVE_PRESENTATION_ISOLATION_REQUIRED_BEFORE_CLEAR_PREMIUM_RUNTIME_ACTIVATION
VIONA_CURRENT_FOUR_TAB_B2C_NAVIGATION_FACT_PRESERVED
VIONA_ACCOUNT_CHROME_PERSONAL_HUB_FACT_PRESERVED
VIONA_MOBILE_FUTURE_NAVIGATION_OPTIONS_EVALUATED
VIONA_MOBILE_SIX_UNIVERSE_FUNCTION_PRESERVATION_DOCUMENTED
VIONA_MOBILE_SOS_THREE_SECOND_HOLD_SAFETY_CONTRACT_PRESERVED
```

Not claimed: `READY_TO_IMPLEMENT` · `DESIGN_LOCK_CHANGED` · `LIGHT_MODE_CANONICAL` · `READY_TO_RESTYLE_SHARED_ADAPTIVE_COMPONENT` · `READY_TO_CHANGE_BOTTOM_NAV` · `READY_TO_MODIFY_WEB` · `READY_TO_REMOVE_FUNCTIONS`.
