# VIONA — Mobile Profile and Language Contextualization Phase 2 Evidence

Operator authorization: `APPROVE_VIONA_MOBILE_PROFILE_LANGUAGE_CONTEXTUALIZATION_PHASE_2`

Packet classification: `READY_FOR_VIONA_MOBILE_PROFILE_LANGUAGE_CONTEXTUALIZATION_PR_REVIEW`

## Markers

```text
VIONA_MOBILE_PROFILE_LANGUAGE_CONTEXTUALIZATION_PHASE_2
LEGACY_FLOATING_PROFILE_LANGUAGE_REMOVED
SHELL_ACCOUNT_LANGUAGE_HOSTS_INTEGRATED
EXACT_ONE_HOST_MATRIX
SOS_PHASE_1_PRESERVED
LEFT_RAIL_SOS_PRESERVED
WAVE_2_NATIVE_DEVICE_CONFIDENCE_REMAINS_NOT_RUN
PACK40DR_WAIT_FOR_NATURAL_STRANDED_ATTEMPT_PRESERVED
PACK40S_NOT_AUTHORIZED
NOT_CLOSED_ON_MASTER_UNTIL_MERGE
```

## 1. Baseline

| Field | Value |
|---|---|
| Canonical root | `C:\KNG\ket-noi-eu` |
| Branch | `feat/viona-mobile-profile-language-contextualization-phase-2` |
| origin/master at start | `e14110406a56028304ac316f556051dcbcc999f0` |
| SOS Phase 1 combined classification on master | `VIONA_MOBILE_SOS_SHELL_PHASE_1_CLOSED_GREEN_ON_MASTER` (PR #392 + #393 + docs #394) |

## 2. Pre-change source audit (completed before edits)

1. **ProfileSwitcher production importers:** only `src/navigation/MainTabNavigator.tsx`.
2. **SmartTrioLanguageChip production importers:** only `src/components/ProfileSwitcher.tsx` (`floating` + `sheet`).
3. **Profile/account mount chain (before):** absolute floating chips in `ProfileSwitcher` → role modal / `PersonalHub` via `navigation.navigate('PersonalHub')`; fashion Home via `HomeCommand.openAccount`.
4. **Language mount chain (before):** floating `SmartTrioLanguageChip` when single-role; sheet chip inside role modal; fashion/`Local`/`Travel`/`Academy`/`MiniAppShell` own `SmartTrioLanguageSheet` / rail language.
5. **Role-switching owner:** `useUserStore.switchRole` (+ vig gates) via `ProfileSwitcher` modal and `HomeCommand.openRolePicker`.
6. **Locale owner / persistence:** `SmartTrioContext` + `SmartTrioLanguageSheet` (on-device Smart Trio preview); CaNhan also has separate language UI via `persistUserLanguage`.
7. **Mobile contextual host candidates:** bottom-tab chrome (alongside SOS), Local/Travel/Academy rails (already own account/language).
8. **Desktop contextual host candidates:** left-rail chrome (operators), fashion Home command bar (already owns account/language/SOS).
9. **Signed-out behavior:** unchanged — PersonalHub / auth paywall paths preserved via existing navigation.
10. **B2C/B2B/Broker/Admin:** B2C Home uses bottom chrome hosts; Local/Travel/Academy suppress chrome (rails own); fashion desktop suppresses chrome (command bar owns); B2B/Broker/Admin use left-rail chrome hosts with SOS.
11. **Proposed profile host:** `VionaShellAccountLanguageActions` in bottom-tab / left-rail chrome; `ProfileSwitcher` retained for modals + ref only.
12. **Proposed language host:** same chrome actions → `SmartTrioLanguageSheet` mounted when fashion shell **or** chrome SOS host gate is active.
13. **Production file allowlist:** `MainTabNavigator.tsx`, `ProfileSwitcher.tsx`, `VionaShellAccountLanguageActions.tsx` (new), Phase-2 test script, evidence MD, Kernel/Handoff — **no** SOS source changes.
14. **Test / responsive QA matrix:** Phase-2 contract script + SOS Phase-1 + left-rail remediation scripts; browser 390/430/768/1024/1366.
15. **SOS Phase-1 preservation boundary:** do not modify `SOSFloatingButton`, `VionaGlobalSosShellAction`, SOS visibility helpers, `SOSModal`, `EmergencySOS`, bottom/left-rail SOS hosts, hold duration, or SOS a11y.

Helper note: no separate visibility helper file was recreated — chrome account/language mount reuses the existing `shouldMountSosInTabBarShell` gate (same exact-one surface matrix as SOS).

## 3. Implementation summary

| Change | Detail |
|---|---|
| New | `src/components/viona/VionaShellAccountLanguageActions.tsx` — Account / Language / optional Role in tab chrome |
| `MainTabNavigator` | Always `suppressFloatingChrome` on `ProfileSwitcher`; mount shell actions in bottom + left-rail hosts; expand `SmartTrioLanguageSheet` to chrome surfaces |
| `ProfileSwitcher` | Floating presentation remains gated; modals + imperative `openPersonalHub` / `openRolePicker` preserved |
| Tests | `scripts/test-viona-mobile-profile-language-contextualization-phase-2.ts` |

## 4. Exact-one host matrix

| Surface | Profile/account host | Language host | Shell chrome actions |
|---|---|---|---|
| B2C Home (≤768 / non-fashion) | Bottom chrome Account | Bottom chrome → sheet | Mounted |
| B2C Local | Local utility rail | Local rail sheet | Suppressed (tab bar hidden by Local) |
| B2C Travel | Travel rail | Travel rail sheet | Suppressed |
| B2C Academy | Academy rail | Academy sheet | Suppressed |
| Fashion desktop Home | Command bar Account | Command bar → sheet | Suppressed |
| B2B / Broker / Admin desktop | Left-rail chrome | Left-rail → sheet | Mounted with SOS |

## 5. Capability preservation

| Capability | Result |
|---|---|
| Account → PersonalHub | PASS — shell Account @ 390 → `/account` (`PersonalHub`) |
| Language sheet | PASS — shell Language @ 390 opens Smart Trio sheet; fashion Language @ 1366 opens sheet |
| Role switching | Preserved via `ProfileSwitcher` ref + optional Role chrome action when `allowedRoles.length > 1` |
| Locale options / Smart Trio | Unchanged sheet options (Auto / VI / EN + markets) |
| SOS Phase 1 + left rail | Regression scripts green; hosts retained |

## 6. Verification commands

```text
npx tsx scripts/test-viona-mobile-profile-language-contextualization-phase-2.ts  → OK
npx tsx scripts/test-viona-mobile-sos-shell-consolidation-phase-1.ts            → OK
npx tsx scripts/test-viona-mobile-sos-left-rail-reachability-remediation.ts     → OK
npx tsc --noEmit                                                               → OK
npx eslint (changed TSX)                                                       → OK
npm run smoke                                                                  → OK
```

## 7. Responsive browser QA

| Width | Surface | Observation |
|---|---|---|
| 390 | B2C Home | Me + globe in bottom chrome; SOS right; no absolute floating profile chip; language sheet opens; Account → PersonalHub |
| 430 | B2C Home | Same chrome host pattern |
| 430 | Local | Rail owns Language/Account/Safety; bottom shell visually hidden (Local `tabBarStyle` display none) |
| 768 | B2C Home | Shell chrome + SOS visible; floating profile count 0 |
| 1024 | Fashion Home | Command bar Language / Account / SOS; shell chrome hosts not visible |
| 1366 | Fashion Home | Language sheet opens from command bar |

Browser responsive QA only — **not** physical iOS/Android Wave 2 confidence PASS.

## 8. SOS freeze attestation

- `VionaGlobalSosShellAction` / `vionaGlobalSosShellVisibility.ts` / `SOSFloatingButton` / canonical `SOSModal` / `EmergencySOS` **not modified** in this pack.
- Bottom `viona-sos-tab-bar-host` + left-rail `viona-sos-left-rail-host` retained.
- Hold duration + a11y assertions remain green in Phase-1 / left-rail scripts.

## 9. Non-claims

- Not closed green on master until merge.
- Wave 2 physical native **NOT RUN**.
- No backend / auth / payment / DB / provider / deployment changes.
- Pack40DR wait-state preserved; Pack40S **NOT AUTHORIZED**.
