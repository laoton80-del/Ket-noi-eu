# VIONA — Mobile Clear Premium Companion
# Phase 0 Native Presentation Isolation
# Implementation Plan

**Document type:** Docs-only implementation plan (planning; **not** runtime implementation).
**Mode:** Dedicated local docs branch · exact two new docs · uncommitted · zero stage / commit / push / PR.
**This packet does not implement runtime, restyle web, change navigation, change SOS, or remove functions.**

**Dedicated planning branch:** `docs/viona-mobile-phase0-native-presentation-isolation-implementation-plan`
**Created from:** `c788fb36df1bd2984b30b958c57bbdbca96facb6`
**Parent / origin/master:** `c6a19e203a3aa6897cffad8dc9d908f9bca9e9ec`

**Evidence:** `docs/design/evidence/cursor-viona-mobile-phase0-native-presentation-isolation-implementation-plan/README.md`

**Authorization:**

```text
APPROVE_VIONA_MOBILE_PHASE0_NATIVE_PRESENTATION_ISOLATION_IMPLEMENTATION_PLAN_PACKET_ON_DEDICATED_LOCAL_DOCS_BRANCH_FROM_C788FB36DF1BD2984B30B958C57BBDBCA96FACB6_WITH_EXACT_TWO_NEW_DOCS_UNCOMMITTED_ZERO_STAGE_ZERO_COMMIT_ZERO_PUSH_ZERO_PR_ZERO_RUNTIME_CHANGE_ZERO_WEB_VISUAL_CHANGE_ZERO_NAVIGATION_CHANGE_ZERO_SOS_BEHAVIOR_CHANGE_ZERO_FUNCTION_REMOVAL
```

**Source authorities:**

1. `docs/product/VIONA_MOBILE_CLEAR_PREMIUM_COMPANION_DESIGN_SYSTEM_AND_HOME_ARCHITECTURE_MASTER_PLAN.md`
2. `docs/design/VIONA_MOBILE_CLEAR_PREMIUM_COMPANION_DESIGN_SYSTEM_SPEC.md`
3. Completed Phase 0 strict read-only architecture audit

**Preserved audit classification:**

```text
READY_FOR_VIONA_MOBILE_PHASE0_NATIVE_PRESENTATION_ISOLATION_IMPLEMENTATION_PLAN
VIONA_MOBILE_PHASE0_NATIVE_PRESENTATION_ISOLATION_PLANNED_NOT_IMPLEMENTED
```

This packet does **not** authorize runtime implementation. A future implementation packet requires separate operator authorization, the exact file allowlist below, and a strict read-only review of this plan first.

PR #450 is independent and must not be touched.

---

## 1. Locked planning markers

```text
VIONA_MOBILE_PHASE0_OPTION_A_WITH_OPTION_C_SLOTS_SELECTED_FOR_IMPLEMENTATION_PLANNING
VIONA_MOBILE_PHASE0_OPTION_B_RESTRICTED_TO_LEAF_PRESENTATION_FILES
VIONA_MOBILE_PHASE0_NATIVE_PRESENTATION_ISOLATION_PLANNED_NOT_IMPLEMENTED
VIONA_NATIVE_LIGHT_FIRST_CLEAR_PREMIUM_CARVE_PROPOSED_NOT_ACTIVATED
VIONA_NATIVE_PRESENTATION_ISOLATION_REQUIRED_BEFORE_CLEAR_PREMIUM_RUNTIME_ACTIVATION
VIONA_WEB_VISUAL_ARCHITECTURE_PRESERVED
NO_FUNCTION_REMOVAL
```

**Eventual implementation acceptance marker (not achieved by this docs lane):**

```text
VIONA_WEB_VISUAL_ARCHITECTURE_UNCHANGED_BY_PHASE0
```

**Do not claim:**

```text
READY_TO_IMPLEMENT
VIONA_NATIVE_PRESENTATION_ISOLATED
CLEAR_PREMIUM_ACTIVATED
LIGHT_MODE_CANONICAL
BOTTOM_NAV_CHANGED
WEB_RESTYLED
```

---

## 2. Objective and non-goals

### 2.1 Objective

Establish a **native presentation boundary** for B2C Home **opening stage only**, so later Clear Premium restyle cannot mutate web mobile/tablet.

Phase 0 success is **architecture isolation**, not a visual redesign.

Native may still look Fashion-Tech after a future Phase 0 implementation.

```text
PRESENTATION ISOLATION
!=
CLEAR PREMIUM RESTYLE
```

### 2.2 Non-goals (explicit)

Phase 0 must **not**:

- restyle native Home to Clear Premium light surfaces, new hero, new tiles, or new spacing;
- restyle or fork `VionaFashionHomeAdaptiveComposition` internals;
- restyle `VionaFashionWorldCard`;
- change web desktop / web mobile / web tablet visuals;
- amend `docs/design/VIONA_DESIGN_MODE_LOCK.md`;
- mutate `vionaTokens.fashionTech` values;
- add, remove, relabel, or reorder bottom tabs;
- move Account into the tab bar;
- move Business into the B2C tab bar;
- change SOS hold, host, modal, or reachability;
- change API, auth, database, payment, booking, or provider integration;
- duplicate universe handlers, i18n, feature flags, or role logic;
- copy `HomeScreen.tsx` or `MainTabNavigator.tsx`;
- activate unused native token files as a visual system.

---

## 3. Architecture decision

```text
VIONA_MOBILE_PHASE0_OPTION_A_WITH_OPTION_C_SLOTS_SELECTED_FOR_IMPLEMENTATION_PLANNING
```

| Layer | Decision |
|---|---|
| Primary | **OPTION A** — native presentation wrapper around shared domain/data in `HomeScreen` |
| Secondary | **OPTION C** — one opening-stage presentation adapter/slot; later phases may add tile/quick-action slots |
| Option B | **Leaf-only, not used in Phase 0.** Allowed later for small presentation modules. Forbidden for `HomeScreen` / `MainTabNavigator` / AdaptiveComposition Metro split |

**Rejected:**

- full-file `HomeScreen` fork;
- `MainTabNavigator` fork;
- duplicate domain/business logic;
- in-place Clear Premium restyle of shared web/native components;
- Metro `VionaFashionHomeAdaptiveComposition.native.tsx` (would hide the web freeze and still restyle the shared module identity).

Shared domain stays in `HomeScreen` (or existing hooks): `goUniverse*`, flags, i18n, hero copy, `openProtected`, `openSosEntry` (quick-action only; not SOS host ownership).

---

## 4. Smallest safe scope

**Isolate native opening stage only.**

| Surface | Phase 0 |
|---|---|
| Opening identity + hero | **Isolate** via `VionaNativeHomeOpeningStage` |
| Universe tiles (`VionaFashionWorldCard`) | **Keep shared** |
| Quick actions | **Keep shared** |
| `CharityWidget` | **Keep shared** |
| Route handlers / i18n / flags | **Keep shared** |
| Tabs / Account chrome / SOS host | **Must not change** |

Native universe-card redesign is **Phase 1+**, separately authorized.

---

## 5. Presentation target contract

### 5.1 New resolver — do not modify `fashionHomeShellMode.ts`

**Decision:** `src/navigation/fashionHomeShellMode.ts` is **not** a Phase 0 modify candidate.

Shell-mode already classifies `legacy | mobile | tablet | desktop` and already encodes platform, width, role, and focused tab. A second copy of 768/769 logic would create width-boundary regression.

Phase 0 adds a **thin mapping** from existing shell-mode + platform → presentation target.

**Create:** `src/navigation/homePresentationTarget.ts`

### 5.2 Type

```ts
export type HomePresentationTarget =
  | 'web-desktop'
  | 'web-adaptive'
  | 'native-adaptive'
  | 'legacy';
```

### 5.3 Inputs

```ts
export type HomePresentationTargetInput = Readonly<{
  platform: string; // Platform.OS: 'web' | 'ios' | 'android' | …
  shellMode: FashionHomeShellMode; // already resolved; do not re-derive width
}>;
```

Width, role, and focused tab remain inputs of `resolveFashionHomeShellMode` only. The presentation-target resolver must **not** re-implement desktop/tablet breakpoints.

### 5.4 Mapping (exact)

| `platform` | `shellMode` | `HomePresentationTarget` |
|---|---|---|
| `web` | `desktop` | `web-desktop` |
| `web` | `mobile` | `web-adaptive` |
| `web` | `tablet` | `web-adaptive` |
| `ios` | `mobile` | `native-adaptive` |
| `ios` | `tablet` | `native-adaptive` |
| `android` | `mobile` | `native-adaptive` |
| `android` | `tablet` | `native-adaptive` |
| any | `legacy` | `legacy` |

### 5.5 Hard invariants

1. **`web-desktop` only if `platform === 'web'` and `shellMode === 'desktop'`.**
2. **Native never returns `web-desktop`.** If `platform` is `ios` or `android` and `shellMode` is unexpectedly `desktop` (should be impossible today), map to `native-adaptive`, never `web-desktop`.
3. Web mobile and web tablet remain `web-adaptive` (current shared adaptive composition).
4. Native iOS and Android B2C Home adaptive modes select `native-adaptive`.
5. `legacy` continues the existing hybrid fallback.
6. Resolver is a pure function. No I/O, no feature-flag read, no navigation side effects.

### 5.6 Why not extend `FashionHomeShellMode`

Shell-mode is **layout eligibility** (desktop vs tablet vs mobile vs legacy). Presentation target is **which visual owner mounts**. Mixing them would force `MainTabNavigator` / desktop-shell callers to understand native presentation. They must remain ignorant of Phase 0.

---

## 6. HomeScreen contract

`HomeScreen` keeps all domain state and handlers.

Conceptual mount:

```text
existing domain state / handlers
        |
resolveFashionHomeShellMode        (UNCHANGED)
        |
resolveHomePresentationTarget      (NEW, additive)
        |
        +-- web-desktop     -> existing desktop render (UNCHANGED)
        |
        +-- web-adaptive    -> VionaFashionHomeAdaptiveComposition (UNCHANGED import)
        |
        +-- native-adaptive -> VionaNativeHomeOpeningStage (NEW)
        |
        +-- legacy          -> existing legacy hybrid fallback (UNCHANGED)
```

### 6.1 Minimal mutation locus

Today the adaptive opening mounts at the non-desktop branch, approximately:

- `fashionHomeAdaptiveActive` → `VionaFashionHomeAdaptiveComposition` (~lines 2321–2334)
- world cards / kicker / quick actions / charity remain **below** that mount

**Allowed future `HomeScreen.tsx` edits:**

1. Import `resolveHomePresentationTarget` and `VionaNativeHomeOpeningStage`.
2. Compute `homePresentationTarget` from `{ platform: Platform.OS, shellMode: fashionHomeShellMode }`.
3. Replace **only** the opening-stage JSX:

   - `web-adaptive` → current `VionaFashionHomeAdaptiveComposition` with the **same props as today**;
   - `native-adaptive` → `VionaNativeHomeOpeningStage` with the **same presentation props**;
   - desktop and legacy trees untouched.

**Forbidden `HomeScreen` edits in Phase 0:**

- moving world-card JSX into the native component;
- changing `goUniverse*` / flags / i18n;
- changing desktop command bar, daylight, hover, or web-only `Platform.OS === 'web'` trees;
- changing SOS quick-action wiring;
- changing Account / language / chrome (Home does not own those hosts).

`VionaFashionHomeAdaptiveComposition` `children` slot stays unused in Phase 0 (world cards remain siblings in `HomeScreen`).

---

## 7. Native opening stage contract

**Create:** `src/components/viona/VionaNativeHomeOpeningStage.tsx`

### 7.1 Chosen Phase 0 behavior: parity wrapper (A)

| Option | Meaning | Risk |
|---|---|---|
| **A. Parity wrapper** | Native component forwards the same props into current `VionaFashionHomeAdaptiveComposition` | **Lower** — visual identity unchanged; isolation is the import boundary |
| B. Minimal equivalent copy | Duplicate opening JSX/styles | Higher — two visual sources can drift immediately |

**Select A.** Phase 0 must not introduce Clear Premium visuals.

Wrapper responsibility:

- own the **native presentation boundary** (`testID` distinct from web adaptive root if needed for tests, without visual change);
- receive presentation props only;
- render current AdaptiveComposition unchanged;
- **not** own SOS, Account, Language, tabs, universe handlers, flags, or API.

### 7.2 Props (presentation only)

Match current AdaptiveComposition public props. Do not accept HomeScreen state bags.

```ts
export type VionaNativeHomeOpeningStageProps = Readonly<{
  mode: 'mobile' | 'tablet';
  brandLabel: string;
  greetingLine1: string;
  greetingWish: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  heroImage: ImageSourcePropType;
  heroA11yLabel: string;
  style?: ViewStyle;
}>;
```

Phase 0: **do not** take `children`. World cards stay in `HomeScreen`.

`mode` remains `'mobile' | 'tablet'` from existing shell-mode so native tablet stays viable.

### 7.3 Option C slot note

Phase 0 slot = **OpeningStage only**. Later authorized work may add `UniverseTile` / `QuickActions` adapters inside the native/web presentation layers without forking `HomeScreen` domain logic.

---

## 8. Exact candidate file boundary

### 8.1 Future CREATE allowlist (implementation packet only — not this lane)

| Path | Required? |
|---|---|
| `src/navigation/homePresentationTarget.ts` | **Yes** |
| `src/components/viona/VionaNativeHomeOpeningStage.tsx` | **Yes** |
| `scripts/test-viona-mobile-phase0-native-presentation-isolation.ts` | **Yes** — matches existing Home shell-mode script tests |

**Not in Phase 0 allowlist:**

- `src/design/vionaNativeClearPremiumTokens.ts` — deferred. Unused token files are dormant-branch risk. Namespace strategy is documented in §10; creation belongs with Phase 1 visual activation, separately authorized.
- `*.web.tsx` / `*.native.tsx` Metro splits of AdaptiveComposition or HomeScreen.
- Any token mutation of `vionaTokens.ts`.

### 8.2 Future MODIFY allowlist

| Path | Scope |
|---|---|
| `src/screens/HomeScreen.tsx` | Opening-stage mount + imports only (§6) |

### 8.3 Explicitly not modified

`src/navigation/fashionHomeShellMode.ts` — **not necessary**. Presentation target consumes its output. Prefer the smallest file set.

### 8.4 Denylist (must not change in future Phase 0 implementation)

- `src/navigation/MainTabNavigator.tsx`
- `src/navigation/routes.ts`
- `src/navigation/fashionHomeDesktopShell.ts` (except no Phase 0 need)
- `src/navigation/vionaGlobalSosShellVisibility.ts`
- `src/components/viona/VionaFashionHomeAdaptiveComposition.tsx` **internal visual implementation** (wrapper may **import** it; must not edit styles/layout/tokens inside it)
- `src/components/viona/VionaFashionWorldCard.tsx`
- `src/components/viona/VionaFashionHomeCommandBar.tsx`
- `src/components/viona/fashionHomeDesktopShell.ts` (web daylight/hover helpers)
- `src/screens/b2c/SOSModal.tsx` (canonical shell modal)
- `src/components/emergency/SOSModal.tsx`
- `src/components/premium/SOSShieldComponent.tsx` (`V7_SOS_HOLD_TO_TRIGGER_MS = 3000`)
- `src/components/viona/VionaGlobalSosShellAction.tsx`
- `docs/design/VIONA_DESIGN_MODE_LOCK.md`
- `src/design/vionaTokens.ts` `fashionTech` values
- `src/design/premiumTileVisualTokens.ts`
- bottom-navigation structure / tab labels
- API / backend / DB / schema / migrations
- auth
- payment
- booking
- provider integration
- Kernel / Handoff
- workflows / scripts other than the one new Phase 0 test script
- Expo / native config
- assets / packages / lockfile

---

## 9. Web freeze contract

Web visual parity is a Phase 0 **acceptance gate**, not a hope.

| Surface | Freeze |
|---|---|
| Web desktop | Existing desktop tree; `web-desktop` target; command bar / daylight / hover untouched |
| Web mobile | Still **directly** mounts `VionaFashionHomeAdaptiveComposition` |
| Web tablet | Still **directly** mounts `VionaFashionHomeAdaptiveComposition` |

Rules:

- Do not change AdaptiveComposition internals, `fashionTech` values, world-card visuals, or shared Home styles used by the web adaptive branch.
- Native wrapper importing AdaptiveComposition is allowed; editing AdaptiveComposition is not.
- No CSS / token / shared-style mutation that can alter web.

Eventual implementation must prove:

```text
VIONA_WEB_VISUAL_ARCHITECTURE_UNCHANGED_BY_PHASE0
```

This docs lane does **not** return that marker as achieved.

---

## 10. Token strategy

Use a **native-specific namespace** in a later phase. Do **not** make `vionaTokens.fashionTech` conditional on `Platform.OS`. Do **not** globally promote existing light/pastel tokens.

Current status remains:

```text
VIONA_NATIVE_LIGHT_FIRST_CLEAR_PREMIUM_CARVE_PROPOSED_NOT_ACTIVATED
```

Phase 0 implementation: **no new token file.** The parity wrapper continues to render through AdaptiveComposition and therefore current Fashion-Tech tokens. That is visual parity, not Clear Premium activation.

Phase 1 (separately authorized) may create `vionaNativeClearPremiumTokens.ts` as an unused-or-parity namespace **consumed only by native presentation**, never by web AdaptiveComposition.

---

## 11. Navigation contract

Preserve runtime truth:

| Item | Fact |
|---|---|
| B2C tabs | Home · Local · Travel · Academy |
| Academy route | `TabAi`, labeled Academy |
| Account | chrome → `PersonalHub` |
| Business | world card + B2B role shell — not a sixth B2C tab |

Phase 0 must not add/remove/relabel tabs, move Business into the B2C bar, or restructure navigation. Option B five-tab Account remains separately authorized later work.

---

## 12. SOS contract

Preserve:

- `V7_SOS_HOLD_TO_TRIGGER_MS = 3000`
- canonical shell modal `src/screens/b2c/SOSModal.tsx`
- exact-one host via `shouldMountSosInTabBarShell` / `VionaGlobalSosShellAction`
- existing Home quick-action SOS **entry** semantics (must not become a second hold-to-SOS host)

`VionaNativeHomeOpeningStage` must **not** mount SOS. AdaptiveComposition already documents non-ownership; the native wrapper inherits that rule.

No SOS behavior implementation change.

---

## 13. Function preservation

All six universe entry paths remain:

| Universe | Path | Phase 0 |
|---|---|---|
| Local | world card + tab + quick action | handlers stay in `HomeScreen` |
| Travel | world card + tab + flag | keep coming-soon; no delete |
| Academy | world card + `TabAi` | keep |
| Business | world card → B2B role shell | keep |
| Account | chrome → PersonalHub | untouched |
| SOS | exact-one shell, 3000ms | untouched |

No DELETE. No feature removal. No replacing unready surfaces with disappearance.

---

## 14. Feature flag / rollback decision

Proposed flag `nativeHomePresentationIsolated` was audited.

| | Option 1 — default-false flag | Option 2 — deterministic target |
|---|---|---|
| Rollback speed | Flip flag | Presentation-layer remount (one HomeScreen branch) |
| Complexity | Flag plumbing + two native paths | One native path |
| Dormant branch | Flag-on path untested until enabled | None |
| Testing | Double native matrix | Single native matrix + web freeze |
| Phase 0 isolation proof | Fails while flag is false (native still shared) | Isolation is real as soon as native mounts the wrapper |
| Phase 1 | Easy to misuse the same flag for restyle | Phase 1 can add a **visual** flag later without conflating isolation |

**Recommendation: Option 2 — deterministic `resolveHomePresentationTarget`. No Phase 0 feature flag.**

Rationale: Phase 0 is visual **parity**. A default-false flag would leave production native on the shared composition, so isolation would not exist. A default-true flag is extra machinery with a dormant off-path. Rollback of a parity wrapper is already presentation-only.

Phase 1 Clear Premium visual activation may introduce a **different** flag later. That is not Phase 0.

---

## 15. Test contract

**Future test file:** `scripts/test-viona-mobile-phase0-native-presentation-isolation.ts` (same style as `scripts/test-viona-modern-home-native-adaptation-phase-c.ts`).

Existing shell-mode scripts remain the width-boundary goldens. Phase 0 tests **must not rewrite** `fashionHomeShellMode.ts`; they assert presentation mapping **and** static HomeScreen mounts.

| # | Requirement | Kind |
|---|---|---|
| 1 | Web desktop still selects `web-desktop` when shell-mode is `desktop` | unit |
| 2 | Web width 767 still yields shell-mode `mobile` then `web-adaptive` | unit (compose existing resolver + new mapper) |
| 3 | Web width 768 still yields shell-mode `tablet` then `web-adaptive` (not desktop) | unit |
| 4 | Web width 769 still yields shell-mode `desktop` then `web-desktop` | unit |
| 5 | Web mobile mount: HomeScreen still contains direct `VionaFashionHomeAdaptiveComposition` usage | static/golden |
| 6 | Web tablet uses the same web-adaptive mount (no native component on `platform === 'web'`) | unit + static |
| 7 | Native iOS `mobile`/`tablet` → `native-adaptive` | unit |
| 8 | Native Android `mobile`/`tablet` → `native-adaptive` | unit |
| 9 | Native never resolves `web-desktop` (including defensive `desktop` shell-mode) | unit |
| 10 | `legacy` → `legacy` on web and native | unit |
| 11 | Local handler still present (`goUniverseLocal`) | static |
| 12 | Travel handler still present (`goUniverseTravel`) | static |
| 13 | Academy handler still present (`goUniverseAcademy`) | static |
| 14 | Business handler still present (`goUniverseBusiness`) | static |
| 15 | Account: `MainTabNavigator` still chrome → PersonalHub; no fifth tab | static |
| 16 | SOS exact-one: `MainTabNavigator` still imports `shouldMountSosInTabBarShell` / canonical `SOSModal`; HomeScreen native opening does not import SOSModal | static |
| 17 | `V7_SOS_HOLD_TO_TRIGGER_MS` still `3000` | static |
| 18 | Auth modules not in the Phase 0 diff | static / diff allowlist |
| 19 | Locale / i18n keys not removed | static |
| 20 | Role resolution (`activeRole`) unchanged | static |
| 21 | `MAIN_TAB.B2C.*` route ids unchanged | static |
| 22 | No API client / backend file in the Phase 0 diff | static / diff allowlist |
| 23 | Native tablet: `mode === 'tablet'` still passed into native opening | unit + static |
| 24 | Web snapshot/parity: AdaptiveComposition file hash/contents unchanged; `fashionTech` token file unchanged | static/golden |

Component-level rendering tests are optional if the script + tsc cover mounts; they must not require a web visual change.

---

## 16. Implementation validation contract

Future Phase 0 **implementation** packet (not this lane) must run:

- `git diff --check`
- `npx tsc --noEmit`
- `npm run ci:expo-readiness`
- `npm run ci:release-discipline`
- `npx tsx scripts/test-viona-mobile-phase0-native-presentation-isolation.ts`
- existing `scripts/test-viona-modern-home-shell-mode-resolver-foundation.ts`
- existing `scripts/test-viona-modern-home-native-adaptation-phase-c.ts`
- existing `scripts/test-viona-modern-home-mobile-web-activation-phase-b.ts`

Diff must match the CREATE/MODIFY allowlist. Denylist files must be absent from the diff.

---

## 17. Acceptance criteria (future implementation)

| ID | Gate |
|---|---|
| A | Native B2C Home adaptive path has a distinct presentation target `native-adaptive` and mounts `VionaNativeHomeOpeningStage` |
| B | Web desktop visual path unchanged |
| C | Web mobile visual path unchanged (still mounts AdaptiveComposition) |
| D | Web tablet visual path unchanged (still mounts AdaptiveComposition) |
| E | No Clear Premium visual redesign |
| F | No route-id change |
| G | No tab change |
| H | No Account navigation change |
| I | No SOS behavior change |
| J | No API / auth / database / payment changes |
| K | Six universes preserved |
| L | Rollback restores native shared-adaptive opening by presentation-layer change only |
| M | All §16 validations green |

---

## 18. Rollback contract

Rollback is **presentation-layer only**.

Do not require rollback of API, database, auth, routes, payment, SOS backend, web styling, or domain data.

**Exact rollback for the recommended model:**

1. In `HomeScreen`, mount `VionaFashionHomeAdaptiveComposition` for `native-adaptive` as well (same as today’s shared path), **or**
2. Make `VionaNativeHomeOpeningStage` unused by deleting the native branch (HomeScreen falls through to AdaptiveComposition).

Either change is JSX/import only. `homePresentationTarget.ts` can remain unused or keep mapping native → `web-adaptive` as an emergency fallback **only if** HomeScreen is also switched to the AdaptiveComposition mount. Preferred rollback is HomeScreen remount, because the mapper staying truthful (`native-adaptive`) plus a shared mount would be a lie; if isolation is rolled back, map native adaptive shell-mode to a documented `FALLBACK_SHARED_ADAPTIVE` only with a code comment, or simply mount AdaptiveComposition for both `web-adaptive` and `native-adaptive`.

**Simplest rollback:** HomeScreen treats `native-adaptive` identically to `web-adaptive` (both mount AdaptiveComposition). Resolver can remain. Zero API/DB/auth/route/SOS/web-token change.

---

## 19. Phase 1 handoff (enabled, not authorized)

Successful future Phase 0 **enables** a separately authorized Phase 1 to restyle **only** `VionaNativeHomeOpeningStage` (and later native tile adapters).

Phase 1 must still separately authorize:

- native token namespace creation/activation;
- native hero redesign;
- native tiles;
- spacing / light surfaces / cards;
- any navigation consequences (none assumed).

Phase 0 must not pull Phase 1 work. After Phase 0, native may still look Fashion-Tech.

---

## 20. Implementation sequence

Prefer this small order in a **future** implementation packet.

| STEP | FILE | ACTION | PURPOSE | RISK | TEST | ROLLBACK |
|---|---|---|---|---|---|---|
| 1 | `src/navigation/homePresentationTarget.ts` | CREATE pure mapper | Isolate native vs web visual owner without changing shell-mode | Low if shell-mode untouched | Unit matrix §15.1–10 | Delete file; HomeScreen unused import removed |
| 2 | `scripts/test-viona-mobile-phase0-native-presentation-isolation.ts` | CREATE | Lock invariants before HomeScreen edit | Low | The new script itself | Delete script |
| 3 | `src/components/viona/VionaNativeHomeOpeningStage.tsx` | CREATE parity wrapper | Native opening boundary; visual parity | Low | Static import + tsc | Delete file; HomeScreen mounts AdaptiveComposition |
| 4 | `src/screens/HomeScreen.tsx` | MODIFY opening mount only | Native selects wrapper; web keeps AdaptiveComposition | Medium (god-component) | Static: web still imports AdaptiveComposition; native branch imports wrapper; handlers/SOS strings unchanged | Mount AdaptiveComposition for `native-adaptive` |
| 5 | validators | RUN §16 | Prove freeze + isolation | — | tsc, expo, release-discipline, shell-mode goldens | Revert Step 4 first |

No other files in the sequence.

---

## 21. Risk register

| Risk | Severity | Likelihood | Mitigation | Proof required |
|---|---|---|---|---|
| WEB REGRESSION | High | Medium if AdaptiveComposition or shared styles edited | Denylist those files; web still direct-mounts AdaptiveComposition | Static: AdaptiveComposition and `fashionTech` absent from diff; web mount golden |
| DOMAIN LOGIC DUPLICATION | High | Low if wrapper-only | No `goUniverse*` copy; props-only native component | Static: native file has no navigation/flag/API |
| SHELL MODE REGRESSION | High | Low if `fashionHomeShellMode.ts` unmodified | Do not modify it | File absent from diff; existing shell-mode scripts green |
| WIDTH BOUNDARY REGRESSION | High | Low if mapper ignores width | Mapper consumes shell-mode only; 767/768/769 tests compose both resolvers | Unit tests 2–4 |
| NATIVE TABLET REGRESSION | Medium | Medium if `mode` dropped | Pass `tablet` through wrapper | Unit + static `mode={` / tablet prop |
| SOS REACHABILITY REGRESSION | High | Low if tab navigator untouched | Denylist SOS + MainTabNavigator; native opening must not mount SOS | Static 16–17; MainTabNavigator absent from diff |
| ACCOUNT ACCESS REGRESSION | High | Low | No chrome/nav change | Static 15; routes/MainTabNavigator absent from diff |
| ROUTE REGRESSION | High | Low | `routes.ts` denylist | Static 21 |
| DESIGN LOCK DRIFT | High | Low | Lock file denylist; no light canonical claim | Lock file absent from diff |
| PREMATURE CLEAR PREMIUM ACTIVATION | High | Medium if token/file temptation | No token file; wrapper only; Phase 1 boundary | Native opening still imports AdaptiveComposition; no new light canvas |
| FEATURE FLAG COMPLEXITY | Medium | N/A (rejected) | Option 2 deterministic | No `nativeHomePresentationIsolated` in diff |
| ROLLBACK FAILURE | Medium | Low | Documented HomeScreen remount | Rollback §18 is one presentation branch |

---

## 22. Governance (unchanged)

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

## 23. This-lane mutation budget

| Item | Count |
|---|---|
| New docs | 2 |
| Existing file modifications | 0 |
| Runtime / source / web / nav / SOS / assets / package / lockfile | 0 |
| Stage / commit / push / PR / merge | 0 |

---

## 24. Status

This document is an **implementation-ready PLAN**. Isolation remains:

```text
VIONA_MOBILE_PHASE0_NATIVE_PRESENTATION_ISOLATION_PLANNED_NOT_IMPLEMENTED
```

**Next action (exactly one):** separately authorize a strict read-only review of this two-file packet.

Do not implement runtime.
