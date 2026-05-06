# VIONA AI Cost Firewall Runbook

## 1. Purpose

- **No unlimited AI** — every surfaced feature must map to a guard with finite `includedUsage` / `hardCap` planning numbers (see `src/core/aiCost/aiCostGuardRegistry.ts`).
- **No uncapped voice / Twilio** — voice and call-adjacent features stay **gated** or **pilotOnly** until metering, consent, and spend alerts exist.
- **No provider cost leak** — outbound OpenAI / Twilio / vision routes must remain behind server gates (e.g. `AIGateway`) plus ops approval for pilots.

This runbook is **governance + incident response**; live metering and ledgers are **future packs**.

---

## 2. Feature Cost Classes

| Feature | Unit | Status | Cap (planning) | Auto-pause flag | Production ready |
|---------|------|--------|----------------|-----------------|--------------------|
| AI Receptionist demo | request | demoOnly | 30 / 60 per session | yes | no |
| AI Receptionist pilot | request | pilotOnly | 200 / 500 / month | yes | no |
| B2C AI call assistant | minute | gated | 45 / 120 / month | yes | no |
| Leona assistant | message | active | 60 / 120 / day | yes | no |
| Minh Khang translator | request | gated | 40 / 80 / day | yes | no |
| Document scanner | document | gated | 15 / 35 / month | yes | no |
| Live interpreter | minute | pilotOnly | 30 / 90 / week | yes | no |
| Copilot | message | gated | 50 / 100 / day | yes | no |
| Outbound marketing draft | request | frozen | 0 / 0 | yes | no |

*Cap columns are `includedUsage` / `hardCap` from the registry — not enforced client-side.*

---

## 3. Pilot Limits

- **Demo caps** — smallest windows (`session` / low counts); offline or simulator-first.
- **Pilot caps** — higher than demo but still bounded; **manual ops approval** before widening.
- **Manual approval** — any change to `productionReady`, Twilio, or auto-charge requires human sign-off.
- **Auto-pause** — when metering exists, `autoPauseOnCap: true` features should hard-stop at `hardCap` and alert ops.
- **Escalation** — Pilot Owner + Technical Owner when a cap is hit repeatedly (possible abuse or misconfiguration).

---

## 4. Cost Incident Triggers

- **Cap exceeded** — usage counter crosses `hardCap` (once implemented).
- **Provider spend spike** — cloud billing alert vs trailing 7d average.
- **Repeated retries** — same `idempotencyKey` or burst 429/5xx from provider.
- **Long voice calls** — duration anomaly vs pilot SLA.
- **Abusive usage** — scripted flood from one tenant/IP.
- **Fraud pattern** — wallet drain, stolen session, or broker anomalies (coordinate with trust runbooks).

---

## 5. Response Playbook

1. **Pause feature** — feature flag / route kill / config toggle (per release discipline).
2. **Downgrade model** — router selects cheaper model where quality allows (server-only).
3. **Switch to cached FAQ** — serve static or cached responses when live model is paused.
4. **Shorten call** — enforce max session length for voice pilots.
5. **Require upgrade** — merchant must move to paid tier with explicit cap (commercial pack).
6. **Manual ops review** — unblock only after root cause + merchant communication.

---

## 6. What Must Exist Before Production

- **Ledger or usage log** — per tenant / per feature counters with tamper-evident storage.
- **Model router** — task → model mapping with price ceiling (partial: `AIRouterService`).
- **Provider cost tracking** — daily rollups vs budget.
- **Per-tenant quota** — B2B merchant vs B2C user separation.
- **User / merchant plan cap** — aligns with wallet or subscription tier without silent overage.
- **Admin alert** — Pager/email when 80% of cap in rolling window.
- **Kill switch** — global AI pause already required by observability ops (`docs/OBSERVABILITY_OPERATIONS.md` pattern).

---

## 7. No-Go Conditions

Do **not** declare AI voice / receptionist / interpreter “production ready” while any of the following is true:

- **No usage meter** for that surface.
- **No cap** or cap only in docs without enforcement.
- **No owner** for cost incidents (see `docs/ops/VIONA_COMMERCIAL_PILOT_OPS_RUNBOOK.md` roles).
- **No spend alert** on provider accounts.
- **No incident process** (severity + on-call).
- **No consent** where voice / recording / outbound call applies.

---

## Related

- `src/core/aiCost/` — typed guard registry (foundation).
- `docs/audit/VIONA_PACK_G_AI_COST_FIREWALL_AUDIT.md` — Pack G audit.
- `src/services/ai/AIGateway.ts` — server VIG pre-flight (separate from client registry).
