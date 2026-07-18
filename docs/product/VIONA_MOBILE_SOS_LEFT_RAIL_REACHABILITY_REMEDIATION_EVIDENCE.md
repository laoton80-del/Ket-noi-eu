# VIONA — Mobile SOS Left-Rail Reachability Remediation Evidence

Operator authorization: `APPROVE_VIONA_MOBILE_SOS_LEFT_RAIL_REACHABILITY_REMEDIATION`

Packet classification: `READY_FOR_VIONA_MOBILE_SOS_LEFT_RAIL_REMEDIATION_PR_REVIEW`

## Markers

```text
VIONA_MOBILE_SOS_LEFT_RAIL_REACHABILITY_REMEDIATION
PR_392_MERGED_WITH_LEFT_RAIL_GAP
LEFT_RAIL_SOS_HOST_RESTORED
NO_FLOATING_SOS_OVERLAY
CANONICAL_SOS_MODAL_RETAINED
CONSUMER_PHASE_1_BEHAVIOR_PRESERVED
WAVE_2_NATIVE_DEVICE_CONFIDENCE_REMAINS_NOT_RUN
PACK40DR_WAIT_FOR_NATURAL_STRANDED_ATTEMPT_PRESERVED
PACK40S_NOT_AUTHORIZED
PHASE_2_PROFILE_LANGUAGE_NOT_STARTED
```

## 1. PR #392 merge

| Field | Value |
|---|---|
| PR | [#392](https://github.com/laoton80-del/Ket-noi-eu/pull/392) |
| State | **MERGED** |
| Squash commit | `95c41d23b88d07fc1053a82012aa680ad3e5259a` |
| Merged at | `2026-07-17T08:34:57Z` |
| origin/master at remediation start | `95c41d23b88d07fc1053a82012aa680ad3e5259a` |
| Docs-only gate commit `490a075` | **Absent** from master (not cherry-picked blindly) |

## 2. Post-merge blocker

Classification after final gate review: `BLOCKED_GLOBAL_SOS_REACHABILITY`

B2B / Broker / Admin desktop left-rail shells exposed **zero** SOS entries after Phase 1 removed the absolute floating FAB.

## 3. Root cause

`MainTabNavigator` custom `tabBar` renderer short-circuited:

```text
if (tabBarPosition === 'left' || !mountSosInTabBarShell) {
  return <BottomTabBar />;
}
```

So whenever desktop used `tabBarPosition === 'left'`, `VionaGlobalSosShellAction` was never mounted — even when `shouldMountSosInTabBarShell` was true for B2B/Broker/Admin.

## 4. Affected roles / surfaces

- B2B desktop left rail
- Broker desktop left rail
- Admin desktop left rail

## 5. Old broken mount chain (operator desktop)

```text
MainTabNavigator
  → tabBarPosition === 'left'
  → stock BottomTabBar only
  → (no VionaGlobalSosShellAction)
  → prior absolute SOSFloatingButton removed by Phase 1
  → zero SOS entries
```

## 6. New corrected mount chain

```text
MainTabNavigator
  → tabBarPosition === 'left' && mountSosInTabBarShell
  → viona-sos-left-rail-host (column chrome)
      → BottomTabBar (nav destinations)
      → leftRailSosSlot + VionaGlobalSosShellAction layout="leftRail"
  → singular SOSModal (src/screens/b2c/SOSModal.tsx) via sosSheetOpen
```

Bottom-tab consumer host (`viona-sos-tab-bar-host` + `layout="bottomChip"`) unchanged.

## 7. Exact-one SOS proof

| Surface | Result |
|---|---|
| B2B desktop left rail (1024/1366) | **1** `viona-global-sos-left-rail-action` |
| Broker desktop left rail | **1** left-rail action |
| Admin desktop left rail | **1** left-rail action |
| Consumer mobile Home (390) | **1** bottom shell action |
| Local / Travel / Academy (390) | **1** contextual each; no chrome duplicate |
| Fashion desktop Home (1024) | **1** command-bar SOS; no left/bottom chrome SOS |

## 8. Canonical modal ownership

| Check | Result |
|---|---|
| Mount count | **1** (`MainTabNavigator` → `screens/b2c/SOSModal`) |
| Left-rail hold | Opens same `sosSheetOpen` owner (browser hold → SOS Safety Guide) |
| Legacy `components/emergency/SOSModal.tsx` | Untouched / unmounted |

## 9. EmergencySOS route

`App.tsx` `name="EmergencySOS"` — preserved (contract test PASS).

## 10. Tests

```text
npx tsx scripts/test-viona-mobile-sos-left-rail-reachability-remediation.ts → PASS
npx tsx scripts/test-viona-mobile-sos-shell-consolidation-phase-1.ts       → PASS
npx tsc --noEmit                                                           → PASS
npx eslint <touched TS>                                                    → PASS
npm run smoke                                                              → PASS
```

## 11. Typecheck / lint / smoke

All PASS on remediation HEAD (same commit as this evidence).

## 12. Responsive QA (browser / local web only)

| Width | Notes |
|---|---|
| 390 | Consumer Home bottom-shell; Local Safety assist; Travel/Academy rail — exact one each |
| 430 | Same ownership path as 390 (shared ≤768) |
| 768 | Tablet tablet path preserved (bottom chrome when applicable) |
| 1024 | Fashion Home: 1 command SOS; B2B left rail: 1 integrated SOS |
| 1366 | B2B/Broker/Admin left rail: exact one each; hold opens canonical modal |

No floating overlay restored. Wave 2 physical-device QA remains **NOT RUN**.

## 13. Exact changed paths

1. `src/navigation/MainTabNavigator.tsx`
2. `src/components/viona/VionaGlobalSosShellAction.tsx`
3. `src/navigation/vionaGlobalSosShellVisibility.ts` (comment / left-rail chrome wording only)
4. `scripts/test-viona-mobile-sos-left-rail-reachability-remediation.ts` (**new**)
5. `docs/product/VIONA_MOBILE_SOS_LEFT_RAIL_REACHABILITY_REMEDIATION_EVIDENCE.md` (**new**)
6. `docs/product/VIONA_MOBILE_SOS_SHELL_CONSOLIDATION_PHASE_1_EVIDENCE.md` (historical blocker truth)
7. `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`
8. `Handoff_VIONA11726.txt`

## 14. Scope confirmation

No ProfileSwitcher / SmartTrioLanguageChip / auth / backend / Prisma / payment / Twilio /
Expo-EAS / deploy / Pack40 / Phase 2 profile-language work.

## 15. Wave 2 native QA

Remains **NOT RUN**.

## 16. Final classification

`READY_FOR_VIONA_MOBILE_SOS_LEFT_RAIL_REMEDIATION_PR_REVIEW`
