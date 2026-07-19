# VIONA — iOS Development Build Readiness Import-Graph Audit

Operator authorization: `APPROVE_VIONA_IOS_DEVELOPMENT_BUILD_READINESS_IMPORT_GRAPH_AUDIT`

Primary classification: `READY_FOR_VIONA_IOS_DEVELOPMENT_BUILD_READINESS_REMEDIATION_IMPLEMENTATION`

## Markers

```text
VIONA_IOS_DEVELOPMENT_BUILD_READINESS_IMPORT_GRAPH_AUDIT
CLIENT_RUNTIME_PRISMA_IMPORT_CONFIRMED
CLIENT_SAFE_DOMAIN_BOUNDARY_DESIGNED
PUBLIC_DEV_JWT_EMPTY_BUT_CLIENT_REFERENCED
IOS_WEBRTC_CONFIG_PLUGIN_REQUIRED
IOS_PERMISSION_COPY_UTF8_VALID
EXPO_PATCH_MISMATCH_RECORDED
NO_PACKAGE_INSTALL
NO_PREBUILD
NO_EAS_BUILD
PHASE_C_CLOSED_GREEN_PRESERVED
IOS_PHASE_D2_NOT_AUTHORIZED
PACK40DR_PRESERVED
PACK40S_NOT_AUTHORIZED
```

## 1. Baseline

| Field | Value |
|---|---|
| origin/master | `f5a070652d57d659cb12cc9740d8ae19444c394f` |
| Contains | PR #396–#404 |
| Branch | `docs/viona-ios-development-build-readiness-import-graph-audit` |
| Canonical root | `C:\KNG\ket-noi-eu` |
| Phase C | closed green preserved |
| iOS Phase D2 | **NOT AUTHORIZED** |

Mobile entry roots inspected:

- `index.ts` → `App.tsx`
- React Navigation stack in `App.tsx` (not Expo Router for primary app)
- Screens: `LocalUserRequestStatusScreen`, `LocalMerchantRequestInboxScreen`, `CallScreen` / Leona call
- No separate Expo Router mobile Home root for Local inbox

## 2. Audit A — Mobile Prisma reachability

### Proven mobile → Prisma paths

```text
App.tsx
  ├─ LocalUserRequestStatusScreen
  │    ├─ ./localUserRequestStatusUi          → @prisma/client enums (runtime)
  │    │    └─ localUserRequestCancelEligibility → @prisma/client enums (runtime)
  │    └─ localUserRequestApi                 → CLIENT_SAFE_NO_PRISMA (REST strings)
  │
  └─ LocalMerchantRequestInboxScreen
       ├─ ./localMerchantInboxUi              → @prisma/client enums (runtime)
       │    └─ localMerchantInboxView         → @prisma/client enums (runtime)
       │         ├─ localMerchantRequestConfirmEligibility → @prisma/client
       │         └─ localMerchantRequestRejectEligibility  → @prisma/client
       └─ localMerchantInboxApi               → CLIENT_SAFE_NO_PRISMA (REST strings)

Also mounted via components:
  LocalUserRequestStatusCard → localUserRequestStatusUi
  LocalMerchantRequestStatusCard → localMerchantInboxUi
```

### Runtime Prisma enums confirmed in native bundle candidates

| Enum | Entered via |
|---|---|
| `LocalServiceRequestStatus` | UI + eligibility modules (runtime `switch` / `Set`) |
| `LocalWalletMode` | UI + eligibility modules |
| `LocalWalletPhase` | UI + eligibility modules |

These are **value** imports (not `import type`), so Metro treats them as runtime dependencies on `@prisma/client`.

### Classification table (mobile-relevant)

| Module | Classification |
|---|---|
| `src/screens/b2b/localMerchantInboxUi.ts` | `CLIENT_RUNTIME_PRISMA_IMPORT` |
| `src/screens/b2c/localUserRequestStatusUi.ts` | `CLIENT_RUNTIME_PRISMA_IMPORT` |
| `src/services/local/localMerchantInboxView.ts` | `CLIENT_RUNTIME_PRISMA_IMPORT` |
| `src/services/local/localUserRequestCancelEligibility.ts` | `CLIENT_RUNTIME_PRISMA_IMPORT` |
| `src/services/local/localMerchantRequestConfirmEligibility.ts` | `CLIENT_RUNTIME_PRISMA_IMPORT` |
| `src/services/local/localMerchantRequestRejectEligibility.ts` | `CLIENT_RUNTIME_PRISMA_IMPORT` |
| `src/services/localMerchantInboxApi.ts` | `CLIENT_SAFE_NO_PRISMA` |
| `src/services/localUserRequestApi.ts` | `CLIENT_SAFE_NO_PRISMA` |
| `src/lib/prisma.ts` / controllers / repositories / `getPrisma` services | `SERVER_ONLY_NOT_REACHABLE_FROM_MOBILE` (not imported from `App.tsx` screen graph above) |
| `src/services/fintech/WalletService.ts` | `CLIENT_SAFE_NO_PRISMA` (HTTP/Supabase client; distinct from `src/services/WalletService.ts`) |

### Direct vs indirect

| Kind | Count / notes |
|---|---|
| Direct screen imports of `@prisma/client` | **2** (`localMerchantInboxUi`, `localUserRequestStatusUi`) |
| Indirect (transitive) Prisma enum modules | **4** (`localMerchantInboxView`, cancel/confirm/reject eligibility) |
| Replacing only the two screen files | **NOT sufficient** — eligibility + inbox view still pull `@prisma/client` |

Metro warning previously observed on Android native load (`@prisma/client` exports platform=android) is consistent with this graph.

## 3. Audit B — Client-safe domain remediation design (do not implement)

### Goal

Remove `@prisma/client` from all modules reachable from mobile Local UI while keeping REST DTOs and server Prisma authority unchanged.

### Proposed client-safe representations

Use **string literal unions + const objects** (not Prisma enums), matching existing REST DTO `status` / `walletMode` / `walletPhase` **strings** in `localUserRequestApi` / `localMerchantInboxApi`.

Proposed module paths (future pack):

1. `src/domain/local/localServiceRequestClientContract.ts`
   - `LOCAL_SERVICE_REQUEST_STATUS` const object + `LocalServiceRequestStatusClient` union
   - `LOCAL_WALLET_MODE` / `LOCAL_WALLET_PHASE` likewise
2. Keep pure eligibility functions in place but retyped to client contract (or move to `src/domain/local/eligibility/*` without Prisma).
3. UI modules import **only** the client contract.
4. Server Prisma services continue to use `@prisma/client`; REST serializers map Prisma → string DTO (already string on wire).

### Mapping responsibility

| Layer | Owner |
|---|---|
| DB / Prisma enums | server services / repositories |
| REST JSON strings | API controllers / serializers |
| Client display / eligibility | client contract + UI |

### Backend compatibility

No API shape change required if wire values already equal Prisma enum string values.

### Regression tests (future pack)

- Assert mobile roots / Local UI modules do **not** contain `@prisma/client` or `getPrisma`.
- Existing Local UI display/eligibility tests retargeted to client contract.

### Exact expected future changed files (estimate)

- `src/domain/local/localServiceRequestClientContract.ts` (new)
- `src/screens/b2b/localMerchantInboxUi.ts`
- `src/screens/b2c/localUserRequestStatusUi.ts`
- `src/services/local/localMerchantInboxView.ts`
- `src/services/local/localUserRequestCancelEligibility.ts`
- `src/services/local/localMerchantRequestConfirmEligibility.ts`
- `src/services/local/localMerchantRequestRejectEligibility.ts`
- related tests under `scripts/` or existing Local UI tests
- **not** Prisma schema / migrations / controllers (unless a serializer gap is found)

## 4. Audit C — Public JWT

| Check | Result |
|---|---|
| Local length probe | `EXPO_PUBLIC_DEV_REST_JWT_EMPTY` |
| Executable client reference | **YES** — `src/services/apiClient.ts` `getDevJwtOverride()` |
| Also mentioned | `src/utils/b2bAccess.ts` (docs comment); `LocalScreen.tsx` alert copy string |
| Tests / scripts / docs | many runbooks; documentation only |

**Classification:** `PUBLIC_DEV_JWT_REFERENCED_BY_CLIENT`

Value is **empty** locally (safe for now). Non-empty would require rotation/removal even if unused. Future remediation may keep optional empty override or gate harder; not blocking this audit as credential risk while empty.

## 5. Audit D — Server-secret source references

| Secret | Mobile-reachable? | Notes |
|---|---|---|
| `DATABASE_URL` | No from App graph | `src/lib/prisma.ts` server |
| `DIRECT_URL` | No | env only |
| `STRIPE_SECRET_KEY` | No from App graph | `src/config/env.ts`, stripe gate — server/controller paths |
| `OPENAI_API_KEY` | No from App graph | AI router / adapters via server |
| `AWS_*` | No from App graph | Email/Storage server |
| `JWT_SECRET` | No from App graph | Auth middleware / SignalingServer via `server.ts` |
| `TWILIO_*` | No from App graph | not referenced in mobile screens |

`app.config.js` does **not** inject these into Expo `extra`. Dotenv may load them into the Node process for Metro/doctor; that is **not** the same as bundling into the app unless referenced by mobile modules.

## 6. Audit E — EAS CNG / WebRTC

| Check | Result |
|---|---|
| `/ios`, `/android` in `.gitignore` | **YES** |
| `.easignore` | **NONE** — EAS upload still excludes gitignored dirs by default for CNG workflows |
| `eas.json` `development` | `developmentClient: true`, `distribution: internal` → expects Prebuild/CNG for native |
| `newArchEnabled` | **true** |
| `react-native-webrtc` in app plugins | **false** (15 plugins; no webrtc plugin) |
| Package | `react-native-webrtc@124.0.7` present |
| Official config plugin matrix | Expo **54** → `@config-plugins/react-native-webrtc@13.0.0` (table lists webrtc `124.0.6`; repo has `124.0.7`) |
| Latest plugin `15.0.1` peer | `expo ^56` — **wrong** for this repo |

**WebRTC classification:** `IOS_WEBRTC_CONFIG_PLUGIN_REQUIRED`

Future remediation (not this pack): install/add `@config-plugins/react-native-webrtc@13.0.0` to `app.config.js` plugins; rebuild dev client. New Architecture: react-native-webrtc not flagged by Directory for New Arch in current doctor output (compressor / expo-live-activity are); treat physical iOS WebRTC as a post-build smoke risk.

## 7. Audit F — UTF-8 permission copy

Node UTF-8 read of `app.config.js` → `expo.ios.infoPlist` and plugin permission strings shows valid Vietnamese (e.g. “Ứng dụng cần…”).

| Key | Status |
|---|---|
| `NSCameraUsageDescription` | valid UTF-8 |
| `NSMicrophoneUsageDescription` | valid UTF-8 |
| `NSLocationWhenInUseUsageDescription` | valid UTF-8 |
| Face ID (`expo-local-authentication` plugin) | valid UTF-8 |

**Classification:** `IOS_PERMISSION_COPY_UTF8_VALID`

(PowerShell mojibake in some terminals is display-only; Node JSON is authoritative.)

## 8. Audit G — Expo patch alignment

| Package | Found | Expected (expo install --check) |
|---|---|---|
| `expo` | 54.0.35 | ~54.0.36 |
| `expo-updates` | 29.0.18 | ~29.0.19 |

Smallest future command (do **not** run in this audit):

```text
npx expo install expo@~54.0.36 expo-updates@~29.0.19
```

`npx expo-doctor`: 16/18 passed; failures = Directory advisory (compressor untested New Arch; expo-live-activity unmaintained) + patch mismatch above. Recorded separately; not treated as audit failure by themselves.

## 9. Automated gates (read-only)

| Suite | Result |
|---|---|
| Phase C / B / A Modern Home | **OK** |
| SOS Phase-1 + left-rail | **OK** |
| Profile/Language Phase-2 | **OK** |
| `npx tsc --noEmit` | **OK** |
| `npm run smoke` | **OK** |

## 10. Bounded remediation order (recommended next pack)

1. Client-safe Local status/wallet contract + remove Prisma from six mobile-reachable modules.
2. Add `@config-plugins/react-native-webrtc@13` to Expo plugins (CNG).
3. Align `expo` / `expo-updates` patch versions.
4. Optionally harden/remove empty `EXPO_PUBLIC_DEV_REST_JWT` client override after Local/JWT policy review.
5. Then authorize iOS development EAS build / device registration (separate packs). **Not** Phase D2.

## 11. Forbidden actions confirmation

This audit did **not**: npm install, expo install, prebuild, eas device/build/submit, deploy, source edits, lockfile edits.

## 12. Final classification

`READY_FOR_VIONA_IOS_DEVELOPMENT_BUILD_READINESS_REMEDIATION_IMPLEMENTATION`
