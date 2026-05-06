# VIONA AI Usage Metering Runbook

## 1. Purpose

- Measure AI, Twilio, voice, and vision usage **before** production enforcement and before a DB-backed ledger.
- Ensure there is **no unlimited AI** spend path at the product policy layer.
- This Pack U layer is **pure types and functions** (`src/core/aiUsage/**`): no provider calls, no secrets, no persistence, no Twilio activation, no payment or booking changes.
- Foundation only: align numeric policy with `AI_COST_GUARD_REGISTRY` until tenant-scoped metering ships.

## 2. Usage Event Model

Each logical consumption is an **`AiUsageEvent`** (see `src/core/aiUsage/aiUsageTypes.ts`):

- **Actor**: `actorType` (`user` | `merchant` | `admin` | `system` | `anonymous`) and optional `actorId`.
- **Tenant context (optional)**: `merchantId`, `userId`, `callSessionId`.
- **Provider / model**: `provider` (`openai` | `gemini` | `twilio` | `local` | `manualOps` | `unknown`), optional `model`.
- **Metered quantity**: `unit` (must match the guard’s `unit` from the cost registry when evaluating) and `quantity`.
- **Optional breakdown**: `inputTokens`, `outputTokens`, `audioSeconds`, `visionRequests`.
- **Economics (minor units)**: `estimatedProviderCostMinor`, `estimatedBilledAmountMinor`, `currency`.
- **Margin**: `estimatedBilledAmountMinor - estimatedProviderCostMinor` (see `estimateAiUsageMargin`).
- **Lifecycle**: `status` — `estimated` | `recorded` | `rejected` | `autoPaused` | `simulated`.
- **Audit metadata**: optional readonly `metadata` (string / number / boolean values only).

**Window snapshot** (`AiUsageWindowSnapshot`): rolling or reset-window totals for `used`, `hardCap`, `unit`, `resetWindow`, and optional rolled-up cost fields for UI or later persistence.

## 3. Verdicts

`evaluateAiUsageAgainstGuard` returns **`AiUsageMeterResult`** with `verdict`:

| Verdict     | Meaning (foundation)                                      |
|------------|------------------------------------------------------------|
| `allow`    | Under hard cap; no blocking rule fired.                    |
| `warn`     | Soft risk (e.g. negative margin on lower-risk guard, unit mismatch, or `recorded` while `productionReady` is false). |
| `autoPause`| Hard cap exceeded with `autoPauseOnCap`, or negative margin on high‑risk / gated / pilot / demo guards when `autoPauseOnCap` is set. |
| `blocked`  | Missing guard config, hard cap without auto-pause, or **frozen** feature. |

## 4. Cap Rules

- **`used + quantity` vs `hardCap`**: if over cap and `guard.autoPauseOnCap` → `autoPause`; else → `blocked`.
- **`remaining`**: `max(0, hardCap - (used + quantity))` on the result (planning UX).
- **`resetWindow`**: carried on snapshots for alignment with `AiCostResetWindow` in the cost registry (enforcement later is server-side).
- **Frozen features** (`guard.status === 'frozen'`): always **`blocked`** (`feature_frozen`), regardless of quantity.
- **Pilot / demo**: registry flags `demoOnly` / `pilotOnly` must **not** be treated as production-ready; `productionReady` remains false until a future pack explicitly enables it.

## 5. Margin Rules

- **Negative margin** (`estimatedBilledAmountMinor < estimatedProviderCostMinor`):
  - If `autoPauseOnCap` and (`providerCostRisk === 'high'` or guard status is `demoOnly` | `pilotOnly` | `gated`) → escalate toward **`autoPause`** with reason `negative_margin_high_risk` when cap is **not** already the dominant failure mode.
  - Otherwise → **`warn`** with `negative_margin` when no harder verdict applies.
- **Operational mitigations (later packs)**: model downgrade, cached FAQ, intake-only fallback, admin approval queues — not implemented in this foundation.

## 6. What Must Exist Before DB-backed Metering

- **Tenant model** (merchant / org) and stable **tenant ID** on every billable event.
- **Merchant plan** mapping to included usage, overage price, and hard caps.
- **Usage table** (append-only) with **idempotency key** per provider callback or client request.
- **Audit log** and **admin alerts** on cap breach and negative margin streaks.
- **Auto-pause enforcement** wired to real gateways (not only UI verdicts).
- **Billing policy** signed off by Finance (what is billed vs what is cost-accrual).

## 7. No-Go Conditions

- No **hard cap** definition per feature / tenant.
- No **cost estimate** path for a feature (provider + VIONA take).
- No **owner** (product + engineering + ops) on-call for AI spend.
- No **incident path** (runbook + rollback + comms).
- No **tenant ID** for merchant-scoped features.
- No **consent** path for voice recording / transcription where required by market.

## 8. Validation (local)

```bash
npm run ai:usage-readiness
```

Full gate set (see Pack U audit): `npm ci`, `ci:expo-readiness`, `typecheck`, `lint`, `ci:release-discipline`, `ai:cost-readiness`, `twilio:sandbox-readiness`, `ai:usage-readiness`.

## 9. Registry Link

Static guard rows live in `src/core/aiCost/aiCostGuardRegistry.ts` (`AI_COST_GUARD_REGISTRY`). Metering **consumes** those definitions as policy input; it does **not** mutate the registry.
