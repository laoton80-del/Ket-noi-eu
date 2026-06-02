# VIONA WAVE 3B — Travel SOS Entry Use Shared SOS Gate

**Pack:** `VIONA.WAVE_3B.TRAVEL_SOS_ENTRY_USE_SHARED_SOS_GATE.1`

## Audit

| Entry | Before | After |
|-------|--------|-------|
| Home SOS chip / safety | `VionaSosHoldGateModal` → `homeCommand.triggerSafetyAssist()` → global `SOSModal` | Unchanged |
| Local rail safety + cards | `VionaSosHoldGateModal` → `homeCommand.triggerSafetyAssist()` → global `SOSModal` | Unchanged |
| Travel “Khẩn cấp & cảnh sát” | Direct `navigation.navigate('EmergencySOS')` | `VionaSosHoldGateModal` → `homeCommand.triggerSafetyAssist()` |
| Travel utility emergency pill | Same direct navigation (shared scenario handler) | Same shared gate |
| Travel top-rail SOS (shell) | `chrome.openSafetyAssist()` → SOS sheet (no hold gate) | Unchanged (shell not in allowed files) |

## Implementation

- `openTravelSosEntry`: opens shared `VionaSosHoldGateModal`
- `onSosHoldGateComplete`: closes gate, calls `homeCommand?.triggerSafetyAssist()` (same as Local)
- Cancel: `onRequestClose` keeps user on Travel
- Optional `VionaSosPlusInfoModal` when SOS Plus surface flag enabled (Local parity)

## Safety

No SOS copy changes. No fake dispatch/GPS/recording. `EmergencySOSScreen` internals untouched.

## Evidence

`docs/design/evidence/wave-3b-travel-sos-entry-use-shared-sos-gate/`

Capture: `node scripts/capture-travel-sos-entry-use-shared-sos-gate.mjs`
