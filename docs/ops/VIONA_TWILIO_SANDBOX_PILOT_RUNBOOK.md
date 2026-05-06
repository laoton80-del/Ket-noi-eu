# VIONA Twilio Sandbox Pilot Runbook

## 1. Purpose

- **Sandbox readiness only** — documentation, env naming, and registry posture; not an enablement of live traffic.
- **No production calling** — outbound production PSTN/SIP must stay off until a separate **production gate** pack is approved.
- **No real user calling without explicit approval** — merchant and end-user consent, legal review, and cost caps precede any live dial test.

This runbook pairs with:

- `docs/ops/VIONA_COMMERCIAL_PILOT_OPS_RUNBOOK.md` — lead intake and manual ops.
- `docs/ops/VIONA_AI_COST_FIREWALL_RUNBOOK.md` — caps and spend incidents.
- `src/core/telephony/` — typed pilot lane registry (read-only in app bundles).

---

## 2. Scope

| Lane | Intent |
|------|--------|
| **AI Receptionist Twilio sandbox** | Future verified voice intake **after** sandbox numbers + TwiML + consent; today: **docs + manual callback** first. |
| **B2C AI Call Assistant sandbox** | Tighter default: **no sandbox outbound** in registry until program owner removes block (see `telephonyPilotRegistry.ts`). |
| **Live interpreter / voice bridge** | **Manual ops / human callback** posture; production voice bridge **frozen** in registry. |

---

## 3. Required User Actions (Needs user action)

- Create / verify **Twilio account** (trial vs paid) and **2FA** on the account.
- Configure **sandbox or verified test numbers**; never use production customer numbers in trial without consent.
- Add secrets only via **hosting secret manager** or CI secrets — **never commit** `TWILIO_AUTH_TOKEN` or similar to git.
- **Legal review** before any **recording** or storage of voice/transcripts.
- **Market consent review** (EU + VN + other markets) before outbound marketing voice.
- Ops: name **Pilot Owner** and **Backup** for telephony incidents (see commercial pilot runbook §2).

---

## 4. Consent / Recording

- **Explicit consent required** before placing an outbound call that reaches a real person’s handset.
- **Recording disclosure** required if `VIONA_CALL_RECORDING_ENABLED` would ever be `true` (default should remain **false** until policy + product support).
- **No recording by default** — treat `VIONA_CALL_RECORDING_ENABLED=false` as the safe baseline.
- **Market legal review required** for retention, cross-border transfer, and health/sensitive verticals.

---

## 5. Cost Guard

- Use **`docs/ops/VIONA_AI_COST_FIREWALL_RUNBOOK.md`** and `src/core/aiCost/` for feature-level caps and auto-pause policy.
- **No unlimited voice minutes** — per-tenant and per-demo ceilings once metering is implemented server-side.
- **Cap per demo/pilot** — registry rows require `requiresCostGuard: true` until finance signs off on burn rate.
- **Auto-pause on cap** — align with AI cost firewall response playbook.
- **Owner must review overage** — Pilot Owner + Technical Owner before raising caps.

---

## 6. Manual Ops Flow

1. Pilot or sandbox request received (email / ticket).
2. **Owner triages** (P0–P3) per commercial ops runbook.
3. **Merchant confirms** scope, test window, and numbers.
4. **Sandbox test call only** — verified test destination, short duration, logged.
5. **No production call** — `VIONA_TWILIO_PRODUCTION_CALLS_ENABLED` must remain `false` until written production gate.
6. **Log outcome** — who ran test, SID reference (if applicable), consent reference, result.

---

## 7. No-Go Conditions

Do **not** proceed with live Twilio dialing while any of the following is true:

- **No consent** path documented and captured for callee.
- **No cost cap** or metering plan for the lane.
- **No owner** (Pilot Owner / Backup) on-call for incidents.
- **No support path** for user complaints or opt-out.
- **No incident path** (severity + escalation) for telephony failures or abuse.
- **Production flag** would be `true` without executive + legal + finance sign-off (`VIONA_TWILIO_PRODUCTION_CALLS_ENABLED`).
- **Recording policy missing** while considering recording features.

---

## 8. Smoke Test (no production call)

- [ ] Prepare **sandbox** Twilio config in secure env only (**Needs user action**).
- [ ] Run `npm run twilio:sandbox-readiness` — repo files and `.env.example` key **names** present.
- [ ] **No production call** made as part of this script or CI step.
- [ ] **Test number only** for any manual sandbox dial (outside automated CI).
- [ ] Verify **no secrets** printed in logs or CI output.

---

## 9. Production Gate (later pack)

Separate approval required for:

- Payment / ledger if calls are monetized or metered against wallet.
- Legal + privacy DPIA updates.
- Incident and abuse process with carrier.
- **Usage metering** wired to `AIGateway` / telephony usage tables (when implemented).
- Customer support readiness for “call failed” / consent withdrawal.

---

## Related

- `docs/audit/VIONA_PACK_T_TWILIO_SANDBOX_READINESS_AUDIT.md`
- `.env.example` — Twilio-related **key names only** (no real values).
