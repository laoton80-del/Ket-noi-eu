# VIONA Local staging pass handoff

**Pack:** `VIONA.KERNEL.LOCAL_STAGING_PASS_SYNC.1`  
**Master / origin:** `3cfea5e` — `docs(auth): record strict REST UI operator proof`
**Date:** 2026-05-22  
**Verdict:** **PASS** — staging / manual walkthrough + REST UI strict operator proof

## Scope (what PASS means)

- Staging DB (`euqbfanilcssjiwwtcby` / `viona-staging-eu`)
- Local-dev API (`EXPO_PUBLIC_REST_API_BASE`, e.g. `http://127.0.0.1:8787`)
- REST UI login (`f3fbc4a`) — Login → PIN → stored JWT; dev JWT optional fallback only
- Legacy dev JWT walkthrough bridge (`c49b354`) — optional; not required when REST UI login used
- Local lane: **request-only / no-charge** (`walletMode` `REQUEST_ONLY_NO_CHARGE`, `walletPhase` `NONE`)

**Does not certify:** commercial go-live, payment capture, escrow, payout, settlement, provider payout, production HTTPS/device matrix, or production automation.

## Evidence

| Doc | Role |
|-----|------|
| `docs/runbooks/VIONA_LOCAL_MANUAL_STAGING_EVIDENCE_2.md` | Operator evidence — **PASS** |
| `docs/runbooks/VIONA_LOCAL_MANUAL_STAGING_WALKTHROUGH.md` | Index |
| `docs/qa/VIONA_LOCAL_MANUAL_DEVICE_STAGING_WALKTHROUGH_1.md` | Full checklist template |
| `docs/runbooks/VIONA_AUTH_REST_UI_LOGIN_BRIDGE_STAGING_RETEST.md` | REST UI login API + **strict UI PASS** @ `3cfea5e` |

## Supporting commits (Local staging lane)

| Commit | Summary |
|--------|---------|
| `4d365bf` | Manual staging walkthrough evidence |
| `2137ce1` | Web Confirm/Decline (`window.confirm` on Expo web) |
| `c49b354` | Dev-only merchant inbox walkthrough bridge |
| `ec1364b` | Staging pilot Local request creation script |
| `40ff5bb` | Staging pilot account provisioning |
| `f3fbc4a` | REST UI login bridge |
| `3aed288` | REST UI staging retest evidence |
| `6853849` | Strict UI proof precondition note |
| `3cfea5e` | Strict REST UI operator proof **PASS** |

## Guardrails (held)

- No payment captured (copy + law)
- `walletPhase` **NONE**
- `Transaction` delta **0** during provisioning / request-create packs
- Wallet row delta **0**
- Merchant confirm/reject = status only — **not** payment capture
- No commercial / payment / escrow / payout / settlement readiness claim in evidence

## REST UI login (post-`feat(auth)` / strict proof @ `3cfea5e`)

**STRICT UI PASS** (operator-attested): UI phone + PIN uses REST login for User A/B and Merchant M/N; isolation, inbox, confirm/decline UI, logout/session clear; forbidden commercial wording not observed. **`EXPO_PUBLIC_DEV_REST_JWT` not required** for strict proof.

When `EXPO_PUBLIC_REST_API_BASE` is set, JWT is stored in `ketnoieu.restApi.jwt.v1` (preferred over dev JWT env when both exist). Pilot phones: `+420910000001/002`, `+420920000001/002` (operator PIN via provisioning — never commit).

## Remaining limitations

| Limitation | Notes |
|------------|--------|
| Demo login UI | Without `EXPO_PUBLIC_REST_API_BASE`, OTP screen stays 4-digit demo path |
| Env hygiene | Save `.env.local` without `EXPO_PUBLIC_DEV_REST_JWT` on disk for reproducible strict reruns |
| Walkthrough unlock | Optional `EXPO_PUBLIC_LOCAL_STAGING_WALKTHROUGH_UNLOCK` + `__DEV__` only |
| Not production matrix | No public staging HTTPS / full device EN-VI matrix sign-off |
| QA checklist rows | Full §1–§9 row-by-row not re-filled in QA doc |
| Ops audit UI | API-only; not covered in staging evidence |
| Architecture | Local lane still **not commercial-pilot-ready** for full product (see architecture audits) |

## Related kernel

`docs/operating/VIONA_PROJECT_KERNEL.md` — Local staging **PASS** @ `4d365bf`; REST UI **STRICT UI PASS** @ `3cfea5e`. Next pack: `VIONA.STAGING.PUBLIC_API_DEPLOY_PLAN.1`.
