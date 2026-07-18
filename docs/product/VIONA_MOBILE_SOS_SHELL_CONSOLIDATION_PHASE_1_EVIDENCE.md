# VIONA — Mobile SOS Shell Consolidation Phase 1 Evidence

Operator authorization: `APPROVE_VIONA_MOBILE_SOS_SHELL_CONSOLIDATION_PHASE_1`

Packet classification: `READY_FOR_VIONA_MOBILE_SOS_SHELL_CONSOLIDATION_PR_REVIEW`
**(historical)** — PR #392 merged before final reachability gate; see post-merge note below.

## Post-merge reachability note (do not erase)

PR #392 squash-merged to master as `95c41d2` @ `2026-07-17T08:34:57Z` **before** the final
gate recorded `BLOCKED_GLOBAL_SOS_REACHABILITY` for desktop left-rail B2B/Broker/Admin
(zero SOS entries when `tabBarPosition === 'left'`).

Docs-only gate commit `490a075` was **not** on master.

Corrected state requires remediation:
`APPROVE_VIONA_MOBILE_SOS_LEFT_RAIL_REACHABILITY_REMEDIATION`
→ evidence `docs/product/VIONA_MOBILE_SOS_LEFT_RAIL_REACHABILITY_REMEDIATION_EVIDENCE.md`.

Final corrected left-rail reachability exists only after that remediation merges.

## Markers

```text
VIONA_MOBILE_SOS_SHELL_CONSOLIDATION_PHASE_1
FLOATING_SOS_WAS_CURRENT_SOURCE
SOS_CAPABILITY_PRESERVED
CANONICAL_SOS_MODAL_RETAINED
PROFILE_LANGUAGE_FLOATING_REMAIN_FOR_LATER_PHASE
WAVE_2_NATIVE_DEVICE_CONFIDENCE_REMAINS_NOT_RUN
PACK40DR_WAIT_FOR_NATURAL_STRANDED_ATTEMPT_PRESERVED
PACK40S_NOT_AUTHORIZED
```

## 1. Baseline and audit diagnosis

| Field | Value |
|---|---|
| Verified origin/master | `5cd94366cbe680cd9b2294e438b6b2594c2f2a20` |
| Prior audit diagnosis | `MOBILE_UI_LEGACY_IS_CURRENT_SOURCE` |
| Branch | `feat/viona-mobile-sos-shell-consolidation-phase-1` |

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
    → VionaGlobalSosShellAction (hold 3s, non-absolute content overlay)
  → singular SOSModal (src/screens/b2c/SOSModal.tsx)
```

Surfaces that already own in-screen shell SOS (Local utility rail, Travel/Academy top rail,
fashion desktop command bar) do **not** mount the tab-bar SOS entry.

## 4. Mobile shell host

Bottom tab chrome via `tabBar={renderTabBar}` in `MainTabNavigator`, reserved right padding,
`VionaGlobalSosShellAction` (min touch 44).

## 5. Desktop shell host

Fashion desktop Home: existing `VionaFashionHomeCommandBar` SOS entry (unchanged).
Tab-bar SOS suppressed when `fashionHomeDesktopShell === true`.

## 6. Canonical modal ownership

| Check | Result |
|---|---|
| Modal file | `src/screens/b2c/SOSModal.tsx` |
| Mount count in MainTabNavigator | **1** |
| State owner | `sosSheetOpen` in `MainTabNavigator` |
| Legacy `components/emergency/SOSModal.tsx` | Untouched / unmounted |

## 7. One-tap / hold reachability

Hold-to-trigger duration preserved (`V7_SOS_HOLD_TO_TRIGGER_MS` = 3000).
`HomeCommandContext.triggerSafetyAssist` still opens the same canonical modal.
Local / Travel / Academy in-rail SOS paths unchanged.

Narrow correction: canonical `SOSModal` remains mounted on Academy so rail-triggered
`triggerSafetyAssist` can open the sheet (prior source hid both FAB and modal on Academy).

## 8. EmergencySOS route

`App.tsx` still registers `EmergencySOS` → `EmergencySOSScreen`. Unchanged.

## 9. Platform matrix

| Surface | Required result | Phase 1 result |
|---|---|---|
| iOS consumer shell | one integrated SOS entry | Tab-bar shell on Home; Local/Travel own rails |
| Android consumer shell | one integrated SOS entry | Same as iOS (shared RN source) |
| Web mobile | one integrated SOS entry | Tab-bar shell on Home @ ≤768 |
| Web tablet | one integrated SOS entry | Visibility helper + shell/rail ownership |
| Standard web desktop | one shell/top-rail SOS entry | Fashion/command or rail; no floating FAB |
| Fashion desktop Home | one shell-owned SOS entry | Command bar SOS; tab-bar SOS suppressed |
| B2B/admin shell | preserve source-derived reachability | **Initial merge gap:** desktop left rail had 0 SOS (bottom tabs OK). See left-rail remediation. |

No surface mounts both floating FAB and integrated shell entry (floating FAB removed).

## 10. Tests

```text
npx tsx scripts/test-viona-mobile-sos-shell-consolidation-phase-1.ts  → PASS
npx tsc --noEmit (via npm run smoke) → PASS
npx eslint on touched TS/TSX → PASS (no findings)
npm run smoke → PASS
```

## 11. Responsive QA

| Width | Method | Notes |
|---|---|---|
| 390 portrait | Browser device metrics + screenshot | SOS shell chip in tab-bar right slot; no large elevated FAB above content |
| 430 | Source matrix (same ≤768 path) | Same web-mobile branch |
| 768 tablet | Visibility helper + source | Rail-owned surfaces suppress tab-bar SOS |
| 1024 / 1366 | Live fashion desktop screenshot | Command-bar SOS; no floating SOS FAB |

Browser responsive QA only — **not** physical iOS/Android confidence PASS.

## 12. Screenshots

Ephemeral local captures (not committed; privacy-safe; no PII):

- Desktop fashion Home — command rail, no floating SOS FAB
- 390 mobile Home — tab-bar integrated SOS shell chip

## 13. Exact files changed

1. `src/navigation/MainTabNavigator.tsx`
2. `src/components/SOSFloatingButton.tsx` (converted to shell delegate; no absolute overlay)
3. `src/components/viona/VionaGlobalSosShellAction.tsx` (**new**)
4. `src/navigation/vionaGlobalSosShellVisibility.ts` (**new**)
5. `scripts/test-viona-mobile-sos-shell-consolidation-phase-1.ts` (**new**)
6. `docs/product/VIONA_MOBILE_SOS_SHELL_CONSOLIDATION_PHASE_1_EVIDENCE.md` (**new**)
7. `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`
8. `Handoff_VIONA11726.txt`

## 14. Out-of-scope confirmation

Not changed: ProfileSwitcher, SmartTrioLanguageChip, DashboardB2CScreen, DemoTourOverlay,
brand badge, AICopilotFab, VoiceCommandButton, legacy emergency SOSModal file, auth/roles,
backend/API, Prisma, payments, Twilio, Pack40/Pack40DR/Pack40S, Expo/EAS, deploy/env.

## 15. Remaining legacy surfaces (later phase)

- Floating ProfileSwitcher chip
- Floating SmartTrioLanguageChip
- Intent / language chrome positioning polish

## 16. Wave 2 physical-device QA

Remains **NOT RUN** (no physical device attestation in this pack).

## 17. Final classification

`READY_FOR_VIONA_MOBILE_SOS_SHELL_CONSOLIDATION_PR_REVIEW`
