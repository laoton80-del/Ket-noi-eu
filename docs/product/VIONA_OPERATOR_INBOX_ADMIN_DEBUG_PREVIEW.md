# VIONA Operator Inbox Admin Debug Preview

## Pack6 Purpose

Pack6 adds the first controlled promotion from ReferenceLab-only operator inbox preview (Pack4) to a gated Admin Debug read-only route. Operators with `serverRole === 'ADMIN'` can inspect fixture-based request queues when both admin debug and the dedicated preview flag are enabled.

This follows Pack5 because Pack5 documented readiness gates, maturity phases, and deferred App.tsx wiring until a dedicated feature flag and role guard were defined.

## Why App.tsx Touch Is Allowed Here

Admin Debug routes register only through `App.tsx` inline conditionals (unlike ReferenceLab, which uses `getReferenceLabStackScreens`). Pack6 adds one minimal `Stack.Screen` and linking entry in a **separate** conditional from `adminDemoMetricsEnabled` — not inside the omni demo metrics bundle.

## Admin Debug Only

Route name: `VionaAdminDebugOperatorInboxPreview`

Gates required:

- `EXPO_PUBLIC_ENABLE_ADMIN_DEBUG=1` (via `isAdminDebugSurfaceEnabled()`)
- `EXPO_PUBLIC_VIONA_OPERATOR_INBOX_ADMIN_DEBUG_PREVIEW=true`
- Screen-level `serverRole === 'ADMIN'` guard

Deep link: `admin/operator-inbox-preview`

## Dedicated Feature Flag

`EXPO_PUBLIC_VIONA_OPERATOR_INBOX_ADMIN_DEBUG_PREVIEW=true`

This flag is separate from ReferenceLab per-lab gates and separate from `EXPO_PUBLIC_FEATURE_ADMIN_DEMO_METRICS` / `omniDemoEnabled`.

## Admin Role Guard

Non-admin users see a safe denied screen:

- Admin preview only
- Read-only operator preview
- No live operations

## Fixture-Only Data

The screen uses Pack2 fixtures, selectors, and read-only components only. No API, DB, fetch, or persistence.

## Explicit Non-Goals

- No LocalOpsAudit API reuse (different domain and live REST path)
- No AdminCommandCenter / TabCommandCenter wiring
- No LocalMerchantRequestInbox or TourismMerchantInbox reuse
- No API
- No DB
- No payment
- No booking
- No SOS dispatch
- No wallet
- No live AI
- No merchant execution
- No mutations or live admin operations

## Required Safe Copy

- Admin Debug preview
- Read-only operator preview
- Fixture data only
- No payment captured
- Not booking confirmed
- No SOS dispatch
- No live merchant execution
- Human confirmation required before any future protected action
- API and persistence are future gates

## Future Gates

1. Request persistence/API after source-of-truth approval
2. Audit log for reads, transitions, and operator actions
3. Operator runbook and human-confirmed protected actions
4. Merchant ops only after tenant/fulfillment/ops readiness
5. Payment/SOS/wallet/live AI only after respective readiness gates

## Config Reference

- `src/config/vionaOperatorInboxAdminDebugGate.ts`
- `src/config/vionaOperatorInboxAdminReadiness.ts`
- `src/screens/admin/VionaAdminDebugOperatorInboxPreviewScreen.tsx`
