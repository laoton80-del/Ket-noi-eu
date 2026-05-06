# VIONA Pack T Twilio Sandbox Readiness Audit

## 1. Summary

**What was added**

- **`src/core/telephony/`** — typed `TelephonyProvider`, `TelephonyPilotStatus`, `TelephonyCallMode`, `TelephonyConsentRequirement`, `TelephonyPilotReadinessDefinition`, and **`TELEPHONY_PILOT_REGISTRY`** for three pilot lanes; helpers `getTelephonyPilotReadiness`, `getAllTelephonyPilotReadiness`, `isTelephonyProductionReady`, `isProductionCallModeBlocked`.
- **`docs/ops/VIONA_TWILIO_SANDBOX_PILOT_RUNBOOK.md`** — purpose, scope, user actions, consent/recording, cost guard, manual ops, no-go, smoke test, production gate.
- **`scripts/twilio-sandbox-readiness-check.mjs`** + **`npm run twilio:sandbox-readiness`** — verifies telephony sources, runbook, `.env.example` **key names** (not values), and registry guard fields; **no Twilio API calls**.
- **`.env.example`** — documented Twilio / VIONA call policy env **names** only (commented placeholders).
- **i18n** — `telephony.sandbox.*` and `telephony.feature.*` in `en` / `vi`.
- **UI** — one-line telephony disclaimer on AI Receptionist demo + pilot screens (copy only).

**Why this matters before a real voice pilot**

- Prevents accidental **production dial** or **uncapped spend** by making sandbox posture, consent, recording, cost, and ops gates **explicit** before any Twilio credential touches runtime.

## 2. Current Voice / Telephony Risks

| Surface | Risk | Existing guard | Gap | Fix |
|---------|------|----------------|-----|-----|
| AI Receptionist pilot | Merchant expects auto-dial | Product copy + Pack C.2; registry `docsOnly` | No live Twilio wiring in this pack | Follow runbook §6 |
| B2C AI Call Assistant | Voice cost + compliance | Registry blocks `sandboxOutbound` | Metering not in registry | Server caps + legal |
| Live interpreter / bridge | Long audio / carrier cost | Registry `productionFrozen` / manualOps | Real bridge code paths elsewhere | Map to metering pack |
| Admin mock dialer / CRM | Confusion with prod | Labeled mock in UI | Ops might assume real | Training + this runbook |
| Consent / recording | Legal exposure | Runbook §4; env doc | Enforcement in product TBD | Product + legal |
| Cost firewall | Spend | Pack G registry + AIGateway server | Voice-specific metering TBD | Tie Twilio CDR to caps |
| Manual ops | Dropped requests | Commercial ops runbook | Telephony-specific triage | §6 this doc |
| Env / secrets | Leak | .env not committed; example names only | Local misuse | Secret manager |
| Lead handoff | Wrong expectation | Pilot lead email flow | Voice ≠ lead | Copy + ops |
| Incidents | No owner | Commercial runbook roles | SEV for telephony | Add on-call |

*Audit commands: repository searched with workspace `grep` (no `rg` in shell); Twilio references also in admin/marketing mock surfaces.*

## 3. Telephony Registry

| Feature | Status | Allowed modes | Blocked modes | Production ready |
|---------|--------|---------------|---------------|--------------------|
| aiReceptionistTwilioSandbox | docsOnly | noCall, manualOpsCallback, sandboxOutbound | sandboxInbound, productionOutbound | no |
| b2cAiCallAssistantSandbox | pilotGated | noCall, manualOpsCallback | sandboxOutbound, sandboxInbound, productionOutbound | no |
| liveInterpreterVoiceBridge | productionFrozen | noCall, manualOpsCallback | sandboxOutbound, sandboxInbound, productionOutbound | no |

## 4. Runbook

- **Sandbox only** — §1–2 of `VIONA_TWILIO_SANDBOX_PILOT_RUNBOOK.md`.
- **Consent / recording** — §4.
- **Cost guard** — §5 + `VIONA_AI_COST_FIREWALL_RUNBOOK.md`.
- **Manual ops** — §6.
- **No-go** — §7.

## 5. What This Does Not Do

- No Twilio API call from new scripts or registry.
- No real PSTN/SIP call.
- No production calling enablement.
- No payment, booking, or wallet changes.
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
| Twilio API | **no** |
| Route names | **no** |
| Feature flags | **no** |

## 7. Validation

Local (2026-05-06), exit **0**:

- `npm run ci:expo-readiness`
- `npm run typecheck`
- `npm run lint` (0 errors; existing repo warnings only)
- `npm run ci:release-discipline`
- `npm run twilio:sandbox-readiness`

Re-run `npm ci` + full suite on CI before merge.

## 8. Next Pack Recommendation

- **Needs user action:** Twilio account + verified secrets in secure env only.
- **Sandbox smoke test** — manual, test numbers, with consent log.
- **AI usage metering** — bind CDR / minutes to `aiCost` + server ledger.
- **Production calling gate** — separate approval + `VIONA_TWILIO_PRODUCTION_CALLS_ENABLED` policy pack.
