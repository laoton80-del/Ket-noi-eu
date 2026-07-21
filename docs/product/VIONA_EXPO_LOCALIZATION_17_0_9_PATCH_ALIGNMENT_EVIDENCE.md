# VIONA — Expo Localization 17.0.9 Patch Alignment Evidence

Operator authorization: `APPROVE_VIONA_EXPO_LOCALIZATION_17_0_9_PATCH_ALIGNMENT`

Primary classification: `READY_FOR_VIONA_EXPO_LOCALIZATION_17_0_9_PATCH_PR_REVIEW`

## Markers

```text
VIONA_EXPO_LOCALIZATION_17_0_9_PATCH_ALIGNMENT
NO_EXPO_SDK_PACKAGE_VERSION_MISMATCH
DIRECTORY_ADVISORIES_RECORDED_SEPARATELY
NO_SOURCE_BEHAVIOR_CHANGE
NO_PREBUILD
NO_EAS_BUILD
NO_DEVICE_REGISTRATION
PHASE_C_CLOSED_GREEN_PRESERVED
IOS_PHASE_D2_NOT_AUTHORIZED
EAS_IOS_DEVELOPMENT_BUILD_NOT_AUTHORIZED
PACK40DR_PRESERVED
PACK40S_NOT_AUTHORIZED
```

## 1. Baseline

| Field | Value |
|---|---|
| origin/master | `f21a7506785ae7ea35638195b1e2e14b913f7b7b` (PR #406 merged) |
| Branch | `chore/viona-expo-localization-17-0-9-patch-alignment` |
| Canonical root | `C:\KNG\ket-noi-eu` |

## 2. Pre-change package versions

| Package | Version |
|---|---|
| expo | 54.0.36 |
| expo-updates | 29.0.19 |
| expo-localization | 17.0.8 |

Pre-change: `npx expo install --check` reported `expo-localization@17.0.8` expected `~17.0.9`.

Pre-change Doctor: 16/18 — Directory advisories + SDK package mismatch.

## 3. Installation command

```text
npx expo install expo-localization@~17.0.9
```

## 4. package.json delta

```text
expo-localization: ~17.0.8 → ~17.0.9
```

No other direct dependency changes.

## 5. package-lock delta classification

| Entry | Change |
|---|---|
| root `dependencies.expo-localization` | `~17.0.8` → `~17.0.9` |
| `node_modules/expo-localization` version | `17.0.8` → `17.0.9` |
| resolved tarball + integrity | updated to 17.0.9 only |

Classification: **targeted single-package patch only** (4 insertions / 4 deletions). No unrelated transitive drift.

Preserved unchanged:

- expo 54.0.36
- expo-updates 29.0.19
- @config-plugins/react-native-webrtc 13.0.0
- expo-dev-client 6.0.21
- react-native-webrtc 124.0.7

## 6. Final package versions

| Package | Version |
|---|---|
| expo | 54.0.36 |
| expo-updates | 29.0.19 |
| expo-localization | 17.0.9 |

## 7. Post-change Expo checks

| Check | Result |
|---|---|
| `npx expo install --check` | **Dependencies are up to date** → `NO_EXPO_SDK_PACKAGE_VERSION_MISMATCH` |
| `npx expo-doctor` | **17/18** — remaining failure is React Native Directory only |
| `npx expo config --type public` | Resolves; WebRTC plugin present; scheme/bundle IDs unchanged |

## 8. Remaining Directory advisories (not Phase-C regressions)

- `react-native-compressor` — Untested on New Architecture
- `expo-live-activity` — Unmaintained

No Doctor exclusions added.

## 9. Regression gates

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | OK |
| `npm run smoke` | OK |
| Modern Home Phase A/B/C | OK |
| SOS Phase-1 | OK |
| Profile/Language Phase-2 | OK |
| Local contract / eligibility / UI | OK |
| apiClient no public DEV JWT | OK |
| `check-mobile-no-prisma-client` | OK |
| Executable `EXPO_PUBLIC_DEV_REST_JWT` grep | none |
| Mobile `@prisma/client` grep | none |

## 10. Exact changed paths

- `package.json`
- `package-lock.json`
- `docs/product/VIONA_EXPO_LOCALIZATION_17_0_9_PATCH_ALIGNMENT_EVIDENCE.md`
- `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`
- `Handoff_VIONA11726.txt`

## 11. Forbidden actions confirmation

Did **not**: modify `src/**`, `app.config.js`, `eas.json`, ios/android, run Prebuild, EAS device/build/submit, Phase D2, or deploy.

## 12. Final classification (patch pack)

`READY_FOR_VIONA_EXPO_LOCALIZATION_17_0_9_PATCH_PR_REVIEW`

---

## 13. PR #407 bounded Expo readiness policy sync

Operator authorization: `APPROVE_VIONA_PR407_BOUNDED_EXPO_READINESS_POLICY_SYNC`

Original PR head: `eacc445f32f7026052a76e6ea2acd778cc9a8ccb`

### Original CI failure (`npm run ci:expo-readiness`)

Deterministic hardcoded policy mismatch in `scripts/expo-readiness-check.mjs`:

| Package | Stale expected | Found |
|---|---|---|
| expo | `~54.0.34` | `~54.0.36` |
| expo-localization | `~17.0.8` | `~17.0.9` |
| expo-updates | `~29.0.17` | `~29.0.19` |

Expo public config still resolved; failure was policy-only (not WebRTC/secrets/Functions).

### Corrected expectations (strict equality retained)

| Package | Corrected expected |
|---|---|
| expo | `~54.0.36` |
| expo-localization | `~17.0.9` |
| expo-updates | `~29.0.19` |

Gate remains strict: any incorrect approved pin still fails the check. No wildcards, exclusions, or suppressed failures.

### Stale-string search classification

| Occurrence | Class | Action |
|---|---|---|
| `scripts/expo-readiness-check.mjs` | EXECUTABLE_CI_POLICY | Updated |
| `docs/audit/VIONA_CI_STABILITY_FOLLOWUP_AUDIT.md` | HISTORICAL_EVIDENCE | Left unchanged |
| `docs/design/evidence/cursor-pack32-4-...` | HISTORICAL_EVIDENCE | Left unchanged |
| Pre-change lines in this evidence file | HISTORICAL_EVIDENCE | Left unchanged |
| `package.json` `expo-local-authentication ~17.0.8` | unrelated package | Not touched |

### Gate results after policy sync

| Check | Result |
|---|---|
| `npm run ci:expo-readiness` | **PASS** |
| `npx expo install --check` | Dependencies are up to date |
| TypeScript / smoke / Phase A/B/C / SOS / Profile / Local / JWT / Prisma boundary | **OK** |
| `package.json` / `package-lock.json` | **unchanged** |
| `npm run ci:release-discipline` | **FAIL** — unrelated `functions/lib` bundle parity drift after rebuild (VIO display labels pulled into `functions/lib/index.js`). Dirty rebuild output discarded; not part of this pack. |

### Policy-sync changed paths

- `scripts/expo-readiness-check.mjs`
- `docs/product/VIONA_EXPO_LOCALIZATION_17_0_9_PATCH_ALIGNMENT_EVIDENCE.md`
- `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`
- `Handoff_VIONA11726.txt`

### Policy-sync classification

`BLOCKED_ADDITIONAL_CI_FAILURE` — Expo readiness policy sync is complete and strict; merge remains blocked until a separately authorized Functions bundle-parity remediation lands (out of this pack scope).

Confirmations: no dependency/source/native/runtime product changes; no Prebuild/EAS/device/deploy; Phase C closed green; EAS iOS build unauthorized; Phase D2 unauthorized.
