# VIONA Pack A + Apex + Industry Verification

**Date:** 2026-05-06  
**Scope:** Verify the 6 newly packaged commits after split (docs + mini-app foundation + resolver wiring + apex UI + industry-aware AI receptionist + booking copy alignment).  
**Mode:** Read-only verification; no code changes; no commit operations.

---

## 1) Evidence Run

- `git status --short` -> `?? docs/audit/VIONA_PACK_A_APEX_INDUSTRY_VERIFICATION.md` (expected: this new verification file only).
- `git log --oneline -12` -> includes:
  - `2231c16` fix(brand): align booking flow copy with VIONA terminology
  - `cc153b9` feat(ai-receptionist): add industry-aware setup and playbooks
  - `8200bc8` fix(ui): apply VIONA apex design system to public surfaces
  - `cd7e451` feat(miniapps): wire resolver into public entrypoints
  - `0675bb7` feat(miniapps): add registry resolver and entry hook
  - `7c1a79b` docs: add VIONA blueprint v2 operating protocol and UI audit
- `npm run typecheck` -> pass.
- `npm run lint` -> pass with **0 errors**, **50 warnings** (existing technical debt outside this verification scope).

---

## 2) Pass/Fail by Area

| Area | Result | Notes |
|---|---|---|
| Working tree clean (except requested audit file) | **PASS** | Only untracked file is this verification document. |
| Commit packaging present (6 commits) | **PASS** | All 6 expected commits are present in latest log. |
| `src/core/miniapps` foundation files are committed/tracked | **PASS** | Confirmed tracked files: `index.ts`, `miniAppRegistry.ts`, `miniAppRouteNavigation.ts`, `miniAppTypes.ts`, `presentMiniAppEntry.ts`, `resolveMiniAppEntry.ts`. |
| Typecheck | **PASS** | `tsc --noEmit` success. |
| Lint gate | **PASS (with warnings)** | 0 errors; 50 warnings remain in repo. |
| Mini-app resolver no silent fallback Home/TabHome/Tổng quan | **PASS** | `resolveMiniAppEntry` and `presentMiniAppEntry` explicitly state no silent fallback; resolver returns explicit states (`showGate/showComingSoon/showFrozen/showError/showDemoNotice/navigate`). |
| `useMiniAppEntry` import/usage safety (no undefined behavior) | **PASS** | `useMiniAppEntry` returns `openMiniApp`; call sites in `HomeScreen`, `LocalScreen`, `TravelScreen`, `AcademyScreen`, `DashboardB2CScreen` destructure it explicitly; typecheck passes. |
| Industry-aware AI Receptionist does not enable production call/payment/DB/booking mutation | **PASS** | Verified no Twilio/payment mutation calls in industry setup/demo/pilot screens; UI copy explicitly states no payment taken and no live autonomous booking/inventory/billing/payment capture. |
| Apex UI duplicate SOS risk in code | **PASS (no obvious duplicate render path)** | `MainTabNavigator` renders `SOSFloatingButton`; `SOSFloatingButton` delegates to one `SOSShieldComponent`. No additional simultaneous render path found in touched surfaces. |
| Public touched surfaces free from legacy labels (`ViGlobal`, `Kết Nối Global`, `VIG Token`, `VIG Tokens`, `VIG gate`) | **PASS** | No matches in touched public screens/components/i18n/service surfaces. |
| `ultraMasterBookingFlow` copy-only change | **PASS** | Commit `2231c16` only changes alert labels from `ViGlobal` to `VIONA`; no logic mutation. |

---

## 3) Remaining Direct Navigate Paths (Post Pack A Wiring)

The following direct navigation calls still exist in wired entrypoint files (expected mix of mini-app + non-mini-app routes):

### Home / Main shell
- `src/screens/HomeScreen.tsx`
  - `navigation.navigate('LeonaCall' | 'LiveInterpreter' | 'AdminDashboard' | 'LoyaltyRewards' | 'Login' | 'Tabs', ...)`
  - Some CTA paths use `openMiniApp(...)`; others remain direct by route intent.
- `src/navigation/MainTabNavigator.tsx`
  - direct paths for tab switches and role/paywall redirects (`navigation.navigate('Tabs', ...)`, `B2BPaywall`, `LiveInterpreter`, `LeonaCall`, etc.).

### B2C entry screens
- `src/screens/b2c/LocalScreen.tsx`
  - `VietnamHub`, `B2BPaywall`, `DailyReward` still direct; `local` and `b2cAiCallAssistant` already use `openMiniApp`.
- `src/screens/b2c/TravelScreen.tsx`
  - direct `MerchantDetail`, `LocalFixer`, `TravelFlightSearch`; interpreter CTA uses `openMiniApp`.
- `src/screens/b2c/DashboardB2CScreen.tsx`
  - `LoyaltyRewards` direct; `local/travel/academy` use `openMiniApp`.
- `src/screens/AcademyScreen.tsx`
  - `academy` path is via `openMiniApp`.

### Profile / onboarding touched surfaces
- `src/components/ProfileSwitcher.tsx`
  - `navigation.navigate('PersonalHub')` remains direct.
- `src/components/onboarding/DemoTriggerButton.tsx`
  - no direct navigate match found.
- `src/components/PersonaOnboardingModal.tsx`
  - no direct navigate match found.

**Interpretation:** resolver coverage is improved for core mini-app CTA lanes, but direct navigation remains for non-mini-app or shell control routes. This aligns with “Pack A foundation + wiring” but not full saturation.

---

## 4) Remaining Public Legacy Copy (If Any)

### In touched public surfaces
- No `ViGlobal`, `Kết Nối Global`, `VIG Token`, `VIG Tokens`, `VIG gate` found in touched public screen/component/i18n/service files from the 6 commits.

### In touched non-public/internal config surfaces
- `src/config/brandConfig.ts` -> `internalName: 'KNG'`
- `src/config/appBrand.ts` -> `internalName: 'KNG'`

### In broader repo (outside touched surfaces)
- Legacy `ViGlobal` / `VIG Token` / `KNG Travel` remains in many other files (services, travel screens not in this pack, comments, docs, legacy locales). Not a blocker for this verification scope but still commercialization risk.

---

## 5) Risk Before Push/PR

### Low/acceptable for this PR
- Commit packaging quality is good and logically separated.
- Build safety is preserved (typecheck pass, lint no errors).
- No payment/booking mutation/DB/Prisma/Twilio production enabling introduced in verified areas.

### Residual risk
1. **Resolver coverage incomplete**: direct `navigate(...)` still exists in several public flow files (by design in part, but still a drift surface).
2. **Legacy brand residue across repo**: not in touched public surfaces, but still present in wider codebase and some internal configs (`internalName: 'KNG'`).
3. **Lint debt**: 50 warnings remain, could hide future regressions.
4. **AI receptionist pilot is still non-production**: correct for current scope, but requires explicit ops hardening before commercialization.

---

## 6) Recommendation

**Recommendation: CONDITIONAL GO for PR review** (safe to open PR, not a production launch sign-off).

Required follow-ups:
1. **Pack A.2**: continue resolver saturation, especially remaining entrypoint direct navigations and role/deeplink edge cases.
2. **Brand cleanup wave**: remove remaining public legacy naming outside this PR scope.
3. **Pilot hardening**: AI receptionist manual ops evidence + environment verification.
4. **Commercial readiness gate**: keep payment/ledger/Stripe and booking mutation changes in separate approved packs only.

---

**Verifier conclusion:** The 6-commit package is structurally sound, scope-disciplined, and aligned with Pack A/Apex/Industry foundation goals, with known residual risks clearly bounded for next packs.

