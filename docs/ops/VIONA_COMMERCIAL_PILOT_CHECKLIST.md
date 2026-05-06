# VIONA Commercial Pilot Checklist (Machine-Readable)

Use this as a **pre-flight** list before inviting merchants into **manual-ops-assisted** pilots.  
Checkboxes are for humans (or internal tooling); this file is **not** executed by CI.

---

## Environment readiness

- [ ] `DATABASE_URL` / `JWT_SECRET` / SES sender vars documented for the deployment that serves pilot API (see `.env.example`).
- [ ] **`VIONA_AI_RECEPTIONIST_LEAD_RECIPIENT_EMAIL`** set on API server if AI Receptionist email relay is required for the pilot wave.
- [ ] SES (or approved mail transport) verified for **From** and test **To** in sandbox mode where applicable.
- [ ] No production Twilio keys required for this pilot wave (default).

## Lead recipient readiness

- [ ] Inbox or alias monitored by **Pilot Owner** and **Backup Owner**.
- [ ] Spam / abuse handling path known (P0 triage).

## Support readiness

- [ ] Support alias or ticketing project for pilot merchants.
- [ ] Internal escalation path documented (see `docs/ops/VIONA_COMMERCIAL_PILOT_OPS_RUNBOOK.md` §9).

## Manual ops readiness

- [ ] Triage labels (P0–P3) agreed.
- [ ] SLA proposals reviewed or marked **Needs confirmation**.
- [ ] Email templates available (`AI_RECEPTIONIST_MANUAL_OPS_RUNBOOK.md` §7).

## Legal / consent readiness

- [ ] Pilot consent + acknowledgement copy reviewed for target markets.
- [ ] **No recording** commitment unless separate consent product exists and is enabled.
- [ ] Health / legal / finance verticals: **intake-only** messaging verified.

## AI safety readiness

- [ ] No autonomous booking confirmation in pilot scope.
- [ ] No payment capture in pilot scope.
- [ ] No inventory or bill automation in pilot scope.
- [ ] Demo/simulator surfaces labeled as non-production (see Pack C.2 audit).

## Merchant pilot readiness

- [ ] Merchant understands **manual confirmation** for real appointments / orders.
- [ ] Primary and backup contact at merchant site identified.
- [ ] Languages and hours documented.

## No-go conditions (stop or defer)

- [ ] Any **SEV1** incident open (see runbook §9.2).
- [ ] Missing **Pilot Owner** or **Backup Owner**.
- [ ] Lead relay misconfigured without fallback comms to merchants.
- [ ] Pressure to enable **Twilio production**, **auto-payment**, or **auto-booking** without approved gates — **do not proceed**.

---

## Optional local script

Run `npm run ops:readiness` from repo root for a **non-blocking** documentation and `.env.example` key-name presence check (does not read secret values).
