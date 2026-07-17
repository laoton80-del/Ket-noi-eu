# VIONA — Mobile SOS Shell Consolidation Phase 1 Evidence

Operator authorization: `APPROVE_VIONA_MOBILE_SOS_SHELL_CONSOLIDATION_PHASE_1`

Final gate packet: `VIONA — PR #392 MOBILE SOS SHELL CONSOLIDATION FINAL GATE REVIEW`  
Executor: Composer 2.5 Fast (read-only review + missing local QA + evidence correction only)

Packet classification: `BLOCKED_GLOBAL_SOS_REACHABILITY`

## Markers

```text
VIONA_MOBILE_SOS_SHELL_CONSOLIDATION_PHASE_1
FLOATING_SOS_WAS_CURRENT_SOURCE
SOS_CAPABILITY_PRESERVED_ON_B2C_PRIMARY_SURFACES
CANONICAL_SOS_MODAL_RETAINED
PROFILE_LANGUAGE_FLOATING_REMAIN_FOR_LATER_PHASE
WAVE_2_NATIVE_DEVICE_CONFIDENCE_REMAINS_NOT_RUN
PACK40DR_WAIT_FOR_NATURAL_STRANDED_ATTEMPT_PRESERVED
PACK40S_NOT_AUTHORIZED
DESKTOP_LEFT_RAIL_OPERATOR_SOS_GAP
PR_392_ALREADY_MERGED
```

## 1. Baseline and audit diagnosis

| Field | Value |
|---|---|
| Verified origin/master at branch start | `5cd94366cbe680cd9b2294e438b6b2594c2f2a20` |
| Prior audit diagnosis | `MOBILE_UI_LEGACY_IS_CURRENT_SOURCE` |
| Branch | `feat/viona-mobile-sos-shell-consolidation-phase-1` |
| Feature HEAD reviewed | `acbc607be56d2dd7c6e23eac5a929bb6cf57eabe` |
| PR #392 | **MERGED** to `master` @ `2026-07-17T08:34:57Z` (squash `95c41d23b88d07fc1053a82012aa680ad3e5259a`); base was `master` |
| Canonical root | `C:\KNG\ket-noi-eu` / `C:/KNG/ket-noi-eu` — clean working tree at review start |

## 2. Old mount chain

```text
index.ts → App.tsx → MainTabNavigator
  → absolute SOSFloatingButton (z-index 65, above tab bar)
  → SOSShieldComponent (3s hold)
  → src/screens/b2c/SOSModal.tsx
```

## 3. New mount chain

```text
index.ts → App.tsx → MainTabNavigator
  → custom bottom tabBar host (viona-sos-tab-bar-host)
    → BottomTabBar
    → VionaGlobalSosShellAction (hold 3s, chrome-hosted slot)
  → singular SOSModal (src/screens/b2c/SOSModal.tsx)
```

Surfaces that already own in-screen shell SOS (Local utility rail, Travel/Academy top rail,
fashion desktop command bar) do **not** mount the tab-bar SOS entry.

**Gate finding:** when `tabBarPosition === 'left'` (desktop web for non–fashion-home shells),
`renderTabBar` returns the stock `BottomTabBar` and **does not** mount
`VionaGlobalSosShellAction`, even if `shouldMountSosInTabBarShell` is true. Pre-Phase-1
absolute FAB still appeared on those left-rail shells.

## 4. Mobile shell host

Bottom tab chrome via `tabBar={renderTabBar}` in `MainTabNavigator`, reserved right padding,
`VionaGlobalSosShellAction` (min touch 44). Slot uses absolute positioning **inside** tab-bar
chrome only (not a content-elevated FAB).

## 5. Desktop shell host

Fashion desktop Home (≥769 web B2C Home): existing `VionaFashionHomeCommandBar` SOS entry.
Tab-bar SOS suppressed when `fashionHomeDesktopShell === true`.

## 6. Canonical modal ownership

| Check | Result |
|---|---|
| Modal file | `src/screens/b2c/SOSModal.tsx` |
| Production JSX mounts of canonical file | **1** (`MainTabNavigator`) |
| State owner | `sosSheetOpen` in `MainTabNavigator` |
| Shell / `triggerSafetyAssist` | opens same modal via `onSosHoldComplete` |
| Legacy `components/emergency/SOSModal.tsx` | Untouched; not imported by live consumer shell |
| `SOSHeaderButton` (legacy modal) | Present in tree but **unreferenced** elsewhere — not production-mounted |
| Competing backdrop owner in MainTab | None |

## 7. One-tap / hold reachability

Hold-to-trigger duration preserved (`V7_SOS_HOLD_TO_TRIGGER_MS` = 3000).
A11y: `accessibilityRole="button"`, `sos.a11yChip`, `sos.holdHelper`.
`HomeCommandContext.triggerSafetyAssist` still opens the same canonical modal.
Local / Travel / Academy in-rail SOS paths unchanged.

Narrow correction retained: canonical `SOSModal` remains mounted on Academy so rail-triggered
`triggerSafetyAssist` can open the sheet.

## 8. EmergencySOS route

`App.tsx` still registers `EmergencySOS` → `EmergencySOSScreen`. Unchanged.

## 9. SOS entry matrix (final gate)

| # | Surface | Shell / contextual entry | Floating overlay | Duplicate count | Canonical modal owner | Hold / a11y |
|---|---|---|---|---|---|---|
| 1 | iOS consumer Home | Tab-bar shell (shared RN source) | Absent | 0 | `screens/b2c/SOSModal` | Hold 3s + a11y |
| 2 | Android consumer Home | Tab-bar shell (shared RN source) | Absent | 0 | same | Hold 3s + a11y |
| 3 | Web mobile Home (≤768) | Tab-bar shell | Absent | 0 | same | Hold 3s + a11y |
| 4 | Web tablet Home (768) | Tab-bar shell | Absent | 0 | same | Hold 3s + a11y |
| 5 | Standard web desktop | Fashion command SOS on Home ≥769; Local/Travel/Academy own rails | Absent | 0 on B2C | same | Command / rail one-tap (source-derived) |
| 6 | Fashion desktop Home | Command-bar SOS; tab-bar suppressed | Absent | 0 (fresh load) | same | Command SOS |
| 7 | Local | Contextual Safety assist / rail; tab-bar SOS suppressed | Absent | 0 | same via `triggerSafetyAssist` | Rail one-tap |
| 8 | Travel | Top-rail SOS; tab-bar suppressed | Absent | 0 | same | Rail one-tap / a11y |
| 9 | Academy | Top-rail SOS (global tab SOS hidden by source rule) | Absent | 0 | same (always mounted) | Rail one-tap |
| 10 | Account (`PersonalHub` stack) | No in-screen SOS (pre-existing stack route outside tab chrome) | Absent | 0 | N/A on stack; Tabs modal when on tabs | EmergencySOS route preserved |
| 11 | B2B | **Bottom tabs:** tab-bar shell SOS. **Desktop left rail (>768):** **0 entries** | Absent | 0 | Modal still mounted under Tabs | Gap on left rail |
| 12 | Broker | Same as B2B | Absent | 0 | same | Gap on left rail |
| 13 | Admin | Same as B2B | Absent | 0 | same | Gap on left rail |

**Block reason:** B2B / Broker / Admin on desktop left-rail web lose the prior global SOS FAB and
receive no replacement shell entry (`tabBarPosition === 'left'` short-circuit). Classification
`BLOCKED_GLOBAL_SOS_REACHABILITY`.

B2C primary consumer Home / Local / Travel / Academy reachability is preserved under the
Phase-1 ownership rules.

## 10. Tests (same HEAD `acbc607`)

```text
npx tsc --noEmit                                              → PASS (exit 0)
npx tsx scripts/test-viona-mobile-sos-shell-consolidation-phase-1.ts → PASS
npx eslint <touched TS files>                                 → PASS (no findings)
npm run smoke                                                 → PASS
```

Dedicated MainTabNavigator / SOS-modal / nav regression suites beyond the Phase-1 contract
script + smoke navigation registry spot-check were not present as separate scripts; Phase-1
script + smoke used as the relevant gates.

No tests weakened; no assertions skipped.

## 11. Responsive QA (browser / local web only)

| Width | Surfaces inspected | Result |
|---|---|---|
| 390 portrait | Home, Local, Travel, Academy, Account | Home: 1 tab-shell SOS; Local: Safety assist; Travel/Academy: 1 top-rail SOS; no FAB; Account stack: no tab SOS (pre-existing) |
| 430 portrait | Home, Local, Travel, Academy | Same ownership pattern; hold attempt → modal likely open |
| 768 | Home, Local, Travel, Academy | Home tab-shell; Local Safety assist; Travel/Academy rail; no FAB |
| 1024 | Home (fashion), Local, Travel | Home: 1 command SOS after fresh load; Local: Safety assist; Travel: rail SOS; no FAB |
| 1366 | Home (fashion) | 1 command SOS; tabs hidden; no FAB |

Long translated chip: visual chip copy remains short `SOS` across locales; longer strings are
a11y (`sos.a11yChip` / `sos.holdHelper`); chip `maxWidth: 96` + `numberOfLines={1}`.

Browser QA only — **not** physical iOS/Android confidence PASS.

Transient SPA state after mid-session width changes once showed fashion command SOS + tab-shell
SOS together; **fresh reload at 1024/1366** restored single fashion entry. Recorded as layout
race under Emulation, not a stable floating+integrated conflict.

## 12. Screenshots

Ephemeral local captures (not committed; privacy-safe; no PII):

- 390 Home — tab-bar integrated SOS chip; intent sheet dismissed separately
- 430 / 768 surface probes via DOM SOS count
- 1024 / 1366 fashion Home — command-bar SOS, no floating FAB
- Local desktop — Safety assist / rail SOS, no FAB

## 13. Exact files changed (Phase 1 allowlist)

1. `src/navigation/MainTabNavigator.tsx`
2. `src/components/SOSFloatingButton.tsx`
3. `src/components/viona/VionaGlobalSosShellAction.tsx` (**new**)
4. `src/navigation/vionaGlobalSosShellVisibility.ts` (**new**)
5. `scripts/test-viona-mobile-sos-shell-consolidation-phase-1.ts` (**new**)
6. `docs/product/VIONA_MOBILE_SOS_SHELL_CONSOLIDATION_PHASE_1_EVIDENCE.md`
7. `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`
8. `Handoff_VIONA11726.txt`

No ProfileSwitcher / SmartTrioLanguageChip / legacy emergency SOS modal / auth / backend /
Prisma / payment / Twilio / GPS-calling-recording / Expo-EAS / deploy changes in this pack.

## 14. Out-of-scope confirmation

Not changed: ProfileSwitcher, SmartTrioLanguageChip, DashboardB2CScreen, DemoTourOverlay,
brand badge, AICopilotFab, VoiceCommandButton, legacy emergency SOSModal file, auth/roles,
backend/API, Prisma, payments, Twilio, Pack40/Pack40DR/Pack40S, Expo/EAS, deploy/env.

## 15. Remaining legacy surfaces (later phase)

- Floating ProfileSwitcher chip
- Floating SmartTrioLanguageChip
- Intent / language chrome positioning polish
- **Follow-up (gate block):** host SOS on desktop left-rail chrome for B2B/Broker/Admin
  (or equivalent single entry) without restoring a content-elevated FAB

## 16. Wave 2 physical-device QA

Remains **NOT RUN** (no physical device attestation in this pack).

## 17. Final classification

`BLOCKED_GLOBAL_SOS_REACHABILITY`

PR #392 is already **MERGED**. Do not merge again. Do not start Phase 2. Recommend a separate
authorized follow-up to restore exactly one SOS entry on desktop left-rail operator shells.
