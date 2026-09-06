# VIONA — Mobile Clear Premium Companion
# Phase 1 Clear Premium Native Home
# Implementation Plan

**Document type:** Docs-only implementation plan (planning; **not** runtime implementation).
**Mode:** Dedicated local docs branch · exact two new docs · uncommitted · zero stage / commit / push / PR.
**This packet does not implement runtime, restyle web, change navigation, change SOS, or remove functions.**

**Dedicated planning branch:** `docs/viona-mobile-phase1-clear-premium-native-home-implementation-plan`
**Created from:** `51153bc3f6303d78effc75fd8f31ec43895a613b`
**Parent:** `b21d407b26788cebf5cc28f84be9c64f8b2f1f1f` (Phase 0 isolation plan)

**Evidence:** `docs/design/evidence/cursor-viona-mobile-phase1-clear-premium-native-home-implementation-plan/README.md`

**Authorization:**

```text
APPROVE_VIONA_MOBILE_PHASE1_CLEAR_PREMIUM_NATIVE_HOME_IMPLEMENTATION_PLAN_PACKET_ON_DEDICATED_LOCAL_DOCS_BRANCH_FROM_51153BC3F6303D78EFFC75FD8F31EC43895A613B_WITH_EXACT_TWO_NEW_DOCS_UNCOMMITTED_ZERO_STAGE_ZERO_COMMIT_ZERO_PUSH_ZERO_PR_ZERO_RUNTIME_CHANGE_ZERO_WEB_VISUAL_CHANGE_ZERO_NAVIGATION_CHANGE_ZERO_SOS_BEHAVIOR_CHANGE_ZERO_FUNCTION_REMOVAL
```

**Source authorities:**

1. `docs/product/VIONA_MOBILE_CLEAR_PREMIUM_COMPANION_DESIGN_SYSTEM_AND_HOME_ARCHITECTURE_MASTER_PLAN.md`
2. `docs/design/VIONA_MOBILE_CLEAR_PREMIUM_COMPANION_DESIGN_SYSTEM_SPEC.md`
3. `docs/product/VIONA_MOBILE_PHASE0_NATIVE_PRESENTATION_ISOLATION_IMPLEMENTATION_PLAN.md`
4. `docs/product/VIONA_MOBILE_PHASE1_CLEAR_PREMIUM_NATIVE_HOME_VISUAL_ARCHITECTURE_MASTER_PLAN.md`
5. `docs/design/VIONA_MOBILE_PHASE1_CLEAR_PREMIUM_NATIVE_HOME_VISUAL_SPEC.md`
6. Completed Phase 1 strict read-only implementation architecture audit

**Preserved audit classification:**

```text
READY_FOR_VIONA_MOBILE_PHASE1_CLEAR_PREMIUM_NATIVE_HOME_IMPLEMENTATION_PLAN
VIONA_MOBILE_PHASE0_NATIVE_PRESENTATION_ISOLATION_PLANNED_NOT_IMPLEMENTED
PHASE1_RUNTIME_REQUIRES_PHASE0_NATIVE_PRESENTATION_ISOLATION_COMPLETE
```

This packet does **not** authorize runtime implementation of Phase 0 or Phase 1. A future Phase 1 runtime packet requires **all six items in §3**, the exact file allowlist below, and a strict read-only review of this plan first.

PR #450 is independent and must not be touched.

---

## 1. Locked planning markers

```text
VIONA_MOBILE_PHASE1_OPTION_B_OPENING_STAGE_MOUNTS_CLEAR_PREMIUM_COMPOSITION_SELECTED
VIONA_MOBILE_PHASE1_SHARE_DOMAIN_ISOLATE_NATIVE_PRESENTATION
VIONA_MOBILE_PHASE1_SHARED_WORLD_CARD_RESTYLE_REJECTED
VIONA_MOBILE_PHASE1_COMPANION_AND_DISCOVERY_MODULES_DEFERRED
VIONA_NATIVE_LIGHT_FIRST_CLEAR_PREMIUM_CARVE_PROPOSED_NOT_ACTIVATED
VIONA_NATIVE_PRESENTATION_ISOLATION_REQUIRED_BEFORE_CLEAR_PREMIUM_RUNTIME_ACTIVATION
VIONA_WEB_VISUAL_ARCHITECTURE_PRESERVED
NO_FUNCTION_REMOVAL
```

**Eventual implementation acceptance marker (not achieved by this docs lane):**

```text
VIONA_WEB_VISUAL_ARCHITECTURE_UNCHANGED_BY_PHASE1
```

**Do not claim:**

```text
READY_TO_IMPLEMENT
CLEAR_PREMIUM_ACTIVATED
VIONA_NATIVE_PRESENTATION_ISOLATED
LIGHT_MODE_CANONICAL
BOTTOM_NAV_CHANGED
WEB_RESTYLED
```

---

## 2. Objective and non-goals

### 2.1 Objective

After Phase 0 native presentation isolation exists, fill the native Home boundary with Clear Premium Companion presentation:

- compact header (greeting + identity);
- honest Find / Ask slot (no fake results);
- 2×2 (phone) / 4-across (tablet or landscape) universe launcher for Local, Travel, Academy, Business;
- quick actions as 4–6 visible + More, preserving all eight current capabilities.

Domain stays in `HomeScreen`. Web Fashion-Tech stays frozen.

```text
CLEAR PREMIUM NATIVE HOME
!=
WEB RESTYLE
!=
PHASE 0 ISOLATION (prerequisite, still not implemented)
```

### 2.2 Non-goals (explicit)

Phase 1 must **not**:

- run before Phase 0 isolation is complete in runtime;
- implement Phase 0 as a side effect of this plan;
- restyle `VionaFashionHomeAdaptiveComposition` internals;
- restyle `VionaFashionWorldCard` in place;
- change web desktop / web mobile / web tablet visuals;
- amend `docs/design/VIONA_DESIGN_MODE_LOCK.md`;
- mutate `vionaTokens.fashionTech` or `premiumTileVisualTokens`;
- add, remove, relabel, or reorder bottom tabs;
- move Account into the tab bar;
- move Business into the B2C tab bar;
- change SOS hold, host, modal, or reachability;
- mount a second SOS modal or hold control on Home;
- fabricate search results or live news;
- create companion/discovery modules without a real data source;
- duplicate universe handlers, feature flags, auth/paywall, role logic, or route constants;
- fork `HomeScreen.tsx` or `MainTabNavigator.tsx`;
- activate light-first as a global product canonical.

---

## 3. Phase 0 prerequisite (hard gate)

Current truth:

```text
VIONA_MOBILE_PHASE0_NATIVE_PRESENTATION_ISOLATION_PLANNED_NOT_IMPLEMENTED
```

**Do not describe Phase 0 as already implemented.** Isolation remains planned, not implemented.

Phase 1 **runtime** implementation must **not begin** until all of the following are true:

1. Phase 0 native presentation isolation has been **implemented** (not merely planned).
2. Phase 0 targeted tests are green (`scripts/test-viona-mobile-phase0-native-presentation-isolation.ts` plus existing shell-mode goldens).
3. Web desktop / web mobile / web tablet preservation is verified.
4. `native-adaptive` resolves through `VionaNativeHomeOpeningStage`.
5. Phase 0 working tree / exact implementation evidence is verified (allowlist match; denylist absent from the Phase 0 diff).
6. A **separate** Phase 1 **runtime** implementation authorization is granted (this docs packet is not that authorization).

Expected Phase 0 artifacts (must exist before Phase 1 runtime):

| Path | Role |
|---|---|
| `src/navigation/homePresentationTarget.ts` | `web-desktop` / `web-adaptive` / `native-adaptive` / `legacy` |
| `src/components/viona/VionaNativeHomeOpeningStage.tsx` | Native opening **boundary** (Phase 0 = AdaptiveComposition parity wrapper) |
| `scripts/test-viona-mobile-phase0-native-presentation-isolation.ts` | Isolation goldens |
| `HomeScreen.tsx` opening mount | `native-adaptive` → OpeningStage; `web-adaptive` → AdaptiveComposition |

If those files do not exist, **stop**. Do not start Phase 1 runtime. Do not implement Phase 0 as a side effect of Phase 1.

Phase 0 OpeningStage currently (planned): presentation-only AdaptiveComposition props; **no children**; world cards remain HomeScreen siblings.

Phase 1 **inhabits** that boundary. It does not replace Phase 0.

---

## 4. Architecture decision

```text
VIONA_MOBILE_PHASE1_OPTION_B_OPENING_STAGE_MOUNTS_CLEAR_PREMIUM_COMPOSITION_SELECTED
```

| Option | Meaning | Verdict |
|---|---|---|
| A | Phase 1 modules as children of OpeningStage | Reject as the root model — OpeningStage becomes a layout dump |
| **B** | OpeningStage stays the HomeScreen mount identity; internally mounts `VionaNativeHomeClearPremiumComposition` | **Select** |
| C | OpeningStage owns all Phase 1 JSX | Reject — second Home god-file |

**Also required (HomeScreen):** on `native-adaptive` only, **skip** shared `VionaFashionWorldCard` block and shared quick-action strip. Those surfaces move into the native composition. Web-adaptive keeps current siblings.

**Rejected:**

- restyling `VionaFashionWorldCard`;
- Metro `*.native.tsx` forks of `HomeScreen` / AdaptiveComposition / WorldCard;
- duplicating `goUniverse*` / `getFeatureFlags` / paywall inside native-home;
- a Home Account tile or SOS world tile.

Shared domain stays in `HomeScreen`: greeting derivation, `goUniverse*`, `openProtected`, `openInterpreter`, `openSosEntry`, flags, i18n, paywall modals.

### 4.1 Initial Phase 1 runtime scope (lock)

**Include only:** native token namespace; root composition; compact header; honest Find/Ask; four-universe launcher; quick actions 4–6 + More; OpeningStage integration; HomeScreen `native-adaptive` sibling skip; responsive native layout; targeted Phase 1 test script.

**Do not include:** `VionaNativeCompanionModule`; `VionaNativeDiscoverySection`; Home Account activity cue; new assets; new search API; new AI client; new SOS host; new navigation.

---

## 5. Root composition

**Create:** `src/components/viona/native-home/VionaNativeHomeClearPremiumComposition.tsx`

### 5.1 Responsibility

Native-only layout owner:

1. Header
2. Find / Ask
3. Universe launcher
4. Quick-action peek (4–6 + More)
5. Optional `children` (below-fold from HomeScreen; not web WorldCards)

No domain logic. No navigation. No feature-flag reads. No SOS host. No Account chrome.

### 5.2 Grouped props

```ts
type NativeHomeLayoutInput = Readonly<{
  mode: 'mobile' | 'tablet';
  isLandscape: boolean;
  reduceMotion: boolean;
}>;

type VionaNativeHomeClearPremiumCompositionProps = Readonly<{
  layout: NativeHomeLayoutInput;
  header: VionaNativeHomeHeaderProps;
  primaryEntry: VionaNativeHomePrimaryEntryProps;
  launcherItems: readonly VionaNativeUniverseLauncherItem[];
  quickActions: VionaNativeQuickActionsProps;
  children?: React.ReactNode;
}>;
```

`mode` comes from existing shell-mode (`mobile` | `tablet`), never `desktop`.
`isLandscape` is HomeScreen’s existing `width > height`.
`reduceMotion` reuses `useFashionHomePrefersReducedMotion`.

### 5.3 OpeningStage Phase 1 behavior

Phase 0: OpeningStage forwards AdaptiveComposition.

Phase 1: OpeningStage becomes a thin mount:

```text
VionaNativeHomeOpeningStage
  -> VionaNativeHomeClearPremiumComposition
```

Phase 0 AdaptiveComposition props remain available for **rollback**. Phase 1 extends OpeningStage to accept the grouped bags above. HomeScreen does not import the composition directly (keeps one native mount identity).

Distinct `testID` on OpeningStage and composition roots.

---

## 6. HomeScreen contract

`HomeScreen` remains the **domain/orchestration owner**.

Native presentation components must **not**:

- call `getFeatureFlags()`;
- resolve auth;
- switch roles;
- import navigation directly;
- implement paywall;
- fetch Wallet;
- fetch Charity ledger;
- call OpenAI;
- own SOS;
- derive shell-mode;
- duplicate universe handlers.

Pass only: strings, pre-resolved item models, callbacks, presentation booleans, and layout input.

Conceptual mount **after Phase 0 + Phase 1:**

```text
existing domain state / handlers
        |
resolveFashionHomeShellMode              (UNCHANGED)
        |
resolveHomePresentationTarget            (Phase 0; UNCHANGED in Phase 1)
        |
        +-- web-desktop     -> existing desktop render (UNCHANGED)
        |
        +-- web-adaptive    -> AdaptiveComposition + WorldCard + current strip
        |
        +-- native-adaptive -> VionaNativeHomeOpeningStage
        |                      (Clear Premium composition internals)
        |                      skip shared WorldCard + skip shared quick strip
        |                      below-fold siblings remain (Care, legacy, …)
        |
        +-- legacy          -> existing hybrid fallback (UNCHANGED)
```

### 6.1 Allowed future `HomeScreen.tsx` edits (Phase 1)

1. Only the HomeScreen changes explicitly enumerated in this section are authorized. No additional HomeScreen changes are permitted. If another HomeScreen change becomes necessary, STOP and request separate scope expansion.
2. Build `header`, `primaryEntry`, `launcherItems`, `quickActions` from **existing** strings/handlers.
3. Pass those bags into `VionaNativeHomeOpeningStage` for `native-adaptive`.
4. Gate shared world-card JSX and shared quick-action strip: render them for `web-adaptive` (and other current non-native-adaptive paths), **not** for `native-adaptive`.

### 6.2 Forbidden `HomeScreen` edits

- removing web-adaptive WorldCards or the web-adaptive quick strip;
- copying handlers into native files;
- moving or changing `goUniverse*` / `openProtected` / `openInterpreter` / `openSosEntry` behavior;
- changing desktop command bar, daylight, hover, or `Platform.OS === 'web'` trees;
- changing paywall / persona / admin PIN overlays;
- changing routes, auth, or flag resolution;
- importing SOS modal into the native branch;
- adding PersonalHub navigation on the header;
- modifying `resolveFashionHomeShellMode`.

---

## 7. Header contract — `VionaNativeHomeHeader`

**Create:** `src/components/viona/native-home/VionaNativeHomeHeader.tsx`

Compact identity. Not a magazine hero. No Account, language, SOS, or role picker.

```ts
type VionaNativeHomeHeaderProps = Readonly<{
  brandLabel: string;
  greetingLine1: string;
  greetingWish: string;
  localeCue: string;
}>;
```

| Prop | Current source |
|---|---|
| `brandLabel` | `"VIONA"` |
| `greetingLine1` | `fashionDesktopHeaderBlock.line1` |
| `greetingWish` | `fashionDesktopHeaderBlock.wish` |
| `localeCue` | `fashionDesktopHeaderBlock.clockLine` |

Do **not** pass Fashion-Tech hero `eyebrow` / `title` / `subtitle` / constellation image into the header.

---

## 8. Find / Ask contract — `VionaNativeHomePrimaryEntry`

**Create:** `src/components/viona/native-home/VionaNativeHomePrimaryEntry.tsx`

**Current source fact:** Home has no product search field. Local has no Home-like search. `TravelFlightSearch` is a Travel flight-aggregator route — **not** Home Find.

**Phase 1-safe choice: A + C, not B.**

- Find is a labeled entry, not a results box. No query state. No results API.
- `onFind` → existing `goUniverseLocal`.
- Do **not** navigate to `TravelFlightSearch` from Home.
- Ask visible only when `leonaAssistantEnabled`; `onAsk` → existing `openProtected('LeonaCall')`.
- If Ask is hidden, Home remains fully usable.
- Translate stays a quick action.

```ts
type VionaNativeHomePrimaryEntryProps = Readonly<{
  findLabel: string;
  findA11yLabel: string;
  onFind: () => void;
  askVisible: boolean;
  askLabel?: string;
  onAsk?: () => void;
}>;
```

---

## 9. Universe launcher contract — `VionaNativeUniverseLauncher`

**Create:** `src/components/viona/native-home/VionaNativeUniverseLauncher.tsx`

Exactly four entries. No Account tile. No SOS tile.

```ts
type VionaNativeUniverseLauncherItem = Readonly<{
  id: 'local' | 'travel' | 'academy' | 'business';
  label: string;
  readinessLabel: string;
  image: ImageSourcePropType;
  semanticAccent: 'local' | 'travel' | 'academy' | 'business';
  accessibilityLabel: string;
  onPress?: () => void;
}>;
```

HomeScreen builds items from **current** world-card mapping (do not re-read flags inside the tile):

| id | Label source | Readiness today | Handler |
|---|---|---|---|
| `local` | `home.fashionTech.local.title` | `home.worldStage.local.status` (lite) | `goUniverseLocal` |
| `travel` | `home.fashionTech.travel.title` | pilot if `travelEnabled`, else comingSoon | `goUniverseTravel` only if enabled |
| `academy` | `home.fashionTech.academy.title` | demo (current card does not disable on `academyLiteEnabled`) | `goUniverseAcademy` |
| `business` | `home.fashionTech.business.title` | pilot | `goUniverseBusiness` (access check stays inside handler) |

Images: existing daylight card PNGs already required in `HomeScreen` (`IMG_HOME_LOCAL` / `TRAVEL` / `ACADEMY` / `BUSINESS`).

Layout: `mode === 'tablet' || isLandscape` → 4-across; else 2×2.

Do not use the web carousel `width <= 380` rule for this native grid.

---

## 10. Quick-action contract — `VionaNativeQuickActions`

**Create:** `src/components/viona/native-home/VionaNativeQuickActions.tsx`

Current eight ids — **all KEEP**:

| id | Handler | Initial placement |
|---|---|---|
| `bookServices` | `goUniverseLocal` | primary |
| `travelLite` | `goUniverseTravel` | primary |
| `learning` | `goUniverseAcademy` | primary |
| `documents` | `openProtected('Vault')` | primary |
| `quickTranslate` | `openInterpreter` | primary |
| `aiAssistant` | `openProtected('LeonaCall')` | overflow if Ask chip visible; else primary |
| `nearbySupport` | `goUniverseLocal` | overflow (duplicate Local) |
| `safety` | `openSosEntry` | overflow — **entry only**, not hold UI |

```ts
type VionaNativeQuickActionItem = Readonly<{
  id: string;
  label: string;
  icon: string;
  readiness?: string;
  onPress: () => void;
  category: 'local' | 'travel' | 'academy' | 'ai' | 'docs' | 'safety';
  priority: 'primary' | 'overflow';
  accessibilityLabel: string;
}>;

type VionaNativeQuickActionsProps = Readonly<{
  items: readonly VionaNativeQuickActionItem[];
  moreLabel: string;
}>;
```

HomeScreen assigns `priority`. The native component renders 4–6 primary + More. More must include every overflow id. `hubEnabled` continues to gate whether the quick-action model is passed (same as today’s strip).

No DELETE. Overflow is preservation, not removal.

---

## 11. Companion, discovery, Account cue

### 11.1 Companion — defer file

| Context | Home today | Class | Phase 1 |
|---|---|---|---|
| Trip / request / local task | none | NO_SAFE_DATA_SOURCE | omit |
| Learning progress | flag only | GATED_DATA | omit; Academy tile is enough |
| Business task | routing only via `hasB2BWorkspaceAccess` | GATED_DATA | omit; Business tile is enough |

**Do not create** `VionaNativeCompanionModule.tsx` in the first Phase 1 runtime allowlist. Hide-if-empty with no source = no module.

### 11.2 Discovery — defer file

| Source | Class | Phase 1 |
|---|---|---|
| `CharityWidget` / Care ledger | SAFE_REAL_CONTENT | Keep as HomeScreen **sibling** below composition. Do not restyle the widget |
| `briefingCards` | DEMO_MUST_LABEL | Do not promote as live news; keep in existing below-fold or omit from first native screen |
| Local/Travel feed on Home | NOT_PHASE1 | Universes own content |
| `ProactiveSuggestions` | GATED + cost | Do not embed in the composition |

**Do not create** `VionaNativeDiscoverySection.tsx` in the first allowlist.

### 11.3 Account activity cue

No Home source for requests, saved, or document counts. Do **not** pass request count, saved count, document count, or wallet/account balance as a Home Account activity cue. Existing below-fold wallet chip stays outside the native composition (not an Account cue). Account remains chrome → PersonalHub. Do not pass `openAccount` / PersonalHub into the native header.

**Initial Phase 1: no Home Account/activity cue.**

---

## 12. AI contract

Existing: `openProtected('LeonaCall')` (auth paywall + mini-app), `leonaAssistantEnabled`.

Phase 1 presentation: Ask chip on Find only. Native components may only reuse the existing `onAsk` callback. No new OpenAI/completion call, auto-submit, prompt construction, background AI, or paid AI path. `ProactiveSuggestions` stays a later sibling, not inside the composition.

Commercial: `REQUEST_ONLY_NO_CHARGE`. No fake commerce.

---

## 13. SOS contract

Preserve:

- `V7_SOS_HOLD_TO_TRIGGER_MS = 3000`
- canonical shell modal `src/screens/b2c/SOSModal.tsx`
- exact-one host via `shouldMountSosInTabBarShell` / `VionaGlobalSosShellAction`
- native Home safety pill: existing `openSosEntry` → `homeCommand.triggerSafetyAssist()` (non-desktop)

Native-home files must **not** import SOS modal, hold constant, or hold-gate. Desktop `VionaSosHoldGateModal` stays HomeScreen fashion-desktop only.

No SOS props on header / Find / launcher. Optional overflow item `onPress` is already bound upstream.

---

## 14. Token architecture

**Select OPTION A.**

**Create:** `src/design/vionaNativeClearPremiumTokens.ts`

Imported **only** by `src/components/viona/native-home/*`.

Do **not** make `fashionTech` conditional on `Platform.OS`. Do **not** mutate `premiumTileVisualTokens`. Shared OK: `FontFamily` from `src/theme/typography.ts` (Montserrat). Spacing/radius may be copied into the native namespace; do not restyle shared Fashion-Tech values.

```text
VIONA_NATIVE_LIGHT_FIRST_CLEAR_PREMIUM_CARVE_PROPOSED_NOT_ACTIVATED
```

Proof: `native-home` and the native token file must not import `fashionTech` or `premiumTileVisualTokens`.

This docs plan does **not** amend Design Mode Lock. Future runtime must separately account for any governance needed before actual light-first activation.

---

## 15. Device-layout input

Do **not** duplicate web 768/769. Do not create a second phone/tablet breakpoint system. Never mount the web desktop command bar on native.

| Input | Reuse |
|---|---|
| Phone vs tablet | Phase 0 `mode` from shell-mode via presentation target |
| Landscape | HomeScreen `isLandscapeViewport` (`width > height`) |
| Reduce motion | `useFashionHomePrefersReducedMotion` |
| Native never desktop | Phase 0 invariant; Phase 1 must not add `web-desktop` on ios/android |

Expected native layouts:

| Device | Layout |
|---|---|
| Phone portrait | 2×2 launcher |
| Phone landscape | compact / 4-across where viable |
| Tablet portrait | 4-across / bounded composition |
| Tablet landscape | higher density / bounded native layout |

Composition may use `useWindowDimensions` only for inner tile size, not for a second shell-mode.

---

## 16. Asset reuse

| Asset | Class |
|---|---|
| `viona-home-local-daylight-card-v1.png` | REUSE_AS_IS |
| `viona-home-travel-daylight-card-v1.png` | REUSE_AS_IS |
| `viona-home-academy-daylight-card-v1.png` | REUSE_AS_IS |
| `viona-home-business-daylight-card-v1.png` | REUSE_AS_IS |
| `viona-hero-human-constellation-1280x428.png` | DO_NOT_USE as native first-screen hero |
| Desktop 1280/1600 universe heroes | DO_NOT_USE on native Phase 1 |

No asset file edits. Cover-crop inside the new tile is presentation-only.

---

## 17. Exact candidate file boundary

### 17.1 Phase 1 future CREATE allowlist

| Path | Required? |
|---|---|
| `src/design/vionaNativeClearPremiumTokens.ts` | **Yes** |
| `src/components/viona/native-home/VionaNativeHomeClearPremiumComposition.tsx` | **Yes** |
| `src/components/viona/native-home/VionaNativeHomeHeader.tsx` | **Yes** |
| `src/components/viona/native-home/VionaNativeHomePrimaryEntry.tsx` | **Yes** |
| `src/components/viona/native-home/VionaNativeUniverseLauncher.tsx` | **Yes** |
| `src/components/viona/native-home/VionaNativeQuickActions.tsx` | **Yes** |
| `scripts/test-viona-mobile-phase1-clear-premium-native-home.ts` | **Yes** — same `npx tsx` style as Phase C / Phase 0 |

Do **not** use vague allowlist language (“related files”, “supporting files”, “as needed”).

If later implementation proves **another** runtime file is required: **STOP** and request scope expansion. No silent scope expansion.

**Not in first Phase 1 allowlist:**

- `VionaNativeCompanionModule.tsx`
- `VionaNativeDiscoverySection.tsx`
- `*.web.tsx` / `*.native.tsx` Metro splits of HomeScreen / AdaptiveComposition / WorldCard
- any mutation of `vionaTokens.ts` `fashionTech` values
- `package.json` / lockfile

### 17.2 Phase 1 future MODIFY allowlist

| Path | Scope |
|---|---|
| `src/components/viona/VionaNativeHomeOpeningStage.tsx` | Stop AdaptiveComposition forwarder; mount composition; accept grouped props. **File exists only after Phase 0.** |
| `src/screens/HomeScreen.tsx` | Pass grouped props; skip shared world-card + quick strip on `native-adaptive` only |

### 17.3 Denylist (must not change in future Phase 1 implementation)

- `src/navigation/MainTabNavigator.tsx`
- `src/navigation/routes.ts`
- `src/navigation/fashionHomeShellMode.ts`
- `src/navigation/homePresentationTarget.ts` (Phase 0 contract; Phase 1 consumes it)
- `src/navigation/vionaGlobalSosShellVisibility.ts`
- `src/components/viona/VionaFashionHomeAdaptiveComposition.tsx` internals
- `src/components/viona/VionaFashionWorldCard.tsx`
- `src/components/viona/VionaFashionHomeCommandBar.tsx`
- `src/components/viona/fashionHomeDesktopShell.ts` (except reusing reduce-motion hook **by import**, no visual edits)
- `src/screens/b2c/SOSModal.tsx`
- `src/components/emergency/SOSModal.tsx`
- `src/components/premium/SOSShieldComponent.tsx` (`V7_SOS_HOLD_TO_TRIGGER_MS`)
- `src/components/viona/VionaGlobalSosShellAction.tsx`
- `docs/design/VIONA_DESIGN_MODE_LOCK.md`
- `src/design/vionaTokens.ts` `fashionTech` values
- `src/design/premiumTileVisualTokens.ts`
- API / backend / DB / schema / migrations
- auth / payment / booking / provider integration
- desktop command-bar / daylight web behavior
- Kernel / Handoff
- workflows / scripts other than the one new Phase 1 test script
- Expo / native config
- assets
- `package.json` / lockfile
- PR #450 / T3 gate files

---

## 18. Web freeze contract

| Surface | Freeze |
|---|---|
| Web desktop | Existing desktop tree; command bar / daylight / hover untouched |
| Web mobile | Still **directly** mounts AdaptiveComposition + `VionaFashionWorldCard` |
| Web tablet | Same web-adaptive mount |

Rules:

- Do not change AdaptiveComposition internals, WorldCard internals, `fashionTech`, or shared Home styles used by the web adaptive branch.
- Native-only modules live under `native-home/` and native tokens.
- HomeScreen sibling skip must be gated on `native-adaptive` only.

Eventual implementation must prove:

```text
VIONA_WEB_VISUAL_ARCHITECTURE_UNCHANGED_BY_PHASE1
```

This docs lane does **not** return that marker as achieved.

---

## 19. Navigation contract

Preserve runtime truth:

| Item | Fact |
|---|---|
| B2C tabs | Home · Local · Travel · Academy |
| Academy route | `TabAi`, labeled Academy |
| Account | chrome → `PersonalHub` |
| Business | world card / launcher tile + B2B role shell — not a sixth B2C tab |

Option B five-tab Account remains separately authorized later work. Phase 1 must not add it.

---

## 20. Function preservation

| Capability | Current path | Phase 1 |
|---|---|---|
| Local | world card + tab + book/nearby actions | launcher + primary actions; handlers unchanged |
| Travel | world card + tab + flag | launcher + travelLite; coming-soon if flag off |
| Academy | world card + `TabAi` + learning action | launcher + learning action |
| Business | world card → B2B / MerchantDashboard | launcher tile; handler unchanged |
| Account | chrome → PersonalHub | untouched |
| SOS | exact-one shell, 3000ms; Home entry via `openSosEntry` | overflow entry only |
| Translate | `openInterpreter` | quick action |
| AI / Leona | `openProtected('LeonaCall')` | Ask chip + overflow/action |
| Vault | `openProtected('Vault')` | documents action |
| Wallet / AiEye | utility / protected | below-fold / existing chips; no DELETE |
| Care | `CharityWidget` | sibling below composition |
| Travel Lite / learning | quick actions | KEEP via primary or More |

No DELETE. No replacing unready surfaces with disappearance.

---

## 21. Implementation sequence

Lock this additive order in a **future** Phase 1 runtime packet. **Step 0 is a hard stop.** No big-bang Home rewrite.

| STEP | ACTION |
|---|---|
| 0 | Verify Phase 0 completed and green (§3 items 1–5) |
| 1 | CREATE native Clear Premium token namespace |
| 2 | CREATE empty/root Clear Premium composition with testIDs (and the Phase 1 test script so asserts exist before HomeScreen skip) |
| 3 | Wire composition through `VionaNativeHomeOpeningStage` (MODIFY; file exists only after Phase 0) |
| 4 | Add compact Header with real greeting |
| 5 | Add four-universe launcher |
| 6 | Add honest Find/Ask entry |
| 7 | Add QuickActions 4–6 + More preserving all eight |
| 8 | Keep Companion **absent** |
| 9 | Keep Discovery **absent**; Charity remains HomeScreen sibling |
| 10 | Add phone / tablet / landscape presentation behavior |
| 11 | Run accessibility + static/regression test contract (§22–§23) |

HomeScreen grouped props + `native-adaptive` sibling skip land with steps 3 and 5–7 (skip world cards when launcher mounts; skip shared strip when QuickActions mount). Do not skip web-adaptive siblings.

No companion/discovery files in this sequence.

---

## 22. Test contract

**Future test file:** `scripts/test-viona-mobile-phase1-clear-premium-native-home.ts`

Same style as `scripts/test-viona-modern-home-native-adaptation-phase-c.ts` (`npx tsx`, `readFileSync`, resolver imports). No new packages.

Phase 0 tests and Phase B/C shell-mode tests remain required. Phase 1 tests **must not rewrite** `fashionHomeShellMode.ts`.

| # | Requirement | Kind |
|---|---|---|
| 1 | Phase 0 files / mapper exist | static + unit |
| 2 | `native-adaptive` ≠ `web-adaptive` | unit |
| 3 | Web adaptive still uses current AdaptiveComposition | static |
| 4 | Web adaptive WorldCard path remains | static |
| 5 | Native Clear Premium composition mounted only through OpeningStage | static |
| 6 | `goUniverseLocal` defined once in HomeScreen | static |
| 7 | `goUniverseTravel` defined once | static |
| 8 | `goUniverseAcademy` defined once | static |
| 9 | `goUniverseBusiness` defined once | static |
| 10 | `native-home` has no `getFeatureFlags` | static |
| 11 | `native-home` has no direct navigation ownership | static |
| 12 | `native-home` has no PersonalHub / `openAccount` | static |
| 13 | `native-home` has no SOSModal | static |
| 14 | `native-home` has no `V7_SOS_HOLD` | static |
| 15 | `openSosEntry` remains upstream | static |
| 16 | Ask uses `askVisible` / existing Leona callback | static |
| 17 | Find contains no query/results API | static |
| 18 | Find does not route to `TravelFlightSearch` | static |
| 19 | All 8 quick-action ids remain constructed | static |
| 20 | More includes all overflow items | static |
| 21 | No Companion module exists in first scope | allowlist |
| 22 | No Discovery module exists in first scope | allowlist |
| 23 | Charity remains sibling / current ownership | static |
| 24 | `fashionHomeShellMode.ts` absent from diff | diff |
| 25 | `MainTabNavigator` absent from diff | diff |
| 26 | `routes.ts` absent from diff | diff |
| 27 | `native-home` does not import `fashionTech` | static |
| 28 | `native-home` does not import `premiumTileVisualTokens` | static |
| 29 | Native never resolves `web-desktop` | unit |
| 30 | `mode` + `isLandscape` drive layout | static |
| 31 | Phone portrait structure | static / layout |
| 32 | Phone landscape structure | static / layout |
| 33 | Tablet portrait structure | static / layout |
| 34 | Tablet landscape structure | static / layout |
| 35 | Reduced-motion semantics | static |
| 36 | Accessibility labels on launcher/actions | static |
| 37 | No new packages | diff |
| 38 | No asset modifications | diff |

Also prove: web 767/768/769 shell-mode goldens still green; `V7_SOS_HOLD_TO_TRIGGER_MS` still `3000`; AdaptiveComposition / WorldCard / `fashionTech` absent from the Phase 1 diff.

---

## 23. Implementation validation contract

Future Phase 1 **runtime** packet (not this lane) must run:

- `git diff --check`
- `npx tsc --noEmit`
- `npm run ci:expo-readiness`
- `npm run ci:release-discipline`
- `npx tsx scripts/test-viona-mobile-phase0-native-presentation-isolation.ts`
- `npx tsx scripts/test-viona-mobile-phase1-clear-premium-native-home.ts`
- existing `scripts/test-viona-modern-home-shell-mode-resolver-foundation.ts`
- existing `scripts/test-viona-modern-home-native-adaptation-phase-c.ts`
- existing `scripts/test-viona-modern-home-mobile-web-activation-phase-b.ts`

Diff must match the CREATE/MODIFY allowlist. Denylist files must be absent from the diff.

---

## 24. Acceptance criteria (future implementation)

| ID | Gate |
|---|---|
| A | Phase 0 was already implemented and verified |
| B | Native Clear Premium composition exists only on `native-adaptive` |
| C | Web desktop unchanged |
| D | Web mobile unchanged |
| E | Web tablet unchanged |
| F | Four-universe launcher visible and functional |
| G | Travel gated state honest |
| H | Find performs no fake search |
| I | Ask is optional/gated |
| J | All eight quick actions remain reachable |
| K | Account remains shell-owned |
| L | SOS remains exact-one and 3000ms |
| M | No fake Companion state |
| N | No fake Discovery / live news |
| O | No new AI runtime call |
| P | No API / DB / auth / payment change |
| Q | No route / tab change |
| R | No shared Fashion-Tech token mutation |
| S | Phone portrait green |
| T | Phone landscape green |
| U | Tablet portrait green |
| V | Tablet landscape green |
| W | Accessibility contract green |
| X | Targeted tests green |
| Y | Existing CI / release validations green |
| Z | Rollback remains presentation-only |

---

## 25. Rollback contract

Phase 1 rollback must **leave the Phase 0 isolation boundary intact**.

```text
VionaNativeHomeOpeningStage
  Clear Premium composition  ->  Phase 0 AdaptiveComposition parity wrapper
HomeScreen native-adaptive
  skip shared cards          ->  restore shared WorldCard + quick strip
```

Do not require rollback of web, API, database, auth, routes, payment, SOS backend, or domain data.

Token file may remain unused. Composition files may remain unmounted.

**Do not** roll back `homePresentationTarget.ts` as part of Phase 1 undo.

---

## 26. Stop conditions

Future Phase 1 **runtime** implementation must **STOP** if:

- Phase 0 prerequisite is not verified (§3);
- any required allowlist file is missing unexpectedly;
- an extra source file appears necessary;
- a web shared component must be restyled;
- a route / nav change becomes necessary;
- Account ownership needs change;
- SOS ownership needs change;
- search requires new backend / API behavior;
- new AI runtime behavior becomes necessary;
- a package dependency becomes necessary;
- Design Mode Lock amendment becomes necessary but is not separately approved.

No silent scope expansion.

---

## 27. Risk register

| Risk | Severity | Likelihood | Mitigation | Proof required |
|---|---|---|---|---|
| PHASE0 BYPASS | High | Medium | Hard stop Step 0 | Phase 0 tests green before Phase 1 files |
| WEB REGRESSION | High | High if shared files edited | Denylist AdaptiveComposition / WorldCard / fashionTech; sibling skip native-only | Those files absent from diff; web mount golden |
| DOMAIN LOGIC DUPLICATION | High | Medium | Callbacks + prebuilt items only | `native-home` has no `navigate` / `getFeatureFlags` / auth |
| PROP EXPLOSION | Medium | High | Grouped bags | Typed composition props |
| SHARED LAUNCHER leftover | High | Medium | Skip WorldCard on native-adaptive; new launcher | Native path has no WorldCard; web still has it |
| NAVIGATION DRIFT | High | Low | Denylist routes/tabs | Diff |
| SOS DUPLICATION | High | Medium | No SOS in native-home | Static grep |
| FAKE SEARCH | High | Medium | Find = Local entry only | No query/results; no TravelFlightSearch |
| FAKE CONTEXTUAL DATA | High | Medium | No companion/discovery files | Allowlist |
| AI COST EXPANSION | High | Medium | Ask → existing `openProtected` only | No OpenAI in native-home |
| TOKEN LEAK INTO WEB | High | Medium | Native namespace consumers only | Import grep |
| TABLET REGRESSION | Medium | Medium | Reuse `mode`; native never desktop | Layout tests |
| ACCESSIBILITY REGRESSION | Medium | Medium | Order + chips in labels | Script + later device QA |
| ASSET DEPENDENCY | Low | Low | Reuse four daylight cards | No new binaries |
| TOO MANY NEW COMPONENTS | Medium | Medium | Defer companion/discovery | §17.1 file set |
| HOMESCREEN GOD-FILE SLIP | Medium | High | Sibling skip + prop construction only | Diff scoped to native-adaptive branch |
| ROLLBACK FAILURE | Medium | Low | OpeningStage remounts parity | §25 |

---

## 28. Governance (unchanged)

```text
EMERGENCY_VIONA_PR_LIFECYCLE_CONTAINMENT_ACTIVE
NEW_ORDINARY_VIONA_PR_CREATION_SUSPENDED
ALL_VIONA_PR_MERGES_PROHIBITED
MANDATORY_MERGE_AUTHORIZATION_GUARDRAIL_FREEZE_ACTIVE
B1B_GOVERNANCE_FREEZE_ACTIVE
NO_RETROACTIVE_AUTHORIZATION_CLAIMED
```

Do not merge, push, create PR, dispatch merge gate, bootstrap, mutate protection, or start B1B. Do not touch PR #450.

---

## 29. This-lane mutation budget

| Item | Count |
|---|---|
| New docs | 2 |
| Existing file modifications | 0 |
| Runtime / source / web / nav / SOS / assets / package / lockfile | 0 |
| Stage / commit / push / PR / merge | 0 |

---

## 30. Status

This document is an **implementation-ready PLAN**. Phase 0 isolation remains planned, not implemented. Phase 1 Clear Premium Native Home remains planned, not implemented.

```text
VIONA_MOBILE_PHASE0_NATIVE_PRESENTATION_ISOLATION_PLANNED_NOT_IMPLEMENTED
PHASE1_RUNTIME_REQUIRES_PHASE0_NATIVE_PRESENTATION_ISOLATION_COMPLETE
```

**Next action only:** separately authorize a **strict read-only review** of this two-file Phase 1 implementation-plan packet.

Do not implement Phase 0. Do not implement Phase 1. Do not stage, commit, push, or open a PR.
