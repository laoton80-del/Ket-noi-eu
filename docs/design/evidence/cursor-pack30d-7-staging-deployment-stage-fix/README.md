# Pack30D-7 — Staging Deployment-Stage Fix (Real-Provider Unlock)

**Operator phrase:** `APPROVE_PACK30D_7_STAGING_DEPLOYMENT_STAGE_FIX`  
**Branch:** `feat/pack30d-7-staging-unlock`  
**Document type:** Implementation evidence

## Problem fixed

Fly staging (`viona-api-staging-eu`) runs `NODE_ENV=production` (standard DevOps). The original
Pack30D-4 gate used `NODE_ENV === 'production'` as the hard-block, which misclassified staging as
production and would **never** allow real Twilio Test-Credentials execution even with
`PACK30_REAL_PROVIDER_EXECUTION_ENABLED=true`.

Flipping the flag default to `true` in code would have unlocked local dev/CI accidentally — violating
Zero-Loss.

## Solution (Phase A)

Introduced `VIONA_DEPLOYMENT_STAGE` as the authoritative deployment identity:

| Condition | Real Twilio `executeReal()` |
| --- | --- |
| `VIONA_DEPLOYMENT_STAGE=production` | **HARD BLOCK** (always) |
| unset / dev / unknown stage | **BLOCKED** (fail-closed) |
| `VIONA_DEPLOYMENT_STAGE=staging` + flag unset/false | **BLOCKED** (default stays false) |
| `VIONA_DEPLOYMENT_STAGE=staging` + `PACK30_REAL_PROVIDER_EXECUTION_ENABLED=true` | **ALLOWED** (subject to Circuit Breaker + credentials) |

`NODE_ENV=production` on Fly staging no longer blocks when `VIONA_DEPLOYMENT_STAGE=staging`.

## Files changed

| File | Change |
| --- | --- |
| `src/lib/viona/realProviderAdapter/vionaRealProviderExecutionFlag.ts` | Pack30D-7 staging deployment-stage gate |
| `src/lib/viona/realProviderAdapter/vionaTwilioTestRealProviderAdapter.ts` | Comment update only |
| `fly.toml` | `VIONA_DEPLOYMENT_STAGE=staging` for staging Fly app |
| `.env.example` | Document `VIONA_DEPLOYMENT_STAGE` + updated flag comments |
| `scripts/test-viona-pack30d-7-staging-deployment-stage-gating.ts` | NEW — 9-case gate suite |
| `scripts/test-viona-pack30d2-real-provider-execution-poc.ts` | Test 2 updated for deployment-stage hard-block |
| `scripts/test-viona-pack30d-5-real-provider-circuit-breaker.ts` | Test 7 updated for deployment-stage hard-block |

## Runtime behavior today (unchanged until Operator sets Fly secret)

- `PACK30_REAL_PROVIDER_EXECUTION_ENABLED` default in code: **still false** (not flipped).
- `PACK30D_OPENAI_REAL_EXECUTION_ENABLED`: **still false**, same staging gate, adapter unwired.
- Local dev: **blocked** (no accidental real calls).
- Fly staging after deploy: stage=`staging`, flag still false until Operator sets Fly secret → **still blocked until secret set**.

## Test results

Run in this session:

- `npx tsx scripts/test-viona-pack30d-7-staging-deployment-stage-gating.ts` — 9/9 PASS
- `npx tsx scripts/test-viona-pack30d2-real-provider-execution-poc.ts` — 13/13 PASS
- `npx tsx scripts/test-viona-pack30d-5-real-provider-circuit-breaker.ts` — 12/12 PASS
- `npm run typecheck` — 0 errors
- `npm run lint` — 0 new errors

## Operator next step (post-merge deploy)

To actually unlock Twilio Test-Credentials on Fly staging:

1. Deploy this PR to `viona-api-staging-eu` (picks up `VIONA_DEPLOYMENT_STAGE=staging` from `fly.toml`).
2. Set Fly secrets: `PACK30_REAL_PROVIDER_EXECUTION_ENABLED=true`, `TWILIO_TEST_ACCOUNT_SID`, `TWILIO_TEST_AUTH_TOKEN`, and a conservative `PACK30D5_TWILIO_DAILY_CAP_USD_CENTS`.
3. Run bounded staging QA against Twilio magic numbers only.

Production real execution remains **NOT AUTHORIZED**.
