# VIONA — Modern Home Mobile-Web Activation Phase B Evidence

Operator authorization: `APPROVE_VIONA_MODERN_HOME_MOBILE_WEB_ACTIVATION_IMPLEMENTATION`

Packet classification (canonical, post-merge): `VIONA_MODERN_HOME_MOBILE_WEB_ACTIVATION_VERIFIED_ON_MASTER`

## Markers

```text
VIONA_MODERN_HOME_MOBILE_WEB_ACTIVATION_PHASE_B
VIONA_MODERN_HOME_MOBILE_WEB_ACTIVATION_VERIFIED_ON_MASTER
ADAPTIVE_FASHION_HOME_MOBILE_TABLET_WEB
DESKTOP_FASHION_PRESERVED
NATIVE_LEGACY_FREEZE
EXACT_ONE_SOS_PROFILE_LANGUAGE
LEGACY_FALLBACK_RETAINED
PHASE_C_NOT_AUTHORIZED
WAVE_2_NATIVE_NOT_RUN
PACK40DR_PRESERVED
PACK40S_NOT_AUTHORIZED
```

## 1. Baseline (historical — feature-branch era)

| Field | Value |
|---|---|
| origin/master at pack start | `a569f08ba777fea9703560a22bae8b33d6cd4e2b` (PR #392–#398) |
| Historical implementation branch | `feat/viona-modern-home-mobile-web-activation-phase-b` |
| Historical feature HEAD (pre-merge) | `a2c7199aab994400ce293f8a981556aff3cf1486` |
| Phase A | `VIONA_MODERN_HOME_SHELL_MODE_RESOLVER_FOUNDATION_CLOSED_GREEN_VERIFIED_ON_MASTER` |
| Architecture | `MOBILE_WEB_FIRST_THEN_NATIVE_ADAPTATION` |

## 2. Old render matrix (pre-Phase-B)

| Surface | Path |
|---|---|
| web B2C Home &lt;769 | legacy/hybrid |
| web B2C Home ≥769 | Fashion-Tech desktop |
| native | legacy/hybrid |

## 3. New render matrix

| Surface | Mode | Composition |
|---|---|---|
| web B2C Home 390/430 | `mobile` | `VionaFashionHomeAdaptiveComposition` + world cards + legacy capability blocks; tabs visible |
| web B2C Home 768 | `tablet` | adaptive tablet density; tabs visible |
| web B2C Home ≥769 | `desktop` | existing Fashion-Tech desktop (command bar; tabs hidden) **unchanged** |
| ios/android | `legacy` | legacy/hybrid **unchanged** |
| B2B/Broker/Admin/non-Home | `legacy` | unchanged |

## 4. Adaptive architecture

- Sole semantic decision: `resolveFashionHomeShellMode`
- Desktop gate unchanged: `isFashionHomeDesktopShell` ≡ `mode === 'desktop'` (MainTabNavigator untouched)
- Adaptive when `isFashionHomeAdaptiveWebComposition(mode)` (`mobile` \| `tablet`)
- Component: `src/components/viona/VionaFashionHomeAdaptiveComposition.tsx`
- No desktop command bar on adaptive; no tab hide on adaptive

## 5. Legacy capability parity map

| Capability | Treatment |
|---|---|
| World cards (`VionaFashionWorldCard`) | `CONSOLIDATE_WITH_MODERN_COMPONENT` |
| ProactiveSuggestions | `KEEP_IN_MODERN_SHELL` |
| Quick actions / FOR YOU | `KEEP_IN_MODERN_SHELL` |
| Trust/wallet strip | `POLISH_AND_REHOST` (retained on adaptive) |
| Care Heart / Charity | `KEEP_IN_MODERN_SHELL` |
| DashboardB2C accordion | `RETAIN_BEHIND_EXPANSION` |
| Briefing rail | `GATE_AS_LITE_OR_BETA` (retained) |
| Tools (QR/clock/VIO) | `POLISH_AND_REHOST` |
| Tourist survival | `MOVE_TO_CONTEXTUAL_SURFACE` (retained block) |
| Utility shortcuts | `CONSOLIDATE_WITH_MODERN_COMPONENT` |
| Tab SOS / Account / Language | `KEEP_IN_MODERN_SHELL` via PR #392–#395 hosts |

## 6. Exact-one global hosts (adaptive mobile web)

Browser @ 390: Account×1, Language×1, SOS emergency×1, tabs=4, no desktop command bar.

SOS Phase-1 / left-rail / Profile Phase-2 scripts: **OK**.

## 7. Desktop regression

769 / 1024 / 1366: Fashion-Tech desktop markers (`VIONA Hub`, Fullscreen, Explore VIONA) retained; bottom tabs suppressed as before.

## 8. Native freeze

Resolver returns `legacy` for ios/android; no Fashion adaptive activation; MainTabNavigator unchanged.

## 9. Hero / assets

Approved master constellation hero with cover crop in adaptive opening. No new assets imported.

## 10. Performance observations (inspect-only)

- Adaptive and desktop trees are mutually exclusive (`desktop` XOR adaptive; native stays legacy).
- Desktop living-hero hover stack not mounted on adaptive.
- Single page ScrollView retained; world cards may use nested horizontal rail only when carousel width applies.
- Reduced-motion desktop living-hero paths unchanged; adaptive opening is static cover+copy (no autoplay stack).

## 11. Tests

| Suite | Result |
|---|---|
| Phase B activation script | **OK** |
| Phase A resolver/parity | **OK** |
| SOS Phase-1 | **OK** |
| SOS left-rail | **OK** |
| Profile/Language Phase-2 | **OK** |
| `npx tsc --noEmit` | **OK** |
| eslint touched TS | **OK** |
| `npm run smoke` | **OK** |

## 12. Responsive browser QA

| Width | Result |
|---:|---|
| 390 | Adaptive Fashion opening; tabs; exact-one hosts; ProactiveSuggestions retained |
| 430 | Adaptive Fashion opening |
| 768 | Adaptive tablet; tabs visible |
| 769 | Desktop Fashion-Tech unchanged |
| 1024 | Desktop unchanged |
| 1366 | Desktop unchanged |
| 390 SOS hold | Canonical SOS Safety Guide modal opens |

Screenshots: `docs/design/evidence/viona-modern-home-mobile-web-activation-phase-b/`

## 13. Changed paths (expected)

1. `src/components/viona/VionaFashionHomeAdaptiveComposition.tsx` (new)
2. `src/screens/HomeScreen.tsx`
3. `src/navigation/fashionHomeShellMode.ts`
4. `scripts/test-viona-modern-home-mobile-web-activation-phase-b.ts` (new)
5. `scripts/test-viona-modern-home-shell-mode-resolver-foundation.ts` (Phase B source-contract update)
6. `docs/product/VIONA_MODERN_HOME_MOBILE_WEB_ACTIVATION_PHASE_B_EVIDENCE.md`
7. `docs/design/evidence/viona-modern-home-mobile-web-activation-phase-b/*`
8. `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`
9. `Handoff_VIONA11726.txt`

## 14. Rollback

Disable adaptive by removing `fashionHomeAdaptiveWebActive` branch (or forcing non-adaptive); desktop + SOS/Profile/Language packs remain.

## 15. Limitations (historical — branch-era note)

At PR open time the packet also stated Phase B should not be marked closed on master until merge + post-merge verification. That gate is now satisfied.

- Physical native **NOT RUN**
- Phase C **NOT AUTHORIZED**
- Pack40DR preserved; Pack40S unauthorized

## 16. Final classification (historical — branch-era PR packet)

At PR open time the packet classification was:

`READY_FOR_VIONA_MODERN_HOME_MOBILE_WEB_ACTIVATION_PR_REVIEW`

That classification is **historical** only. Closure became canonical after merge + post-merge verification.

## 17. Post-merge canonical marker

| Field | Value |
|---|---|
| PR #399 | **MERGED** into `master` |
| Merge commit | `840736369801e1d52667b42c603d928fdcf72b57` |
| Merged at | `2026-07-18T23:04:10Z` |
| Verified origin/master | `840736369801e1d52667b42c603d928fdcf72b57` (contains PR #396–#399) |
| Historical feature HEAD | `a2c7199aab994400ce293f8a981556aff3cf1486` on `feat/viona-modern-home-mobile-web-activation-phase-b` |
| Final render matrix | 390/430 adaptive mobile; 768 adaptive tablet; ≥769 desktop Fashion-Tech; native legacy/hybrid |
| Single-tree | **PASS** — one Home composition at a time |
| Legacy capability parity | **PASS** — worlds, ProactiveSuggestions, quick actions, trust, Care, Dashboard accordion, tools, wallet/account, AI/Leona, Lite/Beta |
| Exact-one hosts | SOS×1, Profile/Account×1, Language×1, canonical SOS modal×1 |
| Desktop | **Preserved** |
| Native | **Unchanged** (no Fashion-Tech activation) |
| Hero/asset | Master constellation cover-crop; no historical-worktree import |
| Browser QA | 390/430/768/769/1024/1366 green |
| Phase C | **NOT AUTHORIZED** |
| Physical / Wave 2 native | **NOT RUN** |
| Pack40DR | Preserved |
| Pack40S | Unauthorized |
| Canonical classification | `VIONA_MODERN_HOME_MOBILE_WEB_ACTIVATION_VERIFIED_ON_MASTER` |

Qualifications: mobile/tablet web activation merged and verified; desktop preserved; native unchanged; browser QA green; physical native QA not run; Phase C not authorized.

Next optional authorization (explicitly **NOT AUTHORIZED** here):

`APPROVE_VIONA_MODERN_HOME_NATIVE_ADAPTATION_IMPLEMENTATION`