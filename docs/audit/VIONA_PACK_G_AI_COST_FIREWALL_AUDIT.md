# VIONA Pack G AI Cost Firewall Audit

## 1. Summary

**What was added**

- **`src/core/aiCost/`** — typed `AiCostFeatureId`, `AiUsageUnit`, `AiCostGuardStatus`, `AiCostGuardDefinition`, and **`AI_COST_GUARD_REGISTRY`** with planning caps per feature; helpers `getAiCostGuard`, `getAllAiCostGuards`, `isAiFeatureProductionReady`, `shouldAutoPauseAiFeature`.
- **`docs/ops/VIONA_AI_COST_FIREWALL_RUNBOOK.md`** — purpose, feature cost table, pilot limits, incident triggers, response playbook, production prerequisites, no-go conditions.
- **`scripts/ai-cost-firewall-check.mjs`** — verifies required files and registry field counts (no secrets, no provider calls); **exit 1** only if files missing or registry clearly malformed.
- **`package.json`** — `ai:cost-readiness` script.
- **i18n** — `aiCost.guard.*`, `aiCost.feature.*`, `aiCost.notes.seeRunbook` in `en` / `vi`.
- **UI** — one-line cost guard hint on AI Receptionist demo + pilot screens (copy only).

**Why this matters before AI / Twilio pilot**

- Surfaces **explicit caps and statuses** before metering exists, reducing “silent unlimited” product risk and aligning GTM with CFO / safety expectations.

## 2. Current Cost Risks

| Feature / surface | Risk | Current guard | Gap | Fix |
|--------------------|------|----------------|-----|-----|
| AI Receptionist demo/pilot | Offline-first; relay optional | Pack C.2 copy; registry `demoOnly` / `pilotOnly` | No live counter in app | Server metering + admin dash (later) |
| B2C AI call assistant | Voice minutes expensive | Registry `gated`; server `AIGateway` for VIG on some paths | Per-minute cap not enforced in this pack | Wire cap to gateway + Twilio policy |
| Leona | Chat volume | Registry `active` with daily caps | Counters not in client module | Usage log |
| Minh Khang / translation | Vision + LLM | Registry `gated`; API cache path | Tenant caps | Per-merchant quota |
| Document scanner | Vision cost | Registry `gated` | Batch abuse | Rate limit + size cap server-side |
| Copilot | Chat bursts | Registry `gated` | — | Same |
| Live interpreter | Long audio | Registry `pilotOnly` | Real-time metering | Session TTL + ops alert |
| Outbound marketing draft | Cold outreach + cost | Registry `frozen` | Job may still exist in code paths | Keep frozen until compliance pack |
| Twilio / voice bridge | Runaway spend | Policy: no prod Twilio in pilot docs | Hard spend cap at carrier | Carrier + app limits |
| VIO / credits | User perception “unlimited AI” | `AIGateway` server-side | Client could imply unlimited | i18n + this registry |

## 3. Registry

| Feature | Status | Unit | included / hard | Auto-pause | Production ready |
|---------|--------|------|-----------------|------------|-------------------|
| aiReceptionistDemo | demoOnly | request | 30 / 60 | yes | no |
| aiReceptionistPilot | pilotOnly | request | 200 / 500 | yes | no |
| b2cAiCallAssistant | gated | minute | 45 / 120 | yes | no |
| leonaAssistant | active | message | 60 / 120 | yes | no |
| minhKhangTranslator | gated | request | 40 / 80 | yes | no |
| documentScanner | gated | document | 15 / 35 | yes | no |
| liveInterpreter | pilotOnly | minute | 30 / 90 | yes | no |
| copilot | gated | message | 50 / 100 | yes | no |
| outboundMarketingDraft | frozen | request | 0 / 0 | yes | no |

## 4. Runbook

- **No unlimited AI** — §1–2 of `VIONA_AI_COST_FIREWALL_RUNBOOK.md`.
- **Cost incident triggers** — §4.
- **Response playbook** — §5.
- **No-go conditions** — §7.

## 5. What This Does Not Do

- No provider calls from new code paths.
- No Twilio enablement.
- No payment or booking changes.
- No DB migration.
- No AI production tool activation.

## 6. Safety

| Item | Touched? |
|------|----------|
| Payment | **no** |
| Booking | **no** |
| Wallet | **no** |
| DB / Prisma | **no** |
| AI production | **no** |
| Twilio | **no** |
| Route names | **no** |
| Feature flags | **no** |

## 7. Validation

Local (2026-05-06), all exit **0**:

- `npm run ci:expo-readiness`
- `npm run typecheck`
- `npm run lint` (0 errors; existing repo warnings only)
- `npm run ci:release-discipline`
- `npm run ai:cost-readiness`

Re-run `npm ci` + full suite on CI before merge.

## 8. Next Pack Recommendation

- Twilio **sandbox** pilot readiness only after approval + spend caps.
- Payment / ledger alignment with metered AI line items.
- **Admin usage dashboard** — per-tenant burn-down charts.
