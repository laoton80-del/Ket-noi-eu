# VIONA Pack A.2 Direct Navigate Cleanup Audit

## 1. Summary
- Direct `navigate(...)` paths audited in scope (`src/navigation`, `src/screens`, `src/components`): 194
- CTA paths wired to resolver in this pack: 8
- Direct navigation intentionally kept: 186
- Remaining risks:
  - Some user-facing CTAs are non-mini-app destinations by design (detail/auth/admin/tab infrastructure) and stay direct.
  - A few launcher-like entries do not map to a confirmed `miniAppId` and need registry decision before wiring.

## 2. Fixed CTA Paths
| File | Before | After | Reason |
|---|---|---|---|
| `src/screens/TravelCompanionScreen.tsx` | `navigate('LiveInterpreter', ...)` for quick action | `openMiniApp('minhKhangTranslator', () => navigate('LiveInterpreter', ...))` | User-facing mini-app CTA; now enforces gate/status instead of direct open. |
| `src/screens/TravelCompanionScreen.tsx` | `navigate('LeonaCall', ...)` for quick action | `openMiniApp('b2cAiCallAssistant', () => navigate('LeonaCall', ...))` | Demo/pilot AI call assistant now goes through resolver notice/gate path. |
| `src/screens/TravelCompanionScreen.tsx` | Scenario card action `navigate('LiveInterpreter', ...)` | `openMiniApp('minhKhangTranslator', () => navigate(...))` | Avoid silent direct entry for translator mini-app from scenario cards. |
| `src/screens/TravelCompanionScreen.tsx` | Scenario card action `navigate('LeonaCall', ...)` | `openMiniApp('b2cAiCallAssistant', () => navigate(...))` | Consistent resolver behavior for Leona CTA in travel scenarios. |
| `src/screens/TienIchScreen.tsx` | `navigate('TravelCompanion')` | `openMiniApp('travel', () => navigate('TravelCompanion'))` | Travel launcher card is user-facing mini-app entry. |
| `src/screens/TienIchScreen.tsx` | Radar fallback `navigate('LeonaCall', ...)` | `openMiniApp('b2cAiCallAssistant', () => navigate('LeonaCall', ...))` | Pilot fallback now explicit via resolver (demo/gate handling). |
| `src/screens/ServicesScreen.tsx` | `navigate('TravelCompanion')` | `openMiniApp('travel', () => navigate('TravelCompanion'))` | Travel launcher card is mini-app entry and should honor resolver gates. |
| `src/screens/ServicesScreen.tsx` | Radar fallback `navigate('LeonaCall', ...)` | `openMiniApp('b2cAiCallAssistant', () => navigate('LeonaCall', ...))` | Keeps current route while adding explicit mini-app gating/notice path. |

## 3. Intentionally Kept Direct Navigation
| File | Navigate target | Reason kept |
|---|---|---|
| `src/navigation/MainTabNavigator.tsx` | `Tabs`, role tab redirects | Tab infrastructure and navigator internals (must remain direct). |
| `src/screens/b2c/TravelScreen.tsx` | `MerchantDetail`, `LocalFixer`, `TravelFlightSearch` | Detail/flow routes with explicit params and domain-specific intent. |
| `src/screens/b2c/FlightSearchScreen.tsx` | `MerchantDetail`, `TravelHospitality` | Detail browsing/navigation flow, not mini-app entrypoint. |
| `src/components/ProfileSwitcher.tsx` | `PersonalHub` | Account/profile hub CTA, not a registry mini-app route. |
| `src/screens/LoginScreen.tsx`, `src/screens/OtpScreen.tsx` | auth route transitions | Auth lifecycle flow must remain direct. |
| `src/screens/admin/AdminDashboardScreen.tsx` and admin/b2b internal screens | admin/internal routes | Internal operations routes, not user mini-app launchers. |

## 4. Remaining Needs Confirmation
| File | CTA | Reason |
|---|---|---|
| `src/screens/TienIchScreen.tsx` | `LifeOSDashboard` launcher | No confirmed `miniAppId` mapping in registry; needs registry mapping decision. |
| `src/screens/ServicesScreen.tsx` | `LifeOSDashboard` launcher | No confirmed `miniAppId` mapping in registry; needs registry mapping decision. |
| `src/screens/TienIchScreen.tsx` / `src/screens/ServicesScreen.tsx` | `KetNoiYeuThuong` launcher | No registered mini-app ID for this destination; needs mapping confirmation. |
| `src/components/ProfileSwitcher.tsx` | `PersonalHub` role/profile CTA | Could stay direct as account hub; resolver wiring requires explicit product decision if treated as mini-app entry. |

## 5. Safety
- payment touched? no
- booking touched? no
- wallet touched? no
- DB/Prisma touched? no
- AI production touched? no
- route names changed? no
- feature flags changed? no

## 6. Validation
- `npm run typecheck` -> PASS
- `npm run lint` -> PASS (warnings only, no new errors)
- `npm run ci:release-discipline` -> PASS
