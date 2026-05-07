# VIONA Merchant Pilot Evidence Log — Rehearsal 001

## Rehearsal Metadata

- **Rehearsal ID:** `VIONA-MP-001`
- **Date:** 2026-05-07
- **Operator:** Codex (ops-only documentation run)
- **Branch:** `rehearsal-merchant-pilot-001`
- **Commit:** `ec2379c` (baseline before doc record)
- **Environment:** local / manual rehearsal
- **Device:** Not visually executed in this run — needs manual device/browser verification
- **Locale:** Not visually executed in this run — expected Smart Trio context only
- **Market:** CZ
- **Pilot type:** AI Receptionist Demo + Manual Ops

## Merchant Candidate

- **Business name:** VIONA Demo Nails & Spa
- **Industry:** Beauty & Wellness (`industryId` needs manual operator confirmation in live form)
- **Country/market:** CZ
- **Merchant language:** Vietnamese
- **Expected customer language:** Czech / English
- **Contact channel:** Mock only (no real merchant contact used in this rehearsal)
- **Consent status:** Demo-only / no real customer call

## Steps Performed

| Step | Expected | Actual | Pass/Fail | Evidence link/note |
|------|------------|--------|-----------|---------------------|
| 1. Candidate checklist | All must-pass rows satisfied | Checklist reviewed for mock readiness; owner/support rows unresolved | Conditional | `docs/ops/VIONA_MERCHANT_PILOT_CANDIDATE_CHECKLIST.md` |
| 2. Open pilot request screen | Loads without crash | Not visually executed in this run — needs manual device/browser verification | Needs user action | `src/screens/b2b/AiReceptionistPilotRequestScreen.tsx` compiles in readiness suite |
| 3. Complete acknowledgements | All required toggles/text | Not visually executed in this run — needs manual device/browser verification | Needs user action | Acknowledgement states exist in screen source (`consentAccepted`, `manualOpsAck`, `noAutonomousAck`) |
| 4. Submit (or dry walk) | Safe pilot path; no prod automation | Dry-run only; no submit to real merchant path performed | Pass | Ops-only run; no provider calls |
| 5. Lead path verification | Recipient known or documented fallback | Lead recipient mailbox/support path unresolved | Needs user action | `VIONA_AI_RECEPTIONIST_LEAD_RECIPIENT_EMAIL` requires real owner confirmation |
| 6. Setup checklist screen | Visible; notes captured | Not visually executed in this run — needs manual device/browser verification | Needs user action | `src/screens/b2b/AiReceptionistSetupChecklistScreen.tsx` available in repo |
| 7. Demo simulator | Demo-only behavior | Not visually executed in this run — needs manual device/browser verification | Needs user action | `src/screens/b2b/AiReceptionistDemoSimulatorScreen.tsx` available in repo |
| 8. Cost guard / usage preview | Visible or N/A documented | Readiness check PASS; UI preview not visually executed | Pass (non-visual) | `npm run ai:cost-readiness`, `npm run ai:usage-preview-readiness` |
| 9. Admin alert preview | Preview only | Readiness check PASS; UI preview not visually executed | Pass (non-visual) | `npm run ai:admin-alert-readiness` |
| 10. Incident dry-run preview | Preview only | Readiness check PASS; UI preview not visually executed | Pass (non-visual) | `npm run incident:dry-run-readiness` |
| 11. Assign owners | Pilot + backup named | Pilot Owner/Backup not assigned | Fail | Needs owner assignment |
| 12. Go/No-Go decision | Recorded | Recorded below | Pass | See Decision section |

## Safety Verification

| Guard | Expected | Observed | Pass/Fail |
|-------|----------|----------|-----------|
| No Twilio production call | Zero production voice/SMS | `twilio:sandbox-readiness` PASS; no live dialing executed | Pass |
| No payment | No Stripe success / no wallet debit as rehearsal goal | No payment flow executed | Pass |
| No booking mutation | No production-confirmed booking | No booking mutation executed | Pass |
| No DB migration | No schema change during session | No Prisma/schema/migration changes | Pass |
| No AI production action | No tool execution that mutates money/inventory/booking | No production AI action executed | Pass |
| Manual ops acknowledgement | Recorded | Expected in pilot request flow; not visually executed in this run | Needs user action |
| Consent acknowledgement | Recorded | Expected in pilot request flow; not visually executed in this run | Needs user action |
| Cost guard visible | Or documented N/A with reason | Guard/readiness script PASS; visual check pending | Conditional |
| Alert preview visible | Preview-only surfaces | Readiness script PASS; visual check pending | Conditional |
| Incident dry-run visible | Preview-only surfaces | Readiness script PASS; visual check pending | Conditional |
| Brand/i18n readiness pass | Brand trust pre-demo | `brand:i18n-readiness` PASS (warnings allowlisted) | Pass |

## Readiness command results

| Command | Result | Notes |
|---------|--------|-------|
| `npm ci` | PASS | Exit 0 |
| `npm run ci:expo-readiness` | PASS | Sentry org/project warning only |
| `npm run typecheck` | PASS | Includes Prisma client generation |
| `npm run lint` | PASS | 0 errors, existing warnings |
| `npm run ci:release-discipline` | PASS | Trust/commercial preflight chain PASS |
| `npm run brand:i18n-readiness` | PASS | Warnings only (allowlisted internal legacy markers) |
| `npm run pilot:rehearsal-readiness` | PASS | Rehearsal docs/scripts anchors present |
| `npm run gate:production-readiness` | PASS | Global gate anchors present |
| `npm run ops:readiness` | PASS | Ops anchors present |
| `npm run ai:cost-readiness` | PASS | AI cost guard anchors present |
| `npm run twilio:sandbox-readiness` | PASS | Sandbox readiness only |
| `npm run ai:usage-readiness` | PASS | Metering anchors present |
| `npm run ai:usage-preview-readiness` | PASS | Preview anchors present |
| `npm run ai:auto-pause-readiness` | PASS | Dry-run policy anchors present |
| `npm run ai:admin-alert-readiness` | PASS | Preview alert anchors present |
| `npm run incident:dry-run-readiness` | PASS | Dry-run incident anchors present |

## Constraints status

- **Twilio:** disabled in this rehearsal (no production call)
- **Payment:** disabled
- **Booking mutation:** no production booking
- **DB:** no new migration / no production mutation
- **Provider calls:** none executed
- **Real notifications:** not sent

## Decision

- **Internal demo ready?** **conditional** — readiness commands pass; visual rehearsal steps still need manual device/browser verification.
- **Controlled merchant pilot ready?** **conditional/no-go for real outreach now** — needs owner assignment + real lead path smoke test.
- **Public beta ready?** **no-go**
- **Global production ready?** **no-go**
- **Blockers:** Owner assignment, backup owner assignment, support path confirmation, live lead recipient confirmation, manual visual execution evidence.
- **Owner sign-off:** Needs owner assignment.
- **Next action:** Assign owners and run an operator-led visual rehearsal following `docs/ops/VIONA_MERCHANT_PILOT_REHEARSAL_RUNBOOK.md`.
