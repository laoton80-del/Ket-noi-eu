# VIONA Local staging — dev merchant inbox walkthrough bridge

**Pack:** `VIONA.LOCAL.STAGING_DEV_MERCHANT_WALKTHROUGH_BRIDGE.1`  
**Purpose:** Open `LocalMerchantRequestInbox` in Expo dev without patching browser Local Storage or B2B SaaS paywall.

## Unlock conditions (all required)

| Condition | Env / runtime |
|-----------|----------------|
| Dev build | `__DEV__` === true |
| Pilot REST JWT | `EXPO_PUBLIC_DEV_REST_JWT` set (Merchant M or N token from `POST /api/auth/login`) |
| Explicit flag | `EXPO_PUBLIC_LOCAL_STAGING_WALKTHROUGH_UNLOCK=true` |

Helper: `hasLocalStagingWalkthroughUnlock()` in `src/utils/b2bAccess.ts`.  
Used only by `GatedLocalMerchantRequestInboxScreen` in `App.tsx`.

## Not unlocked

- Merchant SaaS billing / wallet / Tourism / VIP
- Other `B2BWorkspaceGate` routes (dashboard preview, orders, tourism inbox, etc.)
- Server APIs — still require valid JWT; inbox scoped by `Business.ownerId`

## Operator steps

1. Obtain Merchant M JWT via PowerShell-safe `POST /api/auth/login` (PIN in operator note only).
2. In `.env.local` (do not commit):
   - `EXPO_PUBLIC_DEV_REST_JWT=<Merchant M JWT>`
   - `EXPO_PUBLIC_LOCAL_STAGING_WALKTHROUGH_UNLOCK=true`
   - `EXPO_PUBLIC_REST_API_BASE=http://127.0.0.1:8787` (or LAN IP for device)
3. `npx expo start -c`
4. Merchant dashboard → Local service request inbox (or navigate to `LocalMerchantRequestInbox`).
5. Confirm R1/R2; confirm R1; reject R2.
6. For Merchant N isolation: swap JWT to Merchant N, restart Expo, reopen inbox — expect empty.

## Related

- User A path: `EXPO_PUBLIC_DEV_REST_JWT` only (no unlock flag required).
- QA checklist: `docs/qa/VIONA_LOCAL_MANUAL_DEVICE_STAGING_WALKTHROUGH_1.md`
