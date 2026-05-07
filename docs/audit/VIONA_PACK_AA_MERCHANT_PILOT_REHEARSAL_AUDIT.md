# VIONA Pack AA Merchant Pilot Rehearsal Audit

**Date:** 2026-05-07  
**Branch:** `pack-aa-merchant-pilot-rehearsal`  
**Scope:** Ops-only rehearsal package (docs + read-only scripts). **No** app production behavior changes.

## 1. Summary

### What was added

- `docs/ops/VIONA_MERCHANT_PILOT_REHEARSAL_RUNBOOK.md` — end-to-end rehearsal flow, smoke checklist, Go/No-Go, failure paths.
- `docs/ops/VIONA_MERCHANT_PILOT_EVIDENCE_LOG_TEMPLATE.md` — per-session evidence and safety verification table.
- `docs/ops/VIONA_MERCHANT_PILOT_CANDIDATE_CHECKLIST.md` — merchant fit, no-go conditions.
- `scripts/merchant-pilot-rehearsal-check.mjs` — read-only file + `package.json` script presence check.
- `scripts/global-production-gate-check.mjs` + `npm run gate:production-readiness` — **restored on `master`** so rehearsal readiness can chain the same ops/AI anchors as Pack Z (no Pack Z audit file required on branch).

### Why rehearsal comes before real pilot

The codebase and docs consistently describe **pilot/demo/manual ops** posture for AI Receptionist, **Twilio sandbox** (not production calling), **dry-run / previewOnly** for admin alerts and incidents, and **`productionReady: false`** on AI cost guards. Rehearsal proves **people, lead paths, and evidence** before any real merchant relies on automation or revenue paths.

## 2. Current Pilot Readiness (repo evidence)

Evidence gathered with workspace search (ripgrep-style `Grep` tool; on Windows without `rg`, use `Select-String` / IDE search equivalently).

| Area | Current state | Pilot rehearsal gap | Risk | Recommendation |
|------|----------------|----------------------|------|------------------|
| **AI Receptionist lead intake** | `.env.example` documents `VIONA_AI_RECEPTIONIST_LEAD_RECIPIENT_EMAIL`; `ops-readiness-check.mjs` expects key **name** in example. Pilot screens and audits exist in repo history/docs. | Ops must **confirm** live inbox/CRM and **rehearse** capture without assuming email send in rehearsal. | Lead dropped or PII mishandled. | Fill owner + recipient; copy evidence template each run. |
| **Local Commerce booking request clarity** | Audits and B2C/B2B flows reference booking; Pack E audit cited in runbook when present. | Merchant may still expect auto-confirm. | Trust / chargeback. | Rehearsal step: **verbal + written** “manual confirm” + log. |
| **Merchant onboarding checklist** | `AiReceptionistSetupChecklistScreen` uses `productionReady` from checklist state for UI — **rehearsal is read-only** observation of copy/UX. | Checklist ≠ ops owners on file. | False confidence. | Link checklist completion to **named owners** in evidence log. |
| **Owner / backup owner** | Runbooks require roles; names often **Needs owner assignment** in template. | None assigned → **No-Go**. | SLA miss. | Assign before outreach. |
| **SLA** | Not enforced in code by this pack. | Undefined response time. | Merchant churn / incident. | Document hours in evidence log. |
| **Support mailbox** | SES sender / lead email names appear in docs and `ops-readiness`. | **Needs user action** for real addresses. | Silent failure. | Ops confirms inbox + spam rules. |
| **Lead evidence log** | **New** template added. | Prior sessions may lack standard evidence. | Audit gap. | Mandate template for each rehearsal. |
| **Smoke test evidence** | `npm run pilot:rehearsal-readiness` + manual checklist in runbook §6. | Smoke without logging = weak audit. | Regressions unnoticed. | Attach command output + screenshots. |
| **Incident dry-run** | `incident:dry-run-readiness` PASS; UI `previewOnly`. | Operators may confuse preview with live paging. | Wrong crisis response. | Rehearsal §5 step 11 + training. |
| **AI cost guard** | `ai:cost-readiness` PASS; all features `productionReady: false` in registry. | CFO may want per-tenant caps before paid pilot. | Spend overrun. | Keep guards visible in demo; no flip without gate review. |
| **Twilio sandbox readiness** | `twilio:sandbox-readiness` PASS; registry `productionReady: false`, `productionOutbound` blocked. | Rehearsal must **not** dial. | Compliance / cost. | **No call** during rehearsal; doc-only Twilio step. |
| **Payment/booking production blockers** | Stripe/DB/DATABASE_URL documented in `.env.example` and code; many flows pilot-gated in copy. | Real merchant may pressure for live pay. | Legal / zero-loss. | Explicit **No payment** in rehearsal success criteria. |
| **Legal/consent/recording** | Interpreter consent UI; pilot strings require acknowledgements. | Recording policy for B2B voice not exercised here. | GDPR / TCPA-like risk. | **Needs confirmation** with counsel before any voice. |
| **Smart Trio language expectation** | `src/core/i18n/**` present; locales `en`/`vi` include pilot/gated labels. | Merchant language vs device locale mismatch. | Bad UX / wrong tone. | Record both in evidence template. |

### Env / secret key names (documentation only)

Search for `VIONA_AI_RECEPTIONIST_LEAD_RECIPIENT_EMAIL`, `TWILIO_*`, `STRIPE`, `DATABASE_URL`, `DIRECT_URL` hits `.env.example`, `package.json` scripts, `scripts/ops-readiness-check.mjs`, `scripts/twilio-sandbox-readiness-check.mjs`, `docs/ops/*`, and various `src` / `docs` references — **no values read or committed** in this pack.

## 3. Rehearsal Package

| Artifact | Path |
|----------|------|
| Runbook | `docs/ops/VIONA_MERCHANT_PILOT_REHEARSAL_RUNBOOK.md` |
| Evidence log template | `docs/ops/VIONA_MERCHANT_PILOT_EVIDENCE_LOG_TEMPLATE.md` |
| Candidate checklist | `docs/ops/VIONA_MERCHANT_PILOT_CANDIDATE_CHECKLIST.md` |
| Readiness script | `scripts/merchant-pilot-rehearsal-check.mjs` → `npm run pilot:rehearsal-readiness` |
| Gate chain (dependency) | `scripts/global-production-gate-check.mjs` → `npm run gate:production-readiness` |

## 4. Pilot Rehearsal Flow (condensed)

1. **Lead intake** — form / submit path; recipient **Needs user action** if env unset.  
2. **Manual ops** — triage, owner + backup.  
3. **Setup checklist** — UI walkthrough, notes only.  
4. **Demo** — simulator screen; demo-only.  
5. **Evidence** — template + redacted command output.  
6. **Incident dry-run** — preview panel only.  
7. **Go/No-Go** — for **real** outreach per runbook §9–§10.

## 5. What This Does Not Do

- No Twilio production or unsanctioned live dial.  
- No payment, no booking mutation, no DB write/migration.  
- No provider API calls as part of these scripts.  
- No real email/Slack/SMS delivery required for pack validation.  
- No production AI tool actions.

## 6. Safety

| Question | Answer |
|----------|--------|
| payment touched? | **no** |
| booking touched? | **no** |
| wallet touched? | **no** |
| DB/Prisma touched? | **no** |
| AI production touched? | **no** |
| Twilio touched? | **no** (scripts/docs only) |
| route names changed? | **no** |
| feature flags changed? | **no** |

## 7. Validation

Commands run **2026-05-07** on branch `pack-aa-merchant-pilot-rehearsal` after `npm ci` (Windows, local).

| Command | Result | Notes |
|---------|--------|--------|
| `npm ci` | **PASS** | Exit 0 |
| `npm run ci:expo-readiness` | **PASS** | Sentry plugin: org/project optional (env fallback) |
| `npm run typecheck` | **PASS** | `prisma generate` + `tsc --noEmit` |
| `npm run lint` | **PASS** | 0 errors, **50 warnings** (pre-existing) |
| `npm run ci:release-discipline` | **PASS** | Includes trust + commercial prefights |
| `npm run ops:readiness` | **PASS** | |
| `npm run ai:cost-readiness` | **PASS** | |
| `npm run twilio:sandbox-readiness` | **PASS** | |
| `npm run ai:usage-readiness` | **PASS** | |
| `npm run ai:usage-preview-readiness` | **PASS** | |
| `npm run ai:auto-pause-readiness` | **PASS** | |
| `npm run ai:admin-alert-readiness` | **PASS** | |
| `npm run incident:dry-run-readiness` | **PASS** | |
| `npm run gate:production-readiness` | **PASS** | 8 docs, 10 core anchors, 10 scripts |
| `npm run pilot:rehearsal-readiness` | **PASS** | 5 docs, 10 scripts |

## 8. Gate Recommendation

| Gate | Recommendation |
|------|----------------|
| **Internal demo** | **Conditional Go** — rehearsal docs do not replace a successful **executed** rehearsal session. |
| **Controlled merchant pilot** | **Conditional Go** — only after owners assigned + evidence template completed + lead path **Needs user action** cleared for pilot. |
| **Public beta** | **No-Go** — unchanged from global gate posture. |
| **Global production** | **No-Go** — unchanged. |

## 9. Next Pack Recommendation

- **Pack AB — Brand / i18n alignment** (content-only) to reduce mixed legacy names before merchant-facing recordings.  
- **Executed rehearsal** (ops) after **Pilot Owner** assignment — no code.  
- **DB / payment / Twilio live** work only after **explicit** executive + legal + CFO approval (separate packs).
