# VIONA Merchant Pilot Evidence Log Template

> Copy this file for each rehearsal session. **Do not commit** real PII or secrets into the git repo — store attachments in your approved evidence store.

## Rehearsal Metadata

- **Rehearsal ID:** `RHE-YYYYMMDD-###`
- **Date:** 
- **Operator:** 
- **Branch:** 
- **Commit:** (`git rev-parse HEAD`)
- **Environment:** (e.g. local dev client / internal build / staging — specify)
- **Device:** (OS version, app build number)
- **Locale:** (device locale + in-app language)
- **Market:** (country/region under test)

## Merchant Candidate

- **Business name:** 
- **Industry:** (`industryId` + display name)
- **Country/market:** 
- **Merchant language:** 
- **Expected customer language:** 
- **Contact channel:** (email/phone — redact in shared copies)
- **Consent status:** (documented / pending / not obtained — **No-Go** if not obtained for real pilot)

## Steps Performed

| Step | Expected | Actual | Pass/Fail | Evidence link/note |
|------|------------|--------|-----------|---------------------|
| 1. Candidate checklist | All must-pass rows satisfied | | | |
| 2. Open pilot request screen | Loads without crash | | | |
| 3. Complete acknowledgements | All required toggles/text | | | |
| 4. Submit (or dry walk) | Safe pilot path; no prod automation | | | |
| 5. Lead path verification | Recipient known or documented fallback | | | |
| 6. Setup checklist screen | Visible; notes captured | | | |
| 7. Demo simulator | Demo-only behavior | | | |
| 8. Cost guard / usage preview | Visible or N/A documented | | | |
| 9. Admin alert preview | Preview only | | | |
| 10. Incident dry-run preview | Preview only | | | |
| 11. Assign owners | Pilot + backup named | | | |
| 12. Go/No-Go decision | Recorded | | | |

## Safety Verification

| Guard | Expected | Observed | Pass/Fail |
|-------|----------|----------|-----------|
| No Twilio production call | Zero production voice/SMS | | |
| No payment | No Stripe success / no wallet debit as rehearsal goal | | |
| No booking mutation | No production-confirmed booking | | |
| No DB migration | No schema change during session | | |
| No AI production action | No tool execution that mutates money/inventory/booking | | |
| Manual ops acknowledgement | Recorded | | |
| Consent acknowledgement | Recorded | | |
| Cost guard visible | Or documented N/A with reason | | |
| Alert preview visible | Preview-only surfaces | | |
| Incident dry-run visible | Preview-only surfaces | | |

## Validation commands (optional attach)

Paste **redacted** output (no secrets):

```text
npm run pilot:rehearsal-readiness
npm run gate:production-readiness
npm run ops:readiness
```

## Decision

- **Internal demo ready?** yes / no / conditional — notes:
- **Controlled merchant pilot ready?** yes / no / conditional — notes:
- **Blockers:** 
- **Owner sign-off:** (name, date)
- **Next action:** 
