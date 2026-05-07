# VIONA Merchant Pilot Candidate Checklist

Use this **before** inviting a merchant into the **controlled pilot**. All items are **manual ops** judgments unless marked as technical verification.

## Business fit

- [ ] Merchant serves a geography and vertical **aligned** with pilot scope (no unsupported claims).
- [ ] Volume expectations documented (rough monthly conversations / bookings **aspirational** — not guaranteed).
- [ ] Merchant understands **pilot** is for learning and co-design, not full SLA production.

## Industry fit

- [ ] `industryId` / vertical matches product and **legal** posture (no high-risk vertical without extra review).
- [ ] Industry-specific disclaimers acknowledged (health/legal/financial — **no autonomous advice**).

## Language readiness

- [ ] Merchant **primary language** documented.
- [ ] Expected **customer language mix** documented (Smart Trio / i18n — device locale may differ from merchant language).
- [ ] Interpreter or human backup available if languages exceed automated coverage — **Needs confirmation** per market.

## Manual ops readiness

- [ ] **Pilot Owner** and **Backup Owner** assigned (see rehearsal runbook).
- [ ] Merchant accepts **human confirmation** for appointments, payments, inventory, and invoices.
- [ ] Internal **triage** path defined (who reads leads first, within what hours).

## Consent readiness

- [ ] **Consent** captured for pilot participation and for any **future** recording/voice features (even if not used in week 1).
- [ ] If voice is discussed: **recording** and **telecom** compliance **Needs user action** (legal review per jurisdiction).

## Support readiness

- [ ] **Support mailbox** or ticket queue reachable by merchant (human).
- [ ] **Escalation** path for incidents (on-call or backup) documented — align with `VIONA_INCIDENT_DRY_RUN_RUNBOOK.md` philosophy (dry-run in app; **human** process live).

## Risk exclusions

- [ ] Merchant **not** relying on VIONA for emergency services, regulated medical diagnosis, or licensed legal representation.
- [ ] Merchant **not** expecting guaranteed placement in app store search / ads without separate agreement.

## No-go conditions

**Do not** proceed with real merchant onboarding if **any** of the following are true:

- Merchant expects **autonomous outbound calls** immediately.
- Merchant expects **payment automation** or guaranteed capture immediately.
- Merchant expects **guaranteed booking confirmation** without human/merchant confirmation.
- **No consent** (pilot + communications).
- **No owner** (Pilot Owner unassigned).
- **No support path** (merchant cannot reach a human).
- Merchant expects **high-risk** legal/medical/financial **advice** as an automated outcome.

If a no-go condition applies, complete a **No-Go** line in the evidence log and schedule a **re-readiness** review.
