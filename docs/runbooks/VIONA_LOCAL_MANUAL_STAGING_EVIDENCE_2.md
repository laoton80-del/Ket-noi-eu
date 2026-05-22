# VIONA Local manual staging evidence — update 2

**Pack:** `VIONA.LOCAL.MANUAL_STAGING_EVIDENCE_UPDATE.2`  
**Master at test:** `2137ce1` (`fix(local): support merchant inbox actions on web`)  
**Staging project ref:** `euqbfanilcssjiwwtcby` (`viona-staging-eu`)  
**Date:** 2026-05-22  
**Type:** Operator evidence record only — **not** commercial, payment, escrow, payout, settlement, or production automation certification.

## Verdict

| Field | Value |
|-------|--------|
| **Verdict** | **PASS** (staging / manual walkthrough only) |
| **Scope** | Local request-only / no-charge lane on staging + Expo web (local API) |
| **Tester** | Operator (staging walkthrough) |
| **Test date** | 2026-05-22 |

**Does not certify:** production readiness, payment capture, wallet hold/settle, provider payout, platform fee, Tourism bridge, or Firebase VIP.

## Engineering context (no secrets)

| Item | Value |
|------|--------|
| API | Local dev `EXPO_PUBLIC_REST_API_BASE` (e.g. `http://127.0.0.1:8787`) |
| Auth (UI) | `EXPO_PUBLIC_DEV_REST_JWT` per persona; pilot PIN in operator `.env.local` only |
| Merchant inbox UI gate | `EXPO_PUBLIC_LOCAL_STAGING_WALKTHROUGH_UNLOCK=true` + `c49b354` (dev/staging only) |
| Web confirm/decline | `2137ce1` — `window.confirm` on web; native `Alert.alert` unchanged |

## Pilot accounts (labels only)

| Role | Phone (E.164) | User id (staging) |
|------|---------------|-------------------|
| User A | `+420910000001` | `b7802315-8815-458f-92d9-0f5abac8ced9` |
| User B | `+420910000002` | `4dde7929-ebf1-4842-821a-f480d9a14150` |
| Merchant M | `+420920000001` | `071e95be-1c56-45a9-a447-2d195582edd8` |
| Merchant N | `+420920000002` | `58619916-99dd-46cf-8362-47b640264ce2` |
| Business M | — | `257f467a-8de2-41d0-b171-5ee499ba96d2` |

## Request inventory

| Label | Request id | Final status (observed) | How exercised |
|-------|------------|-------------------------|---------------|
| R1 | `b9fdce47-0211-49a9-8a92-c97d67d2b24d` | CONFIRMED | API fallback |
| R2 | `2cb6a055-09a7-4420-a56c-2a8bdd6afc9d` | REJECTED | API fallback |
| R3 | `21c57984-0d8a-4751-a7b9-d81c846c2b10` | CONFIRMED | UI Confirm |
| R4 | `41affa29-0cac-4f00-91b1-567cdec87519` | CONFIRMED | UI Confirm |
| R5 | `f8e73d0e-1fda-425f-a299-a59be6e064db` | CONFIRMED | UI Confirm (reject path not available on this row) |
| R6 | `81fbc638-b7c7-4425-954c-92fe7db86b3f` | CONFIRMED | UI Confirm (reject path not available on this row) |
| R7 | `e08272d6-478c-4674-8746-1c114ab2d4e9` | REJECTED | **UI Decline** — final decline-path proof |

Title for R7: `Pilot Local request R7 UI DECLINE ONLY path`.

## Walkthrough results (summary)

| Area | Result | Notes |
|------|--------|-------|
| User A — My requests | **PASS** | List, safety copy, request-only / no-charge, `walletPhase NONE` |
| Merchant M — dashboard | **PASS** | Local inbox entry; request count visible |
| Merchant M — Local inbox | **PASS** | Loads owned requests; Confirm/Decline after `2137ce1` |
| Merchant M — sees requests | **PASS** | R3–R7 visible in inbox scope |
| Web Confirm UI | **PASS** | R3–R6 via `window.confirm` + `POST …/confirm` |
| Web Decline UI | **PASS** | R7 via `window.confirm` + `POST …/reject` |
| Merchant N isolation | **PASS** | Does not see Merchant M Business M requests |
| No payment captured copy | **PASS** | Visible on user + merchant surfaces |
| Request-only / no-charge copy | **PASS** | |
| `walletPhase NONE` | **PASS** | Badge/copy consistent |
| Wallet `Transaction` delta | **0** | During provision + request create packs |
| Wallet row delta | **0** | Same |

## Core law (held during walkthrough)

- `walletMode`: `REQUEST_ONLY_NO_CHARGE`
- `walletPhase`: `NONE`
- Merchant confirm/reject = **status only**; not payment capture
- No wallet hold, debit, release, refund, settlement, or provider payout from Local UI actions

## Known limitations (still true)

| Limitation | Impact |
|------------|--------|
| Staging + local API + dev JWT | Not production device matrix or public staging HTTPS API sign-off |
| Demo phone login UI | Does not call `POST /api/auth/login`; walkthrough used dev JWT injection |
| R4–R6 used for Confirm retest | Decline path required fresh R7 after accidental confirms |
| VI device matrix | EN-focused operator pass; full §7 VI row-by-row not re-audited in this update |
| `prisma migrate status` via pooler | May fail P1017; schema already bootstrapped on staging — see staging DB runbook |
| Ops audit UI | API-only; not exercised in this evidence |

## Related docs

| Doc | Purpose |
|-----|---------|
| `docs/qa/VIONA_LOCAL_MANUAL_DEVICE_STAGING_WALKTHROUGH_1.md` | Full §1–§9 checklist template |
| `docs/runbooks/VIONA_LOCAL_STAGING_DEV_MERCHANT_WALKTHROUGH_BRIDGE_1.md` | Merchant inbox paywall bypass (dev only) |
| `docs/runbooks/VIONA_LOCAL_PILOT_ACCOUNT_PROVISIONING_PLAN_1.md` | Pilot account provisioning |
| `docs/qa/VIONA_LOCAL_NO_CHARGE_E2E_QA_1.md` | Automated E2E certification |

## Evidence update log

| Pack | Date | Verdict |
|------|------|---------|
| `VIONA.LOCAL.MANUAL_STAGING_EVIDENCE_UPDATE.1` | 2026-05-21 | No operator payload — stayed PASS_WITH_LIMITATIONS |
| `VIONA.LOCAL.MANUAL_STAGING_EVIDENCE_UPDATE.2` | 2026-05-22 | **PASS** — staging manual walkthrough complete (this doc) |

## Next recommendation

| Option | Action |
|--------|--------|
| **A** | Pilot sign-off handoff referencing this evidence + `2137ce1` |
| **B** | Optional: fill row-level PASS in `docs/qa/VIONA_LOCAL_MANUAL_DEVICE_STAGING_WALKTHROUGH_1.md` from this summary |
| **C** | Do **not** enable wallet hold, settlement, or Tourism bridge for Local without separate gate |
| **D** | Production device + HTTPS API walkthrough remains a separate pack |
