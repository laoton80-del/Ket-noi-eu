# VIONA Pack J Commercial Ops Runbook Audit

## 1. Summary

**What was added**

- **`docs/ops/VIONA_COMMERCIAL_PILOT_OPS_RUNBOOK.md`** — cross-program commercial pilot operations: scope (AI Receptionist + Local Commerce booking **request** pilot), roles, lead intake, triage (P0–P3), SLA proposals, manual ops workflow, consent/recording/legal boundaries, AI safety, support/incidents, data retention placeholders, smoke tests, go/no-go gate, next steps.
- **`docs/ops/VIONA_COMMERCIAL_PILOT_CHECKLIST.md`** — machine-readable-style checklist for pre-flight pilot waves.
- **`scripts/ops-readiness-check.mjs`** — local-only checks: required docs exist; `.env.example` mentions key **names** for lead relay discoverability; **never reads secrets**; **always exit 0**.
- **`package.json`** — script `ops:readiness`.
- **`.env.example`** — optional documented line for `VIONA_AI_RECEPTIONIST_LEAD_RECIPIENT_EMAIL` (no secret values).

**Why this matters before merchant pilot**

- Pilots fail commercially when **intake, triage, owner, SLA, and failure paths** are undefined; this pack makes those explicit while keeping **production automation off** (Twilio/payment/booking autonomy per protocol).

## 2. Current Ops Gaps

| Area | Gap | Risk | Fix |
|------|-----|------|-----|
| AI Receptionist pilot lead intake | Relay depends on API + SES + recipient env; app can fall back to **local draft** | Ops thinks leads arrived; merchant waits | Run smoke test §11 of runbook; monitor relay errors |
| Manual ops handoff | Named owners may be **Needs owner assignment** | Dropped leads, inconsistent merchant experience | Assign Pilot Owner + Backup in internal roster |
| Support mailbox / lead recipient | Single env var `VIONA_AI_RECEPTIONIST_LEAD_RECIPIENT_EMAIL` | Missed or mis-filed leads | DL + backup reader; document in runbook §3.5 |
| Consent / recording / legal | Retention and lawful basis **TBD** | Compliance exposure | Legal/DPO sign-off on §7 and §10 |
| Owner / backup | Not stored in repo | Bus factor | Internal roster linked from runbook §2 |
| SLA | Numeric targets are **proposals** | Over-promise to merchants | Exec **Needs confirmation** |
| Lead log / evidence | No canonical CRM in repo | Audit trail weak | Log triage in ticket system |
| Failure path | Relay 503 / not configured | Merchant silent failure | Merchant Success follow-up + Template A |
| Incident process | Severity table new | Slow response | Train on §9 |
| Data retention | **TBD** in runbook | GDPR process gap | DPO decision |
| Merchant onboarding checklist | Checklist file is template | Incomplete pilots | Complete per merchant row |
| Smoke test evidence | Not automated | Regression | Manual checklist §11 |
| No Twilio production guard | Cultural + config | Accidental dial | Technical Owner gate |
| No payment/booking automation guard | Product + API discipline | Financial / double-booking | Pilot scope + code review |

## 3. Files Added

| File | Role |
|------|------|
| `docs/ops/VIONA_COMMERCIAL_PILOT_OPS_RUNBOOK.md` | Primary runbook |
| `docs/ops/VIONA_COMMERCIAL_PILOT_CHECKLIST.md` | Pre-flight checklist |
| `scripts/ops-readiness-check.mjs` | Non-blocking local/doc template check |
| `docs/audit/VIONA_PACK_J_COMMERCIAL_OPS_RUNBOOK_AUDIT.md` | This audit |
| `package.json` | `ops:readiness` script |
| `.env.example` | Document `VIONA_AI_RECEPTIONIST_LEAD_RECIPIENT_EMAIL` name |

## 4. Pilot Gates

| Gate | Requirement | Status |
|------|-------------|--------|
| G1 | Lead recipient env documented | Pass (`.env.example` + runbook) |
| G2 | Ops runbook + checklist in repo | Pass |
| G3 | Named Pilot Owner + Backup | **Needs owner assignment** |
| G4 | SLA numbers approved | **Needs confirmation** |
| G5 | Smoke test executed for wave | Ops process |
| G6 | No Twilio production in pilot | Policy Pass |
| G7 | No autonomous payment/booking | Policy Pass |

## 5. Safety

| Item | Touched? |
|------|----------|
| Payment | **no** |
| Booking | **no** |
| Wallet | **no** |
| DB / Prisma | **no** |
| AI production tool | **no** |
| Twilio production | **no** |
| Route names | **no** |
| Feature flags | **no** |

## 6. Validation

Run from repo root (local, 2026-05-06 — all exit **0**):

- `npm ci`
- `npm run ci:expo-readiness`
- `npm run typecheck`
- `npm run lint` (0 errors; existing repo warnings only)
- `npm run ci:release-discipline`
- `npm run ops:readiness`

Re-run on CI before merge.

## 7. Next Pack Recommendation

- **AI cost firewall / usage metering** — cap spend before broader pilots.
- **Twilio sandbox pilot** — only after approval + env isolation.
- **Payment / ledger** — only after commercial + technical gates.
- **Merchant pilot launch checklist** — vertical-specific rows (health, legal, F&B).
