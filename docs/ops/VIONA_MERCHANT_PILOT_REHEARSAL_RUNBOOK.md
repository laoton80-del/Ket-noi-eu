# VIONA Merchant Pilot Rehearsal Runbook

## 1. Purpose

- Rehearse the **merchant pilot** workflow using **manual ops and evidence only** — no production automation.
- Validate that **owners, triage, and safety acknowledgements** work before inviting **real** merchants.
- **No Twilio production**; **no** live voice or SMS from this runbook.
- **No payment** capture, **no** booking confirmation as production truth, **no** inventory mutation, **no** bill printing.
- **No** Prisma migration and **no** authoritative DB-backed usage/incident log from rehearsal steps (preview/dry-run UI only).

## 2. Rehearsal Scope

### Included

- AI Receptionist **pilot request** flow (form, acknowledgements, submit path as designed for pilot).
- **Local Commerce** booking **request** explanation (clarity that merchant/manual ops confirms; see `docs/audit/VIONA_PACK_E_LOCAL_COMMERCE_BOOKING_CLARITY_AUDIT.md` if present).
- **Industry / playbook** review (`src/core/industries/**` as reference during rehearsal notes).
- **Smart Trio** language expectation (device locale + merchant/customer language notes in evidence log).
- **Lead intake** evidence (where the lead should appear: configured recipient vs local draft — **Needs user action** if env not set).
- **Manual ops triage** (assign owner, backup, SLA note).
- **Incident dry-run** acknowledgement (admin preview panel — preview only).
- **AI cost / usage guard** evidence (registry + in-app preview surfaces; `productionReady` remains false until explicit CFO/eng gate).

### Excluded

- Real phone calls (any Twilio **production** or unsanctioned sandbox dial).
- Real payment (Stripe live, wallet debit as production).
- Production booking confirmation as final state.
- Inventory mutation.
- Bill printing / fiscal finalization.
- Real notification delivery (email/Slack/SMS/push as production paths) — **Needs confirmation** per environment.
- DB-backed usage/incident logs as **authoritative** records (dry-run/preview only in app).

## 3. Roles Required

| Role | Required? | Assigned owner | Backup | Status |
|------|-----------|----------------|--------|--------|
| Pilot Owner | Yes | Needs owner assignment | Needs owner assignment | |
| Backup Owner | Yes | Needs owner assignment | — | |
| Merchant Success Owner | Yes | Needs owner assignment | Needs owner assignment | |
| Safety / Compliance Owner | Yes | Needs owner assignment | Needs owner assignment | |
| Technical Owner | Yes | Needs owner assignment | Needs owner assignment | |
| Ops Reviewer | Recommended | Needs owner assignment | — | |

Until names are filled, treat every cell as **Needs owner assignment** and **do not** start real merchant outreach.

## 4. Rehearsal Inputs

Prepare **before** the session (mock or real candidate — mock preferred for first rehearsal):

- **Mock merchant profile** (business name, vertical, rough volume).
- **`industryId`** (from industry registry / product mapping).
- **Merchant contact** (email or phone for **human** follow-up — not for auto-dial).
- **Merchant language** and **expected customer language** (Smart Trio / i18n expectation).
- **Consent acknowledgement** (pilot scope, recording policy if voice is ever enabled later — **not** exercised in this rehearsal).
- **Manual ops acknowledgement** (merchant or ops confirms human-in-loop).
- **No autonomous booking / payment** acknowledgement (aligned with pilot copy in `vi.json` / `en.json` for AI Receptionist).

## 5. Rehearsal Flow

1. **Select** pilot merchant candidate (use `docs/ops/VIONA_MERCHANT_PILOT_CANDIDATE_CHECKLIST.md`).
2. **Submit** AI Receptionist pilot request **or** walk the screen fields without sending if env missing — document **Needs user action** if submit is blocked.
3. **Confirm** lead recipient path: `VIONA_AI_RECEPTIONIST_LEAD_RECIPIENT_EMAIL` documented in `.env.example` vs actual ops inbox — **Needs user action** if unset.
4. **Capture** structured notes in `docs/ops/VIONA_MERCHANT_PILOT_EVIDENCE_LOG_TEMPLATE.md`.
5. **Assign** Pilot Owner and Backup Owner in the evidence log.
6. **Triage** lead (priority, industry, language, risk flags).
7. **Run** setup checklist screen (`AiReceptionistSetupChecklistScreen` — read-only verification of UI; no backend mutation required for rehearsal).
8. **Run** demo simulator (`AiReceptionistDemoSimulatorScreen` — confirm **demo** posture only).
9. **Verify** no booking mutation, no payment, no Twilio call, no provider API call from the rehearsal device/session (operator attestation + logs/screenshots).
10. **Record** evidence (appendix + commands in §7).
11. **Run** incident dry-run **preview** (in-app preview only; not a live incident record).
12. **Decide** Go / No-Go for **real** merchant outreach (see §9).

## 6. Smoke Test Checklist

Use as a **read-only** operator checklist during rehearsal:

- [ ] App opens on agreed build (branch/commit recorded).
- [ ] Pilot request screen loads (`AiReceptionistPilotRequestScreen`).
- [ ] Industry visible / selectable per product rules.
- [ ] Smart Trio / locale context documented (device locale + merchant languages).
- [ ] Acknowledgements required before submit (pilot / manual ops / no payment).
- [ ] Submit path is **safe** for pilot (no accidental production flag flip — operator verifies env).
- [ ] **No** Twilio call initiated (no outbound/inbound voice from rehearsal).
- [ ] **No** payment (no Stripe sheet, no wallet debit as rehearsal success criterion).
- [ ] **No** booking mutation (no production confirmation).
- [ ] Cost guard evidence visible (AI cost panel / registry-backed UI if applicable).
- [ ] Admin alert **preview** visible (dry-run / preview only).
- [ ] Incident dry-run **preview** visible (preview only).

## 7. Evidence Requirements

For **every** rehearsal, capture:

| Field | Notes |
|-------|--------|
| Date/time | UTC + local |
| Operator | Name / role |
| Branch/commit | `git rev-parse HEAD` |
| Merchant candidate | Mock or real (if real, redact PII in shared logs) |
| Industry | `industryId` + label |
| Screenshots or notes | Attach to evidence store (not necessarily git) |
| Validation commands | e.g. `npm run pilot:rehearsal-readiness` output |
| Observed result | Pass / fail per step |
| Failure path | If any (see §8) |
| Go/No-Go | For **real** outreach only |

## 8. Failure Path

Stop and document if **any** of the following occur:

| Condition | Action |
|-----------|--------|
| Lead not received (and recipient expected) | Verify env **Needs user action**; do not pretend delivery. |
| Env missing for pilot | Record blocker; use mock/dry walk only. |
| Owner or backup unassigned | **No-Go** for real outreach. |
| Unclear consent / recording posture | **No-Go** until Legal/Compliance Owner signs. |
| UI suggests **production** automation (copy or behavior) | Escalate to Product + Safety owner; **No-Go**. |
| Cost guard / preview surfaces missing | **No-Go** until engineering confirms regression. |
| Incident preview missing | **No-Go** until fixed (rehearsal incomplete). |
| **Any** accidental production behavior (payment, call, booking) | **Stop**; incident review; **No-Go**. |

## 9. Go / No-Go

| Requirement | Evidence | Status | Owner |
|-------------|----------|--------|-------|
| Candidate checklist complete | Link / attachment | Needs confirmation | Pilot Owner |
| Roles assigned (incl. backup) | Names in log | Needs owner assignment | Pilot Owner |
| Lead path understood | Env or documented fallback | Needs user action | Technical Owner |
| Smoke checklist complete | Signed log | | Ops Reviewer |
| Safety copy reviewed | Screenshots | | Compliance Owner |
| No production side effects | Operator attestation | | Technical Owner |

**Go** = all **Pass** with evidence on file. **No-Go** = any open **Needs user action** / **Needs confirmation** for P0 items.

## 10. What Must Be True Before Real Merchant Pilot

- Pilot Owner and **Backup** Owner assigned and reachable on **SLA** (document hours/timezone).
- **Support path** confirmed (mailbox, ticket queue, or phone for **human** merchant support — not AI-autonomous).
- **Lead recipient** confirmed for production pilot (`VIONA_AI_RECEPTIONIST_LEAD_RECIPIENT_EMAIL` or agreed CRM ingestion) — **Needs user action** in hosting.
- **Legal / consent / recording** stance reviewed for markets in scope.
- **Rehearsal evidence** archived (template + attachments).
- **No unresolved production blockers** from Pack Z gate audit (`docs/audit/VIONA_PACK_Z_GLOBAL_PRODUCTION_GATE_AUDIT.md` if present on branch) or equivalent risk review.
- **Merchant pilot script** (talk track + limitations) approved by GTM + Compliance.

## Related documents

- `docs/ops/VIONA_COMMERCIAL_PILOT_OPS_RUNBOOK.md`
- `docs/ops/VIONA_COMMERCIAL_PILOT_CHECKLIST.md`
- `docs/ops/VIONA_MERCHANT_PILOT_EVIDENCE_LOG_TEMPLATE.md`
- `docs/ops/VIONA_MERCHANT_PILOT_CANDIDATE_CHECKLIST.md`
- `docs/ops/VIONA_TWILIO_SANDBOX_PILOT_RUNBOOK.md` (documentation only for this rehearsal)
- `docs/audit/VIONA_PACK_C2_AI_RECEPTIONIST_PILOT_HARDENING_AUDIT.md` (if on branch)
