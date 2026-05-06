# VIONA Commercial Pilot Ops Runbook

This document is the **cross-program** commercial operations runbook for **merchant pilots** that remain **manual-ops assisted**. It complements the narrower technical flow in `docs/ai-context/AI_RECEPTIONIST_MANUAL_OPS_RUNBOOK.md` (AI Receptionist email relay).

**Applies to**

- **AI Receptionist Pilot** — in-app pilot request, demo/simulator, setup checklist; lead relay when API + env are configured.
- **Local Commerce Booking Request Pilot** — booking *requests* or draft intake where product copy and policy require **merchant confirmation** before any fulfillment, payment, or inventory change.

**Out of scope for this runbook**

- Production autonomous telephony (Twilio production).
- Payment capture, wallet movement, Stripe live behavior changes.
- Autonomous booking confirmation, inventory mutation, or bill printing.

---

## 1. Pilot Scope

- **AI Receptionist Pilot** — intake, evaluation, manual review; no autonomous phone calls from pilot forms or demo surfaces alone.
- **Local Commerce Booking Request Pilot** — customer/merchant flows that produce **requests** or drafts; no finalized booking without merchant (or policy-defined) confirmation.
- **Manual Ops assisted only** — humans triage, qualify, and schedule next steps.
- **No autonomous phone calls** — no outbound Twilio production from pilot intake; any future sandbox/pilot calling requires separate approval and env.
- **No payment capture** — pilot intake must not collect card/wallet capture as part of “pilot signup” unless a separate, approved commercial pack explicitly covers it (default: **no**).
- **No finalized booking without merchant confirmation** — treat app state as **draft / request** until merchant workflow confirms.
- **No inventory mutation** — AI and pilot intake do not adjust live stock.
- **No bill printing** — no automated fiscal receipt / bill print from pilot surfaces.

---

## 2. Pilot Roles

| Role | Responsibility |
|------|----------------|
| **Pilot Owner** | End-to-end pilot success, prioritization, go/no-go recommendation. |
| **Backup Owner** | Covers Pilot Owner PTO/incidents; same access to lead inbox and runbooks. |
| **Technical Owner** | API/env health, relay failures, non-production feature alignment; no silent prod changes. |
| **Merchant Success Owner** | Merchant onboarding, expectations, training on manual confirmation flows. |
| **Safety / Compliance Owner** | Consent, data minimization, escalation on safety or legal-sensitive verticals (health, legal, finance). |

**Needs owner assignment** — until named people and backup are recorded in your internal roster (not this repo), treat every pilot action as **blocked at governance**.

---

## 3. Lead Intake Flow

### 3.1 Sources

| Source | Channel | Notes |
|--------|---------|--------|
| App — AI Receptionist | `AiReceptionistPilotRequestScreen` → `POST /api/ai-receptionist/pilot-leads/email` (when API configured) | Payload type `SubmitAiReceptionistPilotLeadPayload` in `src/services/api/aiReceptionistLeadApi.ts`. |
| App — Local Commerce | Booking **request** / clarity flows per product audit (`docs/audit/VIONA_PACK_E_LOCAL_COMMERCE_BOOKING_CLARITY_AUDIT.md`) | Must remain consistent: **request**, not silent confirmation. |

### 3.2 Expected lead fields (AI Receptionist)

| Field | Purpose |
|-------|---------|
| `businessName` | Merchant identity. |
| `industry` | Mapped coarse industry for routing (see app mapping). |
| `city`, `country` | Geo / timezone / compliance hints. |
| `contactName`, `contactPhone`, `contactEmail` | Reachability (at least one of phone/email required in UI). |
| `languagesNeeded` | Customer-facing language expectations. |
| `estimatedMissedCallsPerDay` | Capacity / urgency signal. |
| `desiredAutomation` | Intentionally constrained enum in API types. |
| `preferredPilotDate` | Scheduling hint. |
| `notes` | Free text + **structured appendices** (industry registry block + pilot safety posture + Smart Trio line) appended client-side for manual ops triage. |
| `consentAccepted` | Must be `true` to submit. |

### 3.3 Industry and language evidence

- **`industryId`** — embedded in `notes` appendix as `industryId: …` (see Pack C.2 hardening).
- **Merchant / customer language expectation** — Smart Trio preview line in appendix + merchant-stated `languagesNeeded`.

### 3.4 Consent acknowledgements

- UI collects consent + manual-ops acknowledgement + no-autonomous booking/payment acknowledgement; evidence should appear in **submitted** lead body or ops CRM when wired.

### 3.5 Support mailbox / lead recipient env

- **`VIONA_AI_RECEPTIONIST_LEAD_RECIPIENT_EMAIL`** — internal inbox for AI Receptionist pilot lead relay (see `src/services/ai-receptionist/AiReceptionistLeadEmailService.ts`).
- **SES sender** — one of `AWS_SES_SENDER_EMAIL` | `MAIL_FROM` | `SES_FROM_EMAIL` (see `AI_RECEPTIONIST_MANUAL_OPS_RUNBOOK.md`).

---

## 4. Triage Flow

Use a single ops board or inbox label set:

| Priority | Meaning | Examples |
|----------|---------|----------|
| **P0** | Urgent / safety / abuse / data incident | Suspected spam to internal-only inbox, consent dispute, suspected minor data, legal threat. |
| **P1** | Merchant-ready lead | Complete contact, clear industry, consent + acks, realistic pilot scope. |
| **P2** | Incomplete lead | Missing reachability, vague automation ask, unclear geography. |
| **P3** | Spam / test | Internal QA, obvious junk. |

**Actions**

- **P0** — Safety/Compliance Owner + Pilot Owner within **1 business hour** (proposal; **Needs confirmation** until exec sign-off).
- **P1** — First human response **2 business days** (proposal).
- **P2** — Request info template (see `AI_RECEPTIONIST_MANUAL_OPS_RUNBOOK.md` Template A).
- **P3** — Archive with reason; no merchant-facing commitment.

---

## 5. SLA

All values are **default proposals** until leadership confirms.

| Metric | Target | Notes |
|--------|--------|--------|
| First response (P1) | **2 business days** | Acknowledgement only; not a scope commitment. |
| Merchant onboarding kickoff | **5 business days** after qualified | Schedule intro + demo checklist walkthrough. |
| Escalation window | **24h** if Pilot Owner unavailable | Backup Owner acts. |

**Needs confirmation** — legal/market-specific SLAs (EU consumer, health verticals) may require longer or stricter windows.

---

## 6. Manual Ops Workflow

1. **Receive lead** — email or future CRM webhook; timestamp and assign owner.
2. **Verify consent** — `consentAccepted` and acknowledgement flags consistent with stored body / screenshots if disputed.
3. **Verify industry** — playbook risk and blocked actions match merchant expectation; no over-promising automation.
4. **Verify merchant contact** — callback path; avoid single-point-of-failure comms.
5. **Schedule onboarding** — calendar; document “manual ops only” in invite.
6. **Run demo** — use in-app simulator + setup checklist; **no** production call from this step alone.
7. **Confirm pilot status** — qualified / needs info / waitlist / rejected (align with `AI_RECEPTIONIST_MANUAL_OPS_RUNBOOK.md` §5).
8. **Log outcome** — decision, reason, next step, owner initials; **retention policy Needs confirmation** (see §10).

---

## 7. Consent / Recording / Legal

- **No recording** without **explicit** merchant consent and product feature that supports recording flags (not enabled in pilot intake described here).
- **No outbound call production** without written approval + technical checklist (Twilio env separation).
- **No legal / medical / financial advice** as definitive counsel — professional services: **scheduling/intake only**; health: **scheduling only** per industry disclaimers.
- **Marketing truth** — do not claim autonomous booking, payment, or inventory sync unless a separate approved release gate says so.

---

## 8. AI Safety Boundaries

- AI **cannot** autonomously **confirm** a booking that binds inventory or merchant calendar without human/merchant workflow.
- AI **cannot** take **payment**.
- AI **cannot** modify **live inventory**.
- AI **cannot** **print** or finalize **bills** / fiscal documents.
- AI **cannot** **write production DB** directly from merchant chat as a side effect of pilot intake.
- AI **must** escalate **uncertainty** to human ops (ambiguous time, high-risk vertical, policy edge).

---

## 9. Support / Incident Process

### 9.1 Support email

- Use **`VIONA_AI_RECEPTIONIST_LEAD_RECIPIENT_EMAIL`** distribution list or alias monitored by Pilot Owner + Backup (minimum).
- For **product bugs** during pilot, use existing engineering intake (outside this doc).

### 9.2 Incident severity

| Severity | Definition | Who responds |
|----------|------------|----------------|
| **SEV1** | Data leak suspected, relay sending PII to wrong party, widespread form abuse | Safety/Compliance Owner + Technical Owner immediately |
| **SEV2** | Relay down > 4h business hours; merchants cannot submit leads | Technical Owner |
| **SEV3** | Single merchant bad UX, non-security | Merchant Success Owner |

### 9.3 What to log

- UTC time, lead id or email subject hash, triage label, owner, decision, follow-up date.
- **Do not** paste full PAN/card data; minimize PII in tickets.

### 9.4 When to pause pilot

- SEV1 open.
- Consent model challenged legally.
- Repeated mis-routing of leads or mis-set merchant expectations until root cause fixed.

---

## 10. Data Retention

| Data | Where it lives today | Retention |
|------|----------------------|-----------|
| Pilot lead email body | Ops mailbox / SES logs | **TBD** — align with DPO; **Needs confirmation** for GDPR Article 30 records. |
| App “draft” when relay unavailable | Device-local only | User-controlled; not VIONA server. |
| Structured appendix in `notes` | Same as lead body | Same as lead retention. |

**GDPR / privacy** — **Needs confirmation** for lawful basis documentation (legitimate interest vs consent marketing), DPIA for health-adjacent merchants, and subprocessors list.

---

## 11. Smoke Test Checklist

- [ ] Submit pilot request from app (staging or prod API as applicable).
- [ ] **Receive lead** in `VIONA_AI_RECEPTIONIST_LEAD_RECIPIENT_EMAIL` inbox (or capture 503 / local draft path if relay off).
- [ ] Confirm **`notes`** contains industry appendix + pilot posture appendix (Pack C.2).
- [ ] Confirm **no production Twilio** call triggered by submission.
- [ ] Confirm **no payment** taken.
- [ ] Confirm **no booking mutation** from submission.
- [ ] Confirm **Pilot Owner** can triage within SLA test window.

---

## 12. Go / No-Go Gate

| Requirement | Status | Evidence | Owner |
|-------------|--------|----------|--------|
| Lead recipient env set | **Needs confirmation** | SES + recipient verified | Technical Owner |
| Pilot Owner + Backup named | **Needs owner assignment** | Internal roster | Pilot Owner |
| Safety copy reviewed (app + email template) | **Needs confirmation** | Link to release + screenshots | Safety/Compliance Owner |
| Manual ops workflow trained | **Needs confirmation** | Training log | Merchant Success Owner |
| No Twilio prod in pilot scope | Pass | Config audit | Technical Owner |
| No payment/booking automation in pilot scope | Pass | Product + API review | Pilot Owner |

---

## 13. Next Steps

- **AI cost firewall / usage metering** — before scaling demos or model-backed features.
- **Twilio sandbox / pilot only** — after separate approval, env isolation, and legal review.
- **Payment / ledger** — only after approved commercial and technical gates.
- **Merchant pilot launch checklist** — extend `docs/ops/VIONA_COMMERCIAL_PILOT_CHECKLIST.md` with vertical-specific rows as programs mature.

---

## Related documents

- `docs/ai-context/AI_RECEPTIONIST_MANUAL_OPS_RUNBOOK.md` — AI Receptionist email relay detail.
- `docs/audit/VIONA_PACK_C2_AI_RECEPTIONIST_PILOT_HARDENING_AUDIT.md` — pilot UI and posture hardening.
- `docs/audit/VIONA_PACK_E_LOCAL_COMMERCE_BOOKING_CLARITY_AUDIT.md` — booking request clarity.
