# Pack30D-8 — Internal Real Twilio POC HTTP Route Wiring

**Operator phrase:** `APPROVE_PACK30D_8_STAGING_WIRING_INTERNAL_ROUTE`  
**Branch:** `feat/pack30d-8-internal-route-wiring`

## What changed

| File | Change |
|------|--------|
| `src/lib/viona/internalRoute/vionaInternalRealTwilioPocRouteGate.ts` | NEW — staging/local-only gate + forced magic number constant |
| `src/middleware/vionaInternalDeploymentStageGateMiddleware.ts` | NEW — 403 on production/unknown before auth |
| `src/controllers/VionaInternalRealTwilioPocController.ts` | NEW — thin HTTP wrapper → `previewVionaExecutionPlanRealProviderPocRoute()` |
| `src/routes/internalRoutes.ts` | NEW — `POST /api/internal/viona/trigger-real-twilio-poc` |
| `src/app.ts` | Mount `internalRouter` at `/api/internal` |
| `scripts/test-viona-pack30d-8-internal-real-twilio-poc-route-wiring.ts` | NEW — 17/17 PASS |
| `scripts/test-staging-ping.ts` | Calls new internal route on staging |
| `.env.example` | Pack30D-8 comment block |

## Safety boundaries held

- **Production hard-block:** route returns 403 when `VIONA_DEPLOYMENT_STAGE=production` or unknown.
- **Local allowed:** `development` / `local` / `dev` stages may call the route (service-layer flag still gates real Twilio).
- **No bypass:** controller calls `previewVionaExecutionPlanRealProviderPocRoute()` only — flag + circuit breaker inside `executeVionaTwilioTestPocReal()` unchanged.
- **Magic numbers only:** controller forces `fromNumber`/`toNumber` = `+15005550006`; request body cannot override phone numbers.
- **Auth required:** existing `authMiddleware` (Bearer JWT) on the viona internal sub-router.

## Quality gates

- `npx tsx scripts/test-viona-pack30d-8-internal-real-twilio-poc-route-wiring.ts` — **17/17 PASS**
- Pack30D-7, Pack30B regressions — embedded in suite above
- `npm run typecheck` — 0 errors

## Post-deploy Fly staging checklist

1. Deploy this branch to `viona-api-staging-eu`.
2. Confirm `VIONA_DEPLOYMENT_STAGE=staging` (fly.toml from Pack30D-7).
3. Set Fly secrets (if not already):
   - `PACK30_REAL_PROVIDER_EXECUTION_ENABLED=true`
   - `TWILIO_TEST_ACCOUNT_SID`, `TWILIO_TEST_AUTH_TOKEN`
   - `PACK30D5_TWILIO_DAILY_CAP_USD_CENTS` (non-zero cap required or breaker stays open)

## cURL (after deploy)

```bash
# 1) Login
TOKEN=$(curl -sS -X POST "https://viona-api-staging-eu.fly.dev/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+420910000001","pinCode":"YOUR_PIN"}' \
  | jq -r '.data.token')

# 2) Trigger real Twilio Test-Credentials POC (magic numbers only)
curl -sS -X POST "https://viona-api-staging-eu.fly.dev/api/internal/viona/trigger-real-twilio-poc" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "YOUR_VISIBLE_REQUEST_UUID",
    "actionId": "request.assign",
    "operatorApprovalGranted": true,
    "userConsentGranted": true,
    "messageBody": "VIONA staging Twilio POC test",
    "idempotencyKey": "staging-manual-1"
  }' | jq .
```

Or: `npx tsx scripts/test-staging-ping.ts` (uses `.env.local` credentials automatically).
