# VIONA — SOS entry parity: Local uses the Home SOS gate

**Task:** `VIONA.SOS_ENTRY_PARITY.LOCAL_USES_HOME_SOS_GATE.1`
**Scope:** `src/screens/b2c/LocalScreen.tsx` only (reuses shared SOS gate components; no SOS
redesign, no dispatch/call/GPS/recording behavior, no payment/AI/backend/auth changes).

## 1. Root cause of the Local SOS bypass

The Local top-rail SOS button called `homeCommand.triggerSafetyAssist()` directly:

```ts
const openSafetyAssist = useCallback(() => {
  homeCommand?.triggerSafetyAssist();
}, [homeCommand]);
```

In `MainTabNavigator`, `triggerSafetyAssist` is wired straight to `onSosHoldComplete`
(`setSosSheetOpen(true)`) — i.e. the **post-hold** action that opens the in-app `SOSModal`.
So Local jumped past any confirmation/hold step and opened the SOS flow immediately.

Home, by contrast, routes SOS through a confirmation/hold gate first:

```ts
// HomeScreen.openSosEntry
if (fashionHomeDesktopShellActive) setSosHoldGateOpen(true); // shared VionaSosHoldGateModal
else homeCommand?.triggerSafetyAssist();                     // mobile path (FAB shield owns the hold)
// onSosHoldGateComplete → triggerSafetyAssist() → SOSModal
```

The shared gate is **`VionaSosHoldGateModal`** (`variant="continueToAppSos"`): SOS Plus info
strip, a 3-second `VionaSosHoldButton`, and safety-honest copy. After the hold completes it
calls `triggerSafetyAssist()` → the same in-app `SOSModal`.

## 2. Files changed
- `src/screens/b2c/LocalScreen.tsx`
- `docs/design/VIONA_SOS_ENTRY_PARITY_LOCAL_USES_HOME_SOS_GATE.md` (this doc)

## 3. Shared SOS gate behavior (now used by Local)

Local now mirrors Home's gate using the **same shared components** (no copy duplication):

- Pressing the Local rail SOS button opens `VionaSosHoldGateModal`
  (`variant="continueToAppSos"`) instead of jumping into SOS.
- The modal shows the SOS Plus info strip + "learn Basic vs Plus" link (gated by
  `SOS_PLUS_PRODUCT_SURFACE_UI_ENABLED`, opening `VionaSosPlusInfoModal`, which can open the
  existing `SosPlusProfile` route when `SOS_PLUS_PROFILE_UI_ENABLED`) — identical to Home.
- Completing the 3-second hold runs `onSosHoldGateComplete` → `homeCommand.triggerSafetyAssist()`
  → opens the same shared in-app `SOSModal` Home uses.
- Cancel/close dismisses the modal and stays on Local. No auto-dial, dispatch, GPS, or
  recording is triggered by the gate.

Wiring added to `LocalScreen`:
```ts
const openSafetyAssist = useCallback(() => {
  setSosPlusInfoOpen(false);
  setSosHoldGateOpen(true);
}, []);

const onSosHoldGateComplete = useCallback(() => {
  setSosHoldGateOpen(false);
  homeCommand?.triggerSafetyAssist();
}, [homeCommand]);
```

## 4. SOS entry-point audit (all paths gated)
- **Home (desktop shell)**: SOS → `VionaSosHoldGateModal` (3s hold) → `triggerSafetyAssist` →
  `SOSModal`. Gated. (Unchanged.)
- **Home / global FAB (mobile + non-fashion-desktop)**: `SOSFloatingButton` →
  `SOSShieldComponent` 3-second hold → `onSosHoldComplete` → `SOSModal`. Gated by the shield
  hold (documented existing gate). (Unchanged.)
- **Local top rail**: now → `VionaSosHoldGateModal` (3s hold) → `triggerSafetyAssist` →
  `SOSModal`. **Fixed** (was the only bypass).
- **Local global FAB**: still `SOSShieldComponent` hold → `SOSModal`. Gated by shield hold.
  (Unchanged.)

## 5. Safety copy preserved
The shared `VionaSosHoldGateModal` / `SOSModal` copy is reused verbatim — holding 3 seconds
starts the in-app emergency screen; it does **not** auto-call emergency services or dispatch
responders; no fake GPS sharing, recording, or safety-response-team claims.

## Acceptance
- Local SOS opens the same gate/modal as Home; no longer jumps straight into SOS.
- Holding 3 seconds proceeds to the existing shared in-app SOS flow.
- Home SOS behavior unchanged; no fake emergency production claims; no route/payment/AI/backend
  drift.
