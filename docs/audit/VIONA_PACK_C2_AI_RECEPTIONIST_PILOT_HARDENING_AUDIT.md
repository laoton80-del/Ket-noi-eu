# VIONA Pack C.2 AI Receptionist Pilot Hardening Audit

## 1. Summary

**What was hardened**

- **Copy and UI** on the B2B AI Receptionist **setup checklist**, **demo simulator**, and **pilot request** flows so merchants clearly see: pilot/demo/manual-ops posture, no production autonomous calling, no Twilio production from these surfaces, and no finalized booking/payment/inventory/bill from the client demo.
- **Structured pilot lead context** appended to the existing `notes` field only (no API schema or backend changes): industry registry appendix plus a **global pilot safety posture** block and a compact **Smart Trio locale line** for manual ops triage.
- **Pilot request** now requires explicit **manual ops** and **no autonomous booking/payment** acknowledgements alongside consent, and surfaces **Smart Trio** language legs as *expectation preview* (session-local).
- **i18n** (`en` / `vi`) for new and expanded `aiReceptionist.setup`, `aiReceptionist.demo`, and `aiReceptionist.pilot` keys.
- **Typed client-only posture** in `src/core/industries/aiReceptionistPilotPosture.ts` (`AI_RECEPTIONIST_GLOBAL_PILOT_POSTURE`, `buildPilotLeadStructuredAppendix`).

**Why this matters before merchant pilot**

- Reduces **mis-set expectations** (treating simulator or lead form as production voice, booking, or payment).
- Gives **manual ops** parseable signals in `notes` without changing server contracts.
- Aligns merchant-facing language with **VIONA operating protocol**: pilot first, human confirmation, no silent financial or inventory side effects from these screens.

## 2. Current Gaps

| Area | Gap (pre-Pack C.2 residual) |
|------|-----------------------------|
| **Setup checklist** | Some section titles (e.g. foundation guardrails, automation capabilities) remain English/config-driven; merchant checklist rows still use static English from `BASE_CHECKLIST_ORDER` (unchanged in this pack to avoid scope creep). |
| **Demo simulator** | Previously mixed hardcoded English with i18n; now unified for primary pilot/demo messaging. |
| **Pilot request** | Backend still receives the same payload shape; rich context relies on `notes` length and ops discipline. |
| **Industry playbooks** | Per-industry `pilotReadiness` fields on each playbook were **not** added app-wide; **global** posture constants document uniform limits for all industries in pilot/demo. |
| **Consent / manual ops** | Consent alone is insufficient for high-risk misinterpretation; added **dual acknowledgements** on the pilot form. |
| **Booking/payment/inventory/bill** | Clarified in UI and appendix; **no** enforcement change on server (out of scope). |
| **Lead relay / email** | Unchanged; relay availability and errors still depend on existing API configuration. |

## 3. Industry Playbook Safety

Global rule for **all** industries in pilot/demo UI: `AI_RECEPTIONIST_GLOBAL_PILOT_POSTURE` — human confirmation required, consent required, `canAutoConfirmBooking` / `canTakePayment` / `canModifyInventory` / `canPrintBill` all **false**, `manualOpsRequired` **true**.

| Industry group (registry) | Scheduling / intake only? | Blocked actions | Human confirmation |
|---------------------------|---------------------------|-----------------|--------------------|
| Beauty & wellness | Intake / draft request; policy varies by `bookingMode` in playbook | From playbook `blockedActions` | Yes (`confirmationPolicy` + global posture) |
| Food & retail | Lead / scheduling per playbook | From playbook | Yes |
| Stay & travel | Lead / availability per playbook | From playbook | Yes |
| Home & local services | Estimate / visit scheduling per playbook | From playbook | Yes |
| Professional services | Scheduling / intake only per playbook | From playbook | Yes |
| Education & community | Class intake per playbook | From playbook | Yes |
| Health (scheduling only) | Scheduling-only disclaimers | From playbook | Yes |

## 4. UI Behavior

| Surface | What changed (visual / copy) |
|---------|------------------------------|
| **Setup checklist** | Header uses i18n; when an industry is selected, playbook disclaimer, booking/risk/confirmation lines, blocked/allowed action IDs, and **global pilot posture** copy are shown. |
| **Demo simulator** | Full i18n for header, badge, safety card, timeline, transcript labels, draft booking card, CTAs; reinforces **request captured**, **merchant/manual ops confirm**, **no payment**, **no calendar/provider finalization**, **not in production system**. |
| **Pilot request** | Safety card, form labels/placeholders, privacy block, acknowledgements (manual ops + no autonomous limits + consent), Smart Trio expectation card, submit/confirm/draft previews, and errors use **vi/en** keys; `notes` sent to API include industry + posture appendices when submitted. |

## 5. Pilot Safety Boundaries

Confirmed for this pack:

- **No Twilio production** enabled or configured by these changes.
- **No real phone call** initiated from these screens.
- **No payment** taken from these screens.
- **No booking mutation** from these screens.
- **No inventory mutation** from these screens.
- **No bill printing** from these screens.
- **No DB / Prisma / schema** change.
- **No AI production tool action** invoked from the demo simulator (offline/scripted copy only).

## 6. What This Does Not Do

- No backend mutation, new endpoints, or auth changes.
- No payment flow, Stripe, or webhook changes.
- No Twilio call or voice pipeline wiring.
- No autonomous receptionist production rollout.
- No DB migration or Prisma update.
- No route name or feature-flag behavior changes.

## 7. Validation

Run from repository root (Windows / CI parity):

- `npm ci` — exit 0 (local, 2026-05-06)
- `npm run ci:expo-readiness` — exit 0
- `npm run typecheck` — exit 0 (includes `prisma generate`)
- `npm run lint` — exit 0 (warnings only, no errors)
- `npm run ci:release-discipline` — exit 0

Re-run the same suite on CI for the PR merge gate.

## 8. Next Pack Recommendation

- **Commercial ops runbook** — SOP for triaging pilot leads and posture blocks in `notes`.
- **AI cost firewall** — caps and alerts before broader demo traffic.
- **Twilio pilot only** — explicit approval gate and environment separation before any telephony.
- **Payment / ledger** — only after policy + engineering sign-off; never mixed with pilot lead capture.
