# VIONA — Modern Home Native Adaptation Phase C Evidence

Operator authorization: `APPROVE_VIONA_MODERN_HOME_NATIVE_ADAPTATION_IMPLEMENTATION`

Packet classification (canonical, post-merge):  
`VIONA_MODERN_HOME_NATIVE_ADAPTATION_VERIFIED_ON_MASTER`

Qualifiers: native source implementation merged and verified; Android emulator **PASS** (**NOT PHYSICAL DEVICE PASS**); iOS simulator **not run** (`IOS_SIMULATOR_NOT_RUN_ENVIRONMENT_UNAVAILABLE`); physical-device Wave 2 **NOT RUN**; deployment **none**; Phase D **NOT AUTHORIZED**.

## Markers

```text
VIONA_MODERN_HOME_NATIVE_ADAPTATION_PHASE_C
VIONA_MODERN_HOME_NATIVE_ADAPTATION_VERIFIED_ON_MASTER
SHARED_ADAPTIVE_NATIVE_REUSE
NATIVE_FASHION_HOME_MOBILE_TABLET
WEB_PHASE_B_PRESERVED
DESKTOP_FASHION_PRESERVED
LEGACY_NATIVE_FALLBACK_RETAINED
EXACT_ONE_SOS_PROFILE_LANGUAGE
MAIN_TAB_NAVIGATOR_UNTOUCHED
ANDROID_EMULATOR_QA_PASS
IOS_SIMULATOR_NOT_RUN_ENVIRONMENT_UNAVAILABLE
WAVE_2_PHYSICAL_NATIVE_NOT_RUN
PHASE_D_NOT_AUTHORIZED
PACK40DR_PRESERVED
PACK40S_NOT_AUTHORIZED
```

## 1. Baseline (historical — feature-branch era)

| Field | Value |
|---|---|
| origin/master at pack start | `1c9acc3c9d2520fa92f7775f9296de4e29cd392c` (PR #392–#400) |
| Historical implementation branch | `feat/viona-modern-home-native-adaptation-phase-c` |
| Historical feature HEAD (pre-squash) | `4d96feffde31684c54f4ffe98a90ef20da04a05a` |
| Phase A | `VIONA_MODERN_HOME_SHELL_MODE_RESOLVER_FOUNDATION_CLOSED_GREEN_VERIFIED_ON_MASTER` |
| Phase B | `VIONA_MODERN_HOME_MOBILE_WEB_ACTIVATION_CLOSED_GREEN_VERIFIED_ON_MASTER` |
| Architecture | `SHARED_ADAPTIVE_NATIVE_REUSE` |

## 2. Old native render matrix (pre-Phase-C)

| Surface | Mode | Composition |
|---|---|---|
| ios/android B2C Home | `legacy` | legacy/hybrid |
| web 390/430 | `mobile` | Phase-B adaptive |
| web 768 | `tablet` | Phase-B adaptive |
| web ≥769 | `desktop` | Fashion-Tech desktop |
| B2B/Broker/Admin/non-Home | `legacy` | unchanged |

## 3. New render matrix

| Surface | Mode | Composition |
|---|---|---|
| ios/android B2C Home &lt;768 | `mobile` | `VionaFashionHomeAdaptiveComposition` + world cards + legacy capability blocks; tabs visible |
| ios/android B2C Home ≥768 | `tablet` | adaptive tablet density; **never** `desktop` (no command bar / no tab hide) |
| web 390/430 | `mobile` | Phase-B adaptive **unchanged** |
| web 768 | `tablet` | Phase-B adaptive **unchanged** |
| web ≥769 | `desktop` | Fashion-Tech desktop **unchanged** |
| B2B/Broker/Admin/non-Home | `legacy` | unchanged |

## 4. Selected native architecture

**`SHARED_ADAPTIVE_NATIVE_REUSE`**

- Adaptive composition uses pure React Native primitives (`View` / `Text` / `Image` / `LinearGradient`).
- No separate native-only Fashion composition file.
- Desktop eligibility remains **web-only** (`isFashionHomeDesktopEligible` requires `platform === 'web'`).
- Semantic decision remains centralized in `resolveFashionHomeShellMode`.
- Home mounts exactly one tree via `fashionHomeAdaptiveActive` XOR desktop XOR legacy hybrid root testIDs.

## 5. Reused / adapted components

| Component | Treatment |
|---|---|
| `VionaFashionHomeAdaptiveComposition` | Reused on native (docs + resolver gate) |
| `VionaFashionWorldCard` | Unchanged |
| Desktop `VionaFashionHomeCommandBar` | Desktop-only (not mounted on native) |
| Legacy hybrid opening | Retained as rollback path when adaptive inactive |
| `CharityWidget` | Bounded worklet-safe fix (see §13) — Care capability required for Home mount |

## 6. Web-only dependencies isolated

- Desktop living-hero / command-bar / hover stacks remain gated by `fashionHomeDesktopShellActive` / `mode === 'desktop'`.
- Native never enters `desktop` mode.
- No browser CSS/DOM assumptions added to adaptive composition.

## 7. Native shell contract

| Requirement | Result |
|---|---|
| Bottom tabs preserved | PASS — MainTabNavigator untouched |
| Safe-area / status bar | PASS — shell + single page ScrollView; no dual full-height nest |
| No desktop command bar | PASS |
| No duplicate SOS/Profile/Language | PASS — shell hosts only |
| Normal vertical scroll | PASS |
| Android back | PASS (dismissed SOS/language sheets) |
| Touch targets / a11y | PASS (existing shell roles retained) |

## 8. Exact-one host proof (Android emulator Small_Phone)

UIAutomator on B2C Home:

| Host | Count / evidence |
|---|---|
| SOS tab-bar host | `viona-sos-tab-bar-host` present; `content-desc="SOS emergency entry"` ×1 |
| Account | bottom chrome bounds present ×1 → opens PersonalHub |
| Language | bottom chrome bounds present ×1 → opens Smart Trio sheet |
| Canonical SOS modal | SOS Safety Guide opened via ~3s hold |
| Adaptive Home root | `content-desc="VIONA Fashion Home mobile"` |
| Desktop command bar | not mounted |

## 9. Legacy capability parity

| Capability | Treatment | Reachability |
|---|---|---|
| Six universes / world cards | `REUSE_SHARED_ADAPTIVE_SECTION` | EXPLORE VIONA visible |
| ProactiveSuggestions | `KEEP_IN_NATIVE_MODERN_HOME` | retained in HomeScreen |
| Quick actions / tools | `KEEP_IN_NATIVE_MODERN_HOME` | retained |
| Trust/safety strip | `KEEP_IN_NATIVE_MODERN_HOME` | retained |
| Care / CharityWidget | `POLISH_AND_REHOST` + worklet-safe fix | Care section retained |
| Dashboard accordion | `RETAIN_BEHIND_EXPANSION` | retained |
| AI/Leona / wallet / Lite-Beta | `KEEP_IN_NATIVE_MODERN_HOME` | retained |
| SOS / Account / Language | `MOVE_TO_EXISTING_CONTEXTUAL_SURFACE` (shell) | exact-one hosts |

Legacy hybrid path **not deleted** (rollback).

## 10. Web / desktop regression proof

Phase-B + Phase-A scripts green after Phase C:

- web 390/430 → mobile adaptive
- web 768 → tablet adaptive
- web 769/1024/1366 → desktop
- B2B/Broker/Admin/non-Home → legacy
- `isFashionHomeDesktopShell` ≡ `mode === 'desktop'`

## 11. Safe-area and scroll ownership

- Bottom tabs + SOS/Account/Language owned by MainTabNavigator (unchanged).
- Home content uses existing single page ScrollView; adaptive opening is not a second full-height ScrollView.
- Font scaling: adaptive texts use `numberOfLines` without fixed-height clip of the page.

## 12. Hero / asset treatment

Approved master constellation asset via cover crop in adaptive opening (same as Phase B). No new assets. Native layout bounded (`resizeMode="cover"`, fixed hero height mobile/tablet).

## 13. Performance / structure (inspect-only)

- Single Home composition mounted (adaptive XOR desktop XOR legacy).
- No dual-tree hide-via-style.
- Adaptive opening is static cover+copy (no desktop living-hero autoplay stack).
- Nested horizontal world-card rail only where carousel width applies.
- CharityWidget: fixed pre-existing `formatUsd` call inside `useAnimatedReaction` that crashed native Worklets on Home mount (`runOnJS(updateDisplayAmount)(value)`).

## 14. Tests

| Suite | Result |
|---|---|
| Phase C native adaptation | **OK** |
| Phase B mobile-web | **OK** |
| Phase A resolver/parity | **OK** |
| SOS Phase-1 | **OK** |
| SOS left-rail | **OK** |
| Profile/Language Phase-2 | **OK** |
| `npx tsc --noEmit` | **OK** |
| eslint Phase-C scoped files (`--max-warnings 0`) | **OK** |
| eslint HomeScreen | **0 errors** (pre-existing warnings only) |
| `npm run smoke` | **OK** |

## 15. Android emulator result

| Item | Value |
|---|---|
| Device | AVD `Small_Phone` (`emulator-5554`) |
| Runtime | Expo development client `com.ketnoiglobal.app` + Metro `:8082` |
| Size | 720×1280 @ 320dpi |
| Opening stage | PASS — Fashion adaptive mobile |
| Six universes | PASS — EXPLORE VIONA |
| SOS hold → modal | PASS |
| Account shell | PASS → Cá nhân / PersonalHub |
| Language shell | PASS → Language & market sheet |
| Bottom tabs | PASS |
| Landscape capture | captured (`android-emulator-landscape.png`) |
| Classification | **Android emulator PASS** (not physical-device PASS) |

## 16. iOS simulator result

`IOS_SIMULATOR_NOT_RUN_ENVIRONMENT_UNAVAILABLE` — Windows host; no legitimate iOS simulator. iOS covered by source tests/typecheck only.

## 17. Sanitized evidence paths

`docs/design/evidence/viona-modern-home-native-adaptation-phase-c/`

- `android-emulator-home-opening.png`
- `android-emulator-universes-proactive.png`
- `android-emulator-trust-care.png`
- `android-emulator-sos-modal.png`
- `android-emulator-account-shell.png`
- `android-emulator-language-shell.png`
- `android-emulator-landscape.png`

No tokens/secrets/PII in captures.

## 18. Rollback boundary

Centralized resolver: revert native platforms from adaptive eligibility → native returns to `legacy` without reverting Phase A/B, SOS Phase 1, or Profile Phase 2. Legacy hybrid Home path retained.

## 19. Exact changed paths

- `src/navigation/fashionHomeShellMode.ts`
- `src/screens/HomeScreen.tsx`
- `src/components/viona/VionaFashionHomeAdaptiveComposition.tsx`
- `src/components/ui/CharityWidget.tsx` (bounded native worklet unblocker)
- `scripts/test-viona-modern-home-native-adaptation-phase-c.ts`
- `scripts/test-viona-modern-home-mobile-web-activation-phase-b.ts`
- `scripts/test-viona-modern-home-shell-mode-resolver-foundation.ts`
- `docs/product/VIONA_MODERN_HOME_NATIVE_ADAPTATION_PHASE_C_EVIDENCE.md`
- `docs/design/evidence/viona-modern-home-native-adaptation-phase-c/*`
- `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`
- `Handoff_VIONA11726.txt`

**Not changed:** MainTabNavigator, SOS sources, ProfileSwitcher, SmartTrio, Expo/EAS, backend/schema/provider/deploy.

## 20. Physical-device Wave 2

**NOT RUN** — not authorized by this pack.

## 21. Phase D

**NOT AUTHORIZED.**

## 22. Final classification (historical — feature-branch era)

Historical pre-merge packet classification (superseded by §23):  
`READY_FOR_VIONA_MODERN_HOME_NATIVE_ADAPTATION_PR_REVIEW`

## 23. Post-merge canonical marker

Operator authorization (docs sync): `APPROVE_VIONA_MODERN_HOME_NATIVE_ADAPTATION_POST_MERGE_CANONICAL_SYNC`

| Field | Value |
|---|---|
| PR #401 | **MERGED** into `master` |
| Merge commit (squash) | `fba383fb17101c1233c085213915c401d0f38cf4` |
| Merged at | `2026-07-19T00:31:32Z` |
| Historical feature HEAD (pre-squash) | `4d96feffde31684c54f4ffe98a90ef20da04a05a` on `feat/viona-modern-home-native-adaptation-phase-c` |
| origin/master verification baseline (at #402 sync authoring) | contains PR #396–#401; Phase-C source at merge `fba383f` |
| Canonical classification | `VIONA_MODERN_HOME_NATIVE_ADAPTATION_VERIFIED_ON_MASTER` |
| Native render matrix | eligible iOS/Android B2C Home → adaptive Fashion-Tech (`mobile`/`tablet`); **native never desktop** |
| Resolver | centralized `resolveFashionHomeShellMode`; `isFashionHomeDesktopShell` ≡ `mode === 'desktop'` |
| Single-tree | exactly one of legacy / adaptive / desktop mounts |
| Exact-one shell ownership | SOS=1, Profile/Account=1, Language=1, canonical SOS modal=1, bottom tab shell=1 |
| Legacy capability parity | six universes, proactive, trust/safety, Care, Dashboard accordion, tools, wallet/account, AI/Leona, tourist-survival, Lite/Beta — preserved |
| Web Phase B | 390/430 mobile + 768 tablet adaptive **preserved** |
| Desktop | ≥769 Fashion-Tech **preserved** |
| CharityWidget boundary | worklet/native compatibility only (`runOnJS(updateDisplayAmount)`); no CTA/nav/network/business-domain change |
| Assets | current-master constellation only |
| Android emulator | **PASS** — **NOT PHYSICAL DEVICE PASS** |
| iOS simulator | `IOS_SIMULATOR_NOT_RUN_ENVIRONMENT_UNAVAILABLE` |
| Physical Wave 2 | **NOT RUN** |
| Phase D / physical-device operator run | **NOT AUTHORIZED** |
| Deployment / production validation | **none** |
| Pack40DR | preserved |
| Pack40S | **NOT AUTHORIZED** |

## 24. PR #402 citation addendum

Operator authorization: `APPROVE_VIONA_MODERN_HOME_NATIVE_CANONICAL_CITATION_ADDENDUM`

| Field | Value |
|---|---|
| PR #401 | **Implementation** merge — squash `fba383fb17101c1233c085213915c401d0f38cf4` @ `2026-07-19T00:31:32Z` |
| PR #402 | **Canonical docs-sync** merge — squash `4e060f744c6c5479215bc3db4fa41e62f1031020` @ `2026-07-19T20:32:14Z` |
| PR #402 purpose | Phase-C post-merge canonical sync |
| PR #402 state | **MERGED** into `master` |
| PR #402 scope | docs-only: Kernel + Handoff + Phase-C evidence |
| PR #402 result | Kernel, Handoff and Phase-C evidence synchronized to `VIONA_MODERN_HOME_NATIVE_ADAPTATION_VERIFIED_ON_MASTER` |
| Phase-C classification after #402 | `VIONA_MODERN_HOME_NATIVE_ADAPTATION_VERIFIED_ON_MASTER` |
| Historical feature HEAD | `4d96feffde31684c54f4ffe98a90ef20da04a05a` (pre-squash; not a merge commit) |
| Current citation-addendum | **not merged yet** — branch `docs/viona-modern-home-native-canonical-citation-addendum`; do not treat this addendum as merged inside the pre-merge diff |
| Physical Wave 2 | **NOT RUN** |
| Phase D | **NOT AUTHORIZED** |
| Deployment | **NONE** |

### TERMINAL_CANONICAL_SYNC_RULE

1. A pull request cannot truthfully record its own final merge commit before it is merged.
2. This citation-addendum PR is therefore **not** required to self-record its own future merge commit inside the same pre-merge diff.
3. Its merge status will be verified directly through Git/GitHub during the final read-only post-merge verification.
4. Once that external merge verification passes, **no further docs-only self-citation PR** is required solely to record this addendum PR.
5. This rule does **not** waive source verification, changed-path verification, canonical contradiction checks, Phase D authorization requirements, or physical-device disclosure requirements.

Equivalent marker:

```text
TERMINAL_CANONICAL_SYNC_RULE:
The final citation-addendum PR is closed through external Git/GitHub merge
verification and does not require a further self-referential docs PR.
```
