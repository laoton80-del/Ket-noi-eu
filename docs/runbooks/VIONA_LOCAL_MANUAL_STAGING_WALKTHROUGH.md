# VIONA Local manual staging walkthrough (operator index)

**Canonical checklist:** `docs/qa/VIONA_LOCAL_MANUAL_DEVICE_STAGING_WALKTHROUGH_1.md`  
**Latest staging evidence:** `docs/runbooks/VIONA_LOCAL_MANUAL_STAGING_EVIDENCE_2.md` — **PASS** (2026-05-22)

## Quick status

Staging manual walkthrough for **Local request-only / no-charge** is **PASS** on master @ `2137ce1` with limitations documented in the evidence file.

**Not certified:** payment, escrow, payout, settlement, production automation, or commercial go-live.

## Operator setup (no secrets in docs)

1. Staging ref `euqbfanilcssjiwwtcby`; local API health OK.
2. Pilot accounts per `docs/runbooks/VIONA_LOCAL_PILOT_ACCOUNT_PROVISIONING_PLAN_1.md`.
3. `EXPO_PUBLIC_DEV_REST_JWT` + `EXPO_PUBLIC_LOCAL_STAGING_WALKTHROUGH_UNLOCK=true` for merchant inbox on web.
4. `npx expo start -c` after env changes.

## Evidence packs

| Pack | Doc |
|------|-----|
| Evidence update 2 (complete) | `VIONA_LOCAL_MANUAL_STAGING_EVIDENCE_2.md` |
| Dev merchant bridge | `VIONA_LOCAL_STAGING_DEV_MERCHANT_WALKTHROUGH_BRIDGE_1.md` |
| Web confirm/decline fix | commit `2137ce1` |
