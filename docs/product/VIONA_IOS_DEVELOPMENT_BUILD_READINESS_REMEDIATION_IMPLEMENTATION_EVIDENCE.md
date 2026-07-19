# VIONA — iOS Development Build Readiness Remediation Implementation Evidence

Operator authorization: `APPROVE_VIONA_IOS_DEVELOPMENT_BUILD_READINESS_REMEDIATION_IMPLEMENTATION`

Primary classification: `READY_FOR_VIONA_IOS_BUILD_READINESS_REMEDIATION_PR_REVIEW`

## Markers

```text
VIONA_IOS_DEVELOPMENT_BUILD_READINESS_REMEDIATION_IMPLEMENTATION
CLIENT_SAFE_LOCAL_CONTRACT_LANDED
MOBILE_PRISMA_RUNTIME_REACHABILITY_REMOVED
REMOVE_OR_FAIL_CLOSED_PUBLIC_DEV_JWT_CLIENT_FALLBACK
IOS_WEBRTC_CONFIG_PLUGIN_ADDED
EXPO_PATCH_ALIGNED
NO_PREBUILD
NO_EAS_BUILD
NO_DEVICE_REGISTRATION
PHASE_C_CLOSED_GREEN_PRESERVED
IOS_PHASE_D2_NOT_AUTHORIZED
PACK40DR_PRESERVED
PACK40S_NOT_AUTHORIZED
```

## 1. Baseline

| Field | Value |
|---|---|
| origin/master baseline | `211536f2deb9d9c1061a29b5b5b9065454eecfed` (PR #405) |
| Branch | `feat/viona-ios-development-build-readiness-remediation` |
| Canonical root | `C:\KNG\ket-noi-eu` |
| Phase C | closed green preserved |
| iOS Phase D2 | **NOT AUTHORIZED** |

## 2. Client-safe contract

Path: `src/domain/local/localServiceRequestClientContract.ts`

- Const objects + string unions for `LocalServiceRequestStatus`, `LocalWalletMode`, `LocalWalletPhase`
- Values match Prisma/REST wire strings exactly (verified by `scripts/test-local-service-request-client-contract.ts`)
- No Prisma, DB, network, payment, or settlement authority

## 3. Prisma mobile reachability removed

### Direct (removed)

1. `src/screens/b2b/localMerchantInboxUi.ts`
2. `src/screens/b2c/localUserRequestStatusUi.ts`

### Indirect (removed)

3. `src/services/local/localMerchantInboxView.ts`
4. `src/services/local/localUserRequestCancelEligibility.ts`
5. `src/services/local/localMerchantRequestConfirmEligibility.ts`
6. `src/services/local/localMerchantRequestRejectEligibility.ts`

Backend Local services retain `@prisma/client`. REST DTO wire values unchanged (string status/wallet fields).

Regression: `scripts/check-mobile-no-prisma-client.ts` + `git grep` on mobile roots — clean.

## 4. Public DEV JWT fallback

- Removed `getDevJwtOverride()` / `EXPO_PUBLIC_DEV_REST_JWT` from `src/services/apiClient.ts`
- Session JWT from AsyncStorage only; missing JWT → no `Authorization` header (existing unauthenticated path)
- Alert/doc copy cleaned in `LocalScreen.tsx`, `ultraMasterBookingFlow.ts`, `b2bAccess.ts` (no executable env JWT reference)
- Verification: `git grep` on `src` / `App.tsx` / `index.ts` / `app.config.js` → no executable client reference
- Canonical expectation: `REMOVE_OR_FAIL_CLOSED_PUBLIC_DEV_JWT_CLIENT_FALLBACK`

## 5. WebRTC config plugin

- Package: `@config-plugins/react-native-webrtc@13.0.0`
- Added to `app.config.js` plugins array
- `npx expo config --type public` resolves plugin
- No Prebuild / CocoaPods / Xcode / EAS build

## 6. Expo patch alignment

| Package | Final |
|---|---|
| `expo` | `~54.0.36` / `54.0.36` |
| `expo-updates` | `~29.0.19` / `29.0.19` |

## 7. Validation

| Check | Result |
|---|---|
| `npx tsc --noEmit` | OK |
| Local UI display tests | OK |
| Client contract + eligibility tests | OK |
| apiClient no public DEV JWT | OK |
| Mobile Prisma boundary check | OK |
| Modern Home Phase A/B/C | OK |
| SOS Phase-1 | OK |
| Profile/Language Phase-2 | OK |
| `npm run smoke` | OK |
| `npx expo install --check` | advisory: `expo-localization` 17.0.8 → ~17.0.9 (out of pack scope) |
| `npx expo-doctor` | 16/18 — Directory advisory (compressor New Arch untested; expo-live-activity unmaintained) + expo-localization patch advisory |

Doctor/Directory advisories recorded separately; not treated as Phase C regressions.

## 8. Forbidden actions confirmation

Did **not**: expo prebuild, EAS device/build/submit, ios/android native edits, Phase D2, production deploy, Prisma schema/migration changes, API/payment/SOS/booking behavior changes.

## 9. Exact changed paths

- `src/domain/local/localServiceRequestClientContract.ts` (new)
- `src/screens/b2b/localMerchantInboxUi.ts`
- `src/screens/b2c/localUserRequestStatusUi.ts`
- `src/screens/b2c/LocalScreen.tsx` (JWT alert copy)
- `src/services/local/localMerchantInboxView.ts`
- `src/services/local/localUserRequestCancelEligibility.ts`
- `src/services/local/localMerchantRequestConfirmEligibility.ts`
- `src/services/local/localMerchantRequestRejectEligibility.ts`
- `src/services/apiClient.ts`
- `src/services/ultraMasterBookingFlow.ts` (JWT alert copy)
- `src/utils/b2bAccess.ts` (comment / unlock docs)
- `scripts/test-local-user-request-status-ui-display.ts`
- `scripts/test-local-merchant-inbox-ui-display.ts`
- `scripts/test-local-service-request-client-contract.ts` (new)
- `scripts/test-local-request-eligibility-client-contract.ts` (new)
- `scripts/test-api-client-no-public-dev-jwt.ts` (new)
- `scripts/check-mobile-no-prisma-client.ts` (new)
- `package.json`
- `package-lock.json`
- `app.config.js`
- `docs/product/VIONA_IOS_DEVELOPMENT_BUILD_READINESS_REMEDIATION_IMPLEMENTATION_EVIDENCE.md`
- `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`
- `Handoff_VIONA11726.txt`

## 10. Final classification

`READY_FOR_VIONA_IOS_BUILD_READINESS_REMEDIATION_PR_REVIEW`
