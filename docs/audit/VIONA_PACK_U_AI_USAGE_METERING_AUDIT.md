# VIONA Pack U AI Usage Metering Foundation Audit

## 1. Summary

**What was added**

- Typed **`AiUsageEvent`** model and related enums / snapshot / meter result types (`src/core/aiUsage/aiUsageTypes.ts`).
- **Pure** evaluation helpers: event factory, margin estimate, guard evaluation, warn/reject shims (`src/core/aiUsage/aiUsageMeter.ts`).
- **Readonly audit fixtures** bound to `AI_COST_GUARD_REGISTRY` (`src/core/aiUsage/aiUsageFixtures.ts`).
- Public **barrel** (`src/core/aiUsage/index.ts`).
- **Readiness script** `scripts/ai-usage-metering-check.mjs` and npm script `ai:usage-readiness`.
- Ops **runbook** `docs/ops/VIONA_AI_USAGE_METERING_RUNBOOK.md`.

**Why this matters before AI / Twilio sandbox pilot**

- Product and engineering share one **vocabulary** for usage, caps, margin, and verdicts before any DB or provider enforcement.
- Caps and risk flags from **`AI_COST_GUARD_REGISTRY`** can be exercised in tests and audits without calling OpenAI, Gemini, or Twilio.

**Repository scan note (Windows)**

- `rg` was not assumed on PATH; discovery used repository reads and targeted searches equivalent to the requested `rg` patterns for `src/core/aiCost`, `src/core/aiUsage`, B2B screens, and ops docs.

## 2. Current Metering Gaps

| Feature | Current usage/cost guard | Metering gap | Risk | Recommendation |
|--------|---------------------------|--------------|------|----------------|
| AI Receptionist demo | Registry row `aiReceptionistDemo`; UI cost firewall copy | No persisted usage rollups per merchant | Session abuse in pilot builds | Wire snapshot provider from future session store; keep `demoOnly` |
| AI Receptionist pilot | Registry `aiReceptionistPilot`; pilot request flow | No tenant-level minute/request ledger | Cost overrun during pilot | DB usage row + idempotency before production pilot scale |
| B2C AI Call Assistant | Registry `b2cAiCallAssistant`; high risk | No live minute metering | High COGS | Tenant plan + hard enforcement server-side |
| Leona Assistant | Registry `leonaAssistant` | No message-level aggregation | Steady drip cost | Daily window enforcement + alerts |
| Minh Khang Translator | Registry `minhKhangTranslator` | No per-request accounting | Abuse of gated feature | Gate + usage table |
| Document scanner | Registry `documentScanner` | No per-document metering | Vision cost spikes | Cap + model routing |
| Live interpreter | Registry `liveInterpreter` | No minute bridge to Twilio CDR | Voice COGS | Pack Twilio sandbox then CDR reconcile |
| Copilot | Registry `copilot` | No message metering | Chat volume risk | Same as Leona with product caps |
| Outbound marketing draft | Registry `frozen` | N/A (blocked) | Reactivation without guard | Keep frozen until legal + monetization sign-off |
| Twilio sandbox readiness | Telephony runbooks / checks | No CDR → usage event mapping yet | Pilot blind spots | After user consent + sandbox dial, map CDR to `AiUsageEvent` |

## 3. Usage Event Model

- **Fields**: see `AiUsageEvent` in `aiUsageTypes.ts` (`eventId`, `featureId`, actor, ids, provider, model, unit, quantity, token/audio/vision optional fields, cost estimates, currency, `status`, `createdAtIso`, `metadata`).
- **Supported providers**: `openai` | `gemini` | `twilio` | `local` | `manualOps` | `unknown`.
- **Supported units**: reuse `AiUsageUnit` from ai cost types (`request` | `message` | `minute` | `token` | `image` | `document`).
- **Status values**: `estimated` | `recorded` | `rejected` | `autoPaused` | `simulated` — foundation treats **`recorded` + `productionReady: false`** as at least a **warn** when no harder verdict applies.

## 4. Metering Verdicts

| Verdict | Meaning (this pack) | Production behavior later |
|--------|----------------------|---------------------------|
| `allow` | Within cap; no block | Permit gateway request |
| `warn` | Policy soft signal | Throttle, banner, or ops queue |
| `autoPause` | Cap or high-risk margin rule | Halt new sessions / turns until reset or admin |
| `blocked` | Missing guard, frozen, or hard cap without auto-pause | Hard deny at gateway |

## 5. Fixtures

| Fixture | Expected verdict | Reason |
|---------|------------------|--------|
| `AI_USAGE_FIXTURE_RECEPTIONIST_DEMO_WITHIN_CAP` | `allow` | Under `hardCap`; positive margin |
| `AI_USAGE_FIXTURE_RECEPTIONIST_PILOT_NEAR_CAP` | `autoPause` | `used + quantity` over pilot `hardCap`; `autoPauseOnCap` |
| `AI_USAGE_FIXTURE_LIVE_INTERPRETER_OVER_CAP` | `autoPause` | Minutes over interpreter `hardCap` |
| `AI_USAGE_FIXTURE_OUTBOUND_FROZEN` | `blocked` | Registry status `frozen` |
| `AI_USAGE_FIXTURE_NEGATIVE_MARGIN_HIGH_RISK` | `autoPause` | Negative margin with `providerCostRisk: high` |

Run `evaluateAiUsageFixtureForAudit` from `aiUsageFixtures.ts` to reproduce results (no I/O).

## 6. What This Does Not Do

- No **provider** HTTP/SDK calls.
- No **Twilio** activation or webhook handling.
- No **payment**, Stripe, wallet, or ledger writes.
- No **booking** or broker payout changes.
- No **DB** / **Prisma** migrations or queries.
- No **production enforcement** in the app runtime (verdicts are advisory at this layer).
- No **AI production tool actions** or server gateway wiring in this pack.

## 7. Safety

| Question | Answer |
|----------|--------|
| Payment touched? | **no** |
| Booking touched? | **no** |
| Wallet touched? | **no** |
| DB / Prisma touched? | **no** |
| AI production touched? | **no** |
| Twilio touched? | **no** |
| Route names changed? | **no** |
| Feature flags changed? | **no** |

## 8. Validation

Commands run for Pack U sign-off (2026-05-06, branch `pack-u-ai-usage-metering-foundation`):

- `npm ci` — pass
- `npm run ci:expo-readiness` — pass
- `npm run typecheck` — pass
- `npm run lint` — pass (0 errors; existing repo warnings only)
- `npm run ci:release-discipline` — pass (includes nested `typecheck`, `smoke`, `functions:verify-bundle`, `trust:preflight`, `ai:cost-readiness`, `twilio:sandbox-readiness`)
- `npm run ai:cost-readiness` — pass
- `npm run twilio:sandbox-readiness` — pass
- `npm run ai:usage-readiness` — pass
- Fixture sanity: `evaluateAiUsageFixtureForAudit` over `AI_USAGE_AUDIT_FIXTURES` — all verdicts match `expectedVerdict`

## 9. Next Pack Recommendation

- **DB-backed usage log** only after tenant model + billing policy approval.
- **Admin usage dashboard** (per merchant, per feature, reset windows).
- **Auto-pause enforcement** integrated with server AI gateway and Twilio task queues.
- **Twilio sandbox smoke test** only after explicit user action and ops runbook step (see Twilio sandbox pilot runbook).
