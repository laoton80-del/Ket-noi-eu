# VIONA — iOS EAS Development Build Execution Evidence

Operator authorization: `APPROVE_VIONA_IOS_EAS_DEVELOPMENT_BUILD_PREPARATION_EXECUTION`

Primary classification: `BLOCKED_APPLE_DEVELOPER_ACCOUNT_UNAVAILABLE`

## Markers

```text
VIONA_IOS_EAS_DEVELOPMENT_BUILD_EXECUTION
BLOCKED_APPLE_DEVELOPER_ACCOUNT_UNAVAILABLE
SOURCE_PREFLIGHT_GREEN
EAS_ACCOUNT_AUTHENTICATED
NO_APPLE_TEAM_FOR_EXPO_ACCOUNT
NO_DEVICE_REGISTRATION_ATTEMPTED_WITHOUT_TEAM
NO_EAS_IOS_BUILD_STARTED
NO_SOURCE_CONFIG_NATIVE_CHANGE
NO_FUNCTIONS_TSC_DEBT_REMEDIATION
NO_PRODUCTION_SUBMIT_OR_DEPLOY
PHASE_C_CLOSED_GREEN_PRESERVED
IOS_PHASE_D2_NOT_AUTHORIZED
PACK40DR_PRESERVED
PACK40S_NOT_AUTHORIZED
```

## 1. Canonical source

| Field | Value |
|---|---|
| Canonical root | `C:\KNG\ket-noi-eu` |
| Branch at execution | `master` |
| Source commit | `db6c878bc7a6d32a0c667956895128c7e7c2a014` |
| Contains | PR #406 + #407 + #408 |
| Working tree | clean before EAS access probes |

## 2. Source / release preflight

| Check | Result |
|---|---|
| `npm run ci:expo-readiness` | **PASS** |
| `npm run ci:release-discipline` | **PASS** |
| `npx expo install --check` | Dependencies are up to date |
| `npx expo-doctor` | 17/18 — Directory advisories only |
| Public Expo config | Resolves; WebRTC plugin present |

### Package state

| Package | Version |
|---|---|
| expo | 54.0.36 / ~54.0.36 |
| expo-updates | 29.0.19 / ~29.0.19 |
| expo-localization | 17.0.9 / ~17.0.9 |
| expo-dev-client | 6.0.21 |
| react-native-webrtc | 124.0.7 |
| @config-plugins/react-native-webrtc | 13.0.0 |

### Directory advisories (not Phase-C regressions)

- `react-native-compressor` — Untested on New Architecture
- `expo-live-activity` — Unmaintained

### EAS profile (`eas.json`)

- `development`: `developmentClient: true`, `distribution: internal`
- Bundle ID: `com.ketnoiglobal.app`
- Scheme: `ketnoiglobal`
- No local Prebuild required / not run

## 3. EAS account / project access

| Field | Result |
|---|---|
| EAS CLI | `eas-cli/21.0.2` |
| Authentication | Authenticated Expo account with access to configured project |
| Project | Canonical EAS project ID matches `app.config` / Expo dashboard linkage |
| Identity / tokens | **Not recorded** |

Classification: Expo account/project access **available**.

## 4. Apple Developer gate

Command:

```text
npx eas-cli@latest device:list
```

Result:

```text
No Apple teams found for account <authenticated Expo account>.
Error: device:list command failed.
```

| Field | Result |
|---|---|
| Apple team for `com.ketnoiglobal.app` | **Unavailable** via authenticated Expo account |
| Device registration | **Not started** (requires Apple team) |
| Signing credentials create/reuse | **Not attempted** |
| Apple ID / team personal details / UDIDs | **Not recorded** |

Classification: `BLOCKED_APPLE_DEVELOPER_ACCOUNT_UNAVAILABLE`

## 5. Build / install / boot

| Step | Status |
|---|---|
| iOS EAS development build | **Not started** |
| Sanitized build ID | N/A |
| Installation | N/A |
| Developer Mode | N/A |
| Minimal Metro / dev-client boot | N/A |

## 6. Confirmations

- No `src/**`, `functions/**`, packages, `app.config.js`, `eas.json`, or native directory changes
- Pre-existing Functions TypeScript debt **not** modified
- No production submit / Firebase / Functions / staging deploy
- Phase C remains closed green
- iOS Phase D2 remains **unauthorized** and **not run**

## 7. Exact changed paths (this evidence pack)

- `docs/product/VIONA_IOS_EAS_DEVELOPMENT_BUILD_EXECUTION_EVIDENCE.md`
- `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`
- `Handoff_VIONA11726.txt`

## 8. Next operator action

Link or create an Apple Developer team on the authenticated Expo account (or authenticate the Expo account that already owns the team for `com.ketnoiglobal.app`), then re-authorize this EAS iOS development-build pack.

## 9. Final classification

`BLOCKED_APPLE_DEVELOPER_ACCOUNT_UNAVAILABLE`
