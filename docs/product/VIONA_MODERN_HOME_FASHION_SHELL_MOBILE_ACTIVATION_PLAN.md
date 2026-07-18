# VIONA — Modern Home Fashion Shell Mobile Activation Plan

**Document type:** Docs-only architecture and implementation planning packet.  
**Operator authorization:** `APPROVE_VIONA_MODERN_HOME_FASHION_SHELL_MOBILE_ACTIVATION_PLAN`  
**Mode:** Planning only — **no** runtime activation, breakpoint change, source implementation, worktree recovery, or native PASS claim.  
**Baseline:** `origin/master @ fec4a74b3f71d7a6973fce4d6836bd4f233c0a80` (contains PR #392–#395).

---

## 1. Executive diagnosis

| Field | Value |
|---|---|
| Recovery classification | `MODERN_MOBILE_UI_ALREADY_ON_MASTER_BUT_NOT_ACTIVE` |
| Root cause | Fashion-Tech Home is production-wired on master but gated to **web + width ≥ 769 + B2C Home** |
| Mobile web (&lt;769) | Renders **legacy/hybrid** Home path in the same `HomeScreen.tsx` |
| Native iOS/Android | **Never** enter Fashion-Tech shell (`platform !== 'web'` short-circuit) |
| Historical worktrees | No newer complete Home replacement; forward-port/recovery of stranded shells **not** recommended |
| PR #395 | **MERGED** on master — disposition **`KEEP_MERGED_PHASE2_UNCHANGED`** |
| This packet | Plan only — **Modern Home activation implementation: NOT AUTHORIZED** |

**Do not** “just” set `FASHION_HOME_DESKTOP_MIN_WIDTH` lower or remove `platform !== 'web'`. Desktop fashion mode hides the bottom tab bar and relies on a wide command rail with hover/web CSS assumptions. Blind activation would drop primary tab navigation and SOS/account chrome hosts on mobile.

---

## 2. Canonical baseline

| State | Classification |
|---|---|
| Mobile SOS Shell Phase 1 | `VIONA_MOBILE_SOS_SHELL_PHASE_1_CLOSED_GREEN_VERIFIED_ON_MASTER` |
| Profile/Language Phase 2 | `MERGED_ON_MASTER_VIA_PR395` |
| Phase-2 disposition | `KEEP_MERGED_PHASE2_UNCHANGED` |
| Modern Home recovery | `MODERN_MOBILE_UI_ALREADY_ON_MASTER_BUT_NOT_ACTIVE` |
| Modern Home activation implementation | **NOT AUTHORIZED** |
| Wave 2 physical native | **NOT RUN** |
| Pack40DR wait-state | **PRESERVED** |
| Pack40S | **NOT AUTHORIZED** |

Evidence anchors:

- `docs/product/VIONA_MOBILE_SOS_SHELL_CONSOLIDATION_PHASE_1_EVIDENCE.md`
- `docs/product/VIONA_MOBILE_SOS_LEFT_RAIL_REACHABILITY_REMEDIATION_EVIDENCE.md`
- `docs/product/VIONA_MOBILE_PROFILE_LANGUAGE_CONTEXTUALIZATION_PHASE_2_EVIDENCE.md`
- `docs/audit/VIONA_PACK_AE3_FASHION_TECH_HOME_SHELL_AUDIT.md`

---

## 3. Dual-path architecture (current)

### Gate (source of truth)

```text
isFashionHomeDesktopShell({
  platform, windowWidth, activeRole, focusedTabRoute
})
  → false if platform !== 'web'
  → false if windowWidth < 769 (FASHION_HOME_DESKTOP_MIN_WIDTH)
  → false if activeRole !== 'B2C'
  → false unless focused tab is B2C Home (or /home pathname fallback)
```

File: `src/navigation/fashionHomeDesktopShell.ts`.

### A. Modern Fashion-Tech path (`fashionHomeDesktopShellActive === true`)

| Area | Behavior |
|---|---|
| Command bar | `VionaFashionHomeCommandBar` — Language, VIO, Safety/SOS, Account, optional Role, optional fullscreen/daylight |
| Hero / opening stage | Living / fashion hero, deep bleed, daylight boost, web hover/magnetic motion |
| World cards | `VionaFashionWorldCard` + opening-stage grid/rail |
| Top rail / brand | Brand lockup + greeting in command rail |
| Profile / language | Command bar → `HomeCommand` / ProfileSwitcher ref / `SmartTrioLanguageSheet` |
| SOS | Command-bar Safety Assist → same hold-complete → singular `SOSModal`; tab-bar SOS **not** mounted (`fashionHomeDesktopShell` suppresses `shouldMountSosInTabBarShell`) |
| Tab bar | **Hidden** via `fashionHomeHiddenTabBarStyle` |
| Legacy blocks | Suppressed (no ProactiveSuggestions, Dashboard accordion, briefing rail, utility shortcuts strip, etc.) |
| Responsive assumptions | Desktop/tablet web widths; compact density exists but still desktop-oriented |
| Web-only dependencies | Hover styles, some CSS transitions, fullscreen control, pathname fallback |

### B. Legacy / hybrid mobile path (`fashionHomeDesktopShellActive === false`)

Active on typical mobile web (390–768) and all native. Inventory of visible blocks:

| Block | Source | Capability | Modern duplicate? | Unique? | Backend/domain | Recommended treatment |
|---|---|---|---|---|---|---|
| World / universe cards (lighter) | `HomeScreen` + world card components | Navigate Local/Travel/Academy/Business | Partial yes | Layout differs | No | `CONSOLIDATE_WITH_MODERN_COMPONENT` |
| Trust / wallet strip | `HomeScreen` | Wallet chip, tourist hints | Command VIO | Tourist credits copy | Wallet read | `POLISH_AND_REHOST` |
| Charity / Care Heart | `CharityWidget` | Impact / charity entry | Impact strip on fashion | Secondary layout | Charity widget | `KEEP_IN_MODERN_SHELL` |
| Legacy spaces accordion | `DashboardB2CScreen` | Expandable older dashboard | No full equivalent | Dense dashboard tools | Mostly UI | `RETAIN_BEHIND_EXPANSION` then later IA decision |
| Tourist survival chips | `HomeScreen` | Interpreter / Leona call | AI entry elsewhere | Tourist-gated | Feature flags | `MOVE_TO_CONTEXTUAL_SURFACE` |
| Legacy tools (QR / dual clock / VIO index) | `VionaInfoTile` strip | QR pay, clocks, loyalty | Partial | Dual clock unique | Wallet/loyalty nav | `POLISH_AND_REHOST` / `NEEDS_OPERATOR_DECISION` for dual clock |
| Briefing / news rail | Horizontal cards | Demo briefing alerts | No | Demo-only alerts | Alert.alert demo | `GATE_AS_LITE_OR_BETA` or consolidate into proactive help |
| ProactiveSuggestions | `ProactiveSuggestions` | Quick suggestion chips | No | Academy/Leona gated | Feature flags | `KEEP_IN_MODERN_SHELL` (rehost) |
| Feature / operator identity row | Brand + online + admin debug | Identity + admin unlock | Greeting in command bar | Admin debug taps | Admin debug | `POLISH_AND_REHOST`; keep admin debug |
| Utility shortcuts | Vault / travel / etc. chips | Shortcuts | Universe cards + account | Some deep links | Nav only | `CONSOLIDATE_WITH_MODERN_COMPONENT` |
| PR #395 Account/Language | `VionaShellAccountLanguageActions` in tab chrome | Account, language, optional role | Command bar utilities | Same capability | Locale via Smart Trio | `KEEP_IN_MODERN_SHELL` via exact-one host rule |
| SOS Phase 1 | `VionaGlobalSosShellAction` bottom chip | Hold → canonical modal | Command Safety Assist | Same modal owner | No provider dial | `KEEP_IN_MODERN_SHELL` via exact-one host rule |
| Bottom tabs | `MainTabNavigator` | Hub/Local/Travel/Academy | Hidden on fashion desktop | **Primary nav on mobile** | — | **Must remain visible on mobile fashion mode** |

---

## 4. Legacy capability map (summary table)

| Legacy block | Capability | Modern equivalent | Unique behavior | Required treatment |
|---|---|---|---|---|
| DashboardB2C accordion | Dense B2C dashboard | None | Expand-only archive | `RETAIN_BEHIND_EXPANSION` |
| ProactiveSuggestions | Quick help chips | None dedicated | Flag-gated | `KEEP_IN_MODERN_SHELL` |
| Briefing rail | News/advice cards | None | Demo Alert | `GATE_AS_LITE_OR_BETA` |
| Utility shortcuts | Vault/travel chips | World + Account | Deep links | `CONSOLIDATE_WITH_MODERN_COMPONENT` |
| Dual clock tile | Local + VN time | None | Timezone UX | `NEEDS_OPERATOR_DECISION` |
| QR pay tile | Wallet QR entry | VIO/Account | Shortcut | `POLISH_AND_REHOST` |
| Tourist survival | Interpreter / voice | AI entry | Tourist-only | `MOVE_TO_CONTEXTUAL_SURFACE` |
| Trust/wallet strip | Credits display | Command VIO | Tourist hint | `POLISH_AND_REHOST` |
| Charity widget | Care Heart | Impact strip | Secondary | `KEEP_IN_MODERN_SHELL` |
| Feature/admin row | Identity + admin | Greeting | Admin unlock | `POLISH_AND_REHOST` |
| Tab chrome Account/Language | PR #395 | Command utilities | Exact-one with fashion | `REMOVE_DUPLICATE_RENDERING_ONLY` when command owns |
| Tab chrome SOS | Phase 1 | Command Safety | Exact-one with fashion | `REMOVE_DUPLICATE_RENDERING_ONLY` when command owns |
| Bottom tabs | Universe nav | Hidden on desktop fashion | **Required on mobile** | `KEEP_IN_MODERN_SHELL` (do not hide on mobile) |

---

## 5. Mobile-readiness matrix

Scores: **Y** = workable with light polish; **A** = needs adaptation; **N** = not ready / unsafe to activate as-is.

| Component | 390 | 430 | 768 | Native readiness | Main risk | Required adaptation |
|---|---:|---:|---:|---:|---|---|
| `isFashionHomeDesktopShell` | N | N | N* | N | Web+769 gate | New `resolveFashionHomeShellMode` |
| `VionaFashionHomeCommandBar` | A | A | A | A | `minWidth` ~160–168 chips; hover web styles; absolute overlays; dense horizontal rail | Compact mobile rail **or** keep utilities in tab chrome |
| `HomeScreen` fashion hero/opening | A | A | Y | A | Deep bleed, web hover/magnetic, fullscreen | Portrait hero locks; disable hover-only motion |
| `VionaFashionWorldCard` | Y | Y | Y | Y | Crop/text density | Verify 390 portrait crop |
| `fashionHomeDesktopShell.ts` layout helpers | A | A | Y | A | Many web-only style branches | Native-safe fallbacks |
| `fashionHomeHiddenTabBarStyle` | N | N | N | N | Hides tabs+SOS+PR395 hosts | **Do not apply on mobile modes** |
| Living hero / daylight web motion | A | A | Y | A | Web timers/hover | Reduced-motion + native skip |
| `VionaShellAccountLanguageActions` | Y | Y | Y | Y | Already mobile chrome | Keep when command bar not used |
| `VionaGlobalSosShellAction` | Y | Y | Y | Y | Exact-one with command SOS | Keep bottom chip on mobile fashion |
| Legacy blocks | Y | Y | Y | Y | Clutter | Migrate per capability map |

\*768 is below 769 today → still legacy path by one pixel; tablet web should be an explicit mode.

---

## 6. Platform decision (Options A / B / C)

### Option A — Mobile-web activation first
Adapt Fashion-Tech composition for web &lt;769; native stays on legacy temporarily.  
**Pros:** Smaller blast radius; browser QA first; reuses most HomeScreen fashion branch.  
**Cons:** Temporary web/native divergence.  
**Fit:** Strong for Phase B.

### Option B — Shared adaptive Fashion shell (all platforms at once)
One shell mode for web mobile/tablet/desktop + iOS/Android.  
**Pros:** Long-term consistency.  
**Cons:** Highest complexity; native readiness of command bar / web CSS helpers is incomplete; risks SOS/nav regressions.  
**Fit:** Target end-state, not first pack.

### Option C — Separate native modern composition
Shared tokens/capabilities; distinct native layout tree.  
**Pros:** Native performance and touch IA.  
**Cons:** Duplication; longer calendar.  
**Fit:** Phase C candidate after mobile-web proves IA.

### Selected architecture

**`MOBILE_WEB_FIRST_THEN_NATIVE_ADAPTATION`**

Safer than flipping `FASHION_HOME_DESKTOP_MIN_WIDTH` or removing `platform !== 'web'` because:

1. Desktop fashion **hides** the tab bar — unsafe on mobile without a new chrome contract.  
2. Command bar assumes wide horizontal chip rows and web hover.  
3. Native never exercised the fashion path — needs a separate readiness pack.  
4. PR #395 + SOS Phase 1 already solve mobile chrome; mobile fashion should **compose with** them, not replace them blindly.

Recommended classification for this plan’s architecture decision:

**`MOBILE_WEB_FIRST_THEN_NATIVE_ADAPTATION`**

---

## 7. Activation predicate design (planning only — do not implement)

**Do not overload** `isFashionHomeDesktopShell` to mean “any adaptive fashion mode.”

Introduce a semantic resolver (name illustrative):

```text
resolveFashionHomeShellMode(input) →
  'legacy' | 'mobile' | 'tablet' | 'desktop'
```

| Mode | Intended surfaces | Tab bar | Account/Language host | SOS host |
|---|---|---|---|---|
| `legacy` | Current non-fashion path | Visible | PR #395 bottom/left chrome when SOS chrome mounts | Phase 1 bottom / left-rail |
| `mobile` | B2C Home, web width ≤768 (exact bands TBD), later native | **Visible** | Prefer tab chrome (PR #395) **or** compact strip — exact-one | Bottom chip Phase 1 |
| `tablet` | Web ~768–1023 B2C Home | Policy TBD (prefer visible) | Exact-one | Exact-one |
| `desktop` | Current fashion desktop (≥769 web) | Hidden | Command bar | Command Safety Assist |

Exclusions (remain non-fashion Home unless separately authorized):

- B2B / Broker / Admin  
- Non-Home B2C tabs (Local/Travel/Academy own rails)  
- Signed-out: preserve existing auth/paywall semantics  
- Lite/unsupported: keep honest status pills

`isFashionHomeDesktopShell` may remain as a **compat wrapper** for `mode === 'desktop'` during migration.

---

## 8. Home information architecture (intended modern mobile)

Priority top → bottom (one job per section):

1. **Identity / context** — compact greeting or brand (not full desktop command rail).  
2. **Hero / opening stage** — single dominant visual; one headline; one short support line; primary CTA group.  
3. **Universes** — Local / Travel / Academy / Business cards (stacked or 2-col by width).  
4. **Proactive help** — rehosted ProactiveSuggestions (not floating chaos).  
5. **Trust / safety** — Lite/Beta disclosure + safety disclaimers.  
6. **Support / operator** — contextual, not a legacy dashboard dump.  
7. **Wallet / account** — credits affordance without duplicating Account chrome.  
8. **AI / Leona** — gated entry, tourist survival where required.  
9. **Language** — exact-one (tab chrome or compact control).  
10. **SOS** — exact-one bottom chip (Phase 1).  
11. **Capability disclosure** — Lite/Pilot/Demo labels honest.

Anti-pattern: compressed desktop page with hidden tabs + dense command chips.

---

## 9. Hero / asset readiness

| Question | Finding |
|---|---|
| Desktop fashion assets on master? | Yes — home hero / world card assets under `assets` / `src/assets/viona/home` |
| Mobile portrait dedicated fashion Home heroes? | **Gap** — desktop opening-stage art may crop poorly at 390 |
| Local/Travel bright/dynamic-hero worktrees | Useful for **universe** surfaces; not a substitute Home shell; **do not copy** in this plan |
| Text in images? | Prefer text overlays (i18n); avoid baked long copy |
| Separate asset pack needed? | **Yes** — bounded dependency before claiming visual green on 390/430 |

Asset dependency status: **NOT AUTHORIZED** to import historical worktree assets in this plan.

---

## 10. Capability preservation

Must remain green after any future implementation:

1. Mobile bottom SOS host  
2. B2B/Broker/Admin left-rail SOS  
3. Singular canonical `SOSModal`  
4. `EmergencySOS` route  
5. PR #395 profile/account access  
6. PR #395 language selection + locale persistence  
7. Role switching  
8. Auth / signed-out  
9. Local/Travel/Academy approved work  
10. Request/status  
11. Account/wallet  
12. Accessibility  
13. Safety disclaimers  
14. Pack40 safeguards  

**Exact-one rules:** no duplicate SOS, profile, language, tab bars, command bars, or modal owners for a given mode.

---

## 11. Performance plan (gates to measure later)

| Gate | Planning target |
|---|---|
| Initial Home interaction | Measure TTI / first meaningful paint on mid Android + mobile Chrome |
| Image weight | Budget per hero + world card; lazy offscreen |
| Carousels | Prefer stacked grid on 390; limit nested horizontals |
| Animation | Cap concurrent; honor reduced-motion |
| Memory | Avoid full desktop living-hero timers on mobile/native |
| Low bandwidth | Placeholder / lower-res fallback |
| Lists | No unbounded Dashboard mount until expanded |

No production numbers invented here — implementation must record measurements in evidence.

---

## 12. Phased implementation

### Phase A — Adaptive foundation
**Scope:** `resolveFashionHomeShellMode` (+ tests); map capabilities; **no** visual activation.  
**Files (likely):** new resolver module near `fashionHomeDesktopShell.ts`; thin wrappers; tests; docs.  
**Rollback:** unused resolver; zero UX change.  
**Stop:** mode matrix incomplete.  
**Phrase:** `APPROVE_VIONA_MODERN_HOME_SHELL_MODE_RESOLVER_FOUNDATION`

### Phase B — Mobile-web modern Home
**Scope:** Activate modern **composition** for web 390/430/768 B2C Home **without** hiding tabs; migrate legacy blocks per map; keep PR #395 + SOS hosts.  
**Files (likely):** `HomeScreen.tsx`, selected fashion components, responsive tokens, tests, evidence, Kernel/Handoff.  
**Rollback:** force `legacy` mode for web mobile.  
**Stop:** duplicate hosts, tab bar hidden, SOS unreachable, capability loss.  
**Phrase:** `APPROVE_VIONA_MODERN_HOME_MOBILE_WEB_ACTIVATION_IMPLEMENTATION`

### Phase C — Native modern Home
**Scope:** Native mode adaptation (shared or bounded native composition).  
**Rollback:** native stays `legacy`.  
**Phrase:** `APPROVE_VIONA_MODERN_HOME_NATIVE_ACTIVATION_IMPLEMENTATION`

### Phase D — Physical device confidence
**Scope:** Separately authorized Wave 2 physical iOS/Android.  
**Phrase:** existing / renewed Wave 2 operator run — **not** claimed by browser QA.

---

## 13. First implementation pack boundary (Phase A)

**In-scope candidates:**

- `src/navigation/fashionHomeDesktopShell.ts` (compat + re-exports) **or** sibling `fashionHomeShellMode.ts`
- Thin call-site wiring **only if** behavior-identical (`desktop` ≡ today’s true)
- Unit/contract tests for mode matrix
- Evidence + Kernel/Handoff

**Explicitly out of scope:**

- Lowering 769 or removing web-only check for visual activation  
- Hiding mobile tab bar  
- Backend/API/auth/role/Prisma/payment/provider/Pack40/deploy  
- Unrelated Local/Travel/Academy redesign  
- Asset imports from dirty worktrees  

---

## 14. Test plan

1. Shell-mode selection matrix (platform × width × role × tab)  
2. Widths 390 / 430 / 768 / 1024 / 1366  
3. Mobile web vs desktop web  
4. iOS/Android source-mode decisions (even if still `legacy`)  
5. B2C Home only for fashion modes  
6. B2B/Broker/Admin exclusion  
7. Signed-out / paywall unchanged  
8. Exact-one SOS host  
9. Exact-one profile host  
10. Exact-one language host  
11. Single canonical SOS modal  
12. Legacy capability parity checklist  
13. Long locale (vi / de) truncation  
14. Keyboard + safe area  
15. Reduced motion  
16. Low-bandwidth asset fallback (when assets pack exists)  
17. No backend/provider invoke in render tests  

Preserve green: SOS Phase-1 + left-rail + Phase-2 contract scripts.

---

## 15. Visual QA plan

Required screenshots (browser unless Phase D):

- 390 / 430 / 768 Home (mode under test)  
- Mobile hero; universe section; trust/support  
- Account + Language controls; SOS modal open  
- Long locale  
- 1024 / 1366 desktop fashion regression  
- Native portrait — **only** when Phase C/D authorized  

Browser ≠ physical native PASS.

---

## 16. Rollback plan

| Mechanism | Rule |
|---|---|
| Source mode fallback | `resolveFashionHomeShellMode` → force `legacy` |
| Remote feature flag | **Not** required; do not add backend flag |
| Long-term trees | No permanent dual Home after closure; remove legacy only under separate authorization |
| Legacy removal | **Not authorized** by this plan |

---

## 17. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Blind gate flip hides tabs/SOS | Critical | Mobile mode keeps tab chrome |
| Command bar overflow at 390 | High | Compact strip or keep PR #395 hosts |
| Hero crop / asset gap | Medium | Asset dependency pack |
| Web/native temporary divergence | Medium | Explicit Phase C |
| Duplicate hosts | High | Exact-one matrix tests |
| Capability loss from deleting “old looking” blocks | High | Capability map treatments |

---

## 18. Stop conditions

Stop / block implementation packs if:

- Exact-one SOS/profile/language violated  
- Canonical SOS modal ownership splits  
- Tab bar hidden on mobile without approved alternate nav  
- Pack40 / auth / payment / provider touched  
- Physical PASS claimed from browser QA  
- Dirty worktree assets copied without asset authorization  

---

## 19. Authorization sequence

1. ~~Recovery audit~~ — done (`MODERN_MOBILE_UI_ALREADY_ON_MASTER_BUT_NOT_ACTIVE`)  
2. **This plan** — docs-only PR (no merge by executor)  
3. `APPROVE_VIONA_MODERN_HOME_SHELL_MODE_RESOLVER_FOUNDATION` — Phase A  
4. `APPROVE_VIONA_MODERN_HOME_MOBILE_WEB_ACTIVATION_IMPLEMENTATION` — Phase B  
5. `APPROVE_VIONA_MODERN_HOME_NATIVE_ACTIVATION_IMPLEMENTATION` — Phase C  
6. Wave 2 physical — separate  

---

## 20. Markers

```text
VIONA_MODERN_HOME_FASHION_SHELL_MOBILE_ACTIVATION_PLAN
MODERN_MOBILE_UI_ALREADY_ON_MASTER_BUT_NOT_ACTIVE
PR395_MERGED_KEEP_UNCHANGED
NO_BREAKPOINT_FLIP_WITHOUT_CHROME_CONTRACT
MOBILE_WEB_FIRST_THEN_NATIVE_ADAPTATION
IMPLEMENTATION_NOT_AUTHORIZED
WAVE_2_NATIVE_NOT_RUN
PACK40DR_PRESERVED
PACK40S_NOT_AUTHORIZED
```

**Packet classification:** `READY_FOR_VIONA_MODERN_HOME_MOBILE_ACTIVATION_PLAN_PR_REVIEW`
