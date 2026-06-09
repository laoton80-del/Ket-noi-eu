# VIONA Forbidden Claims Checker

## Purpose

`scripts/viona-forbidden-claims-check.mjs` is a **manual audit tool** for VIONA's no-fake-production boundary (Operating Protocol §1.1). It scans source and docs for phrases that may imply production payment, SOS dispatch, AI autonomy, or official/legal/medical outcomes before those systems are truly approved.

**This is not yet a mandatory CI gate.** Pack D2E adds narrow path/context allowlists so legitimate domain terms (marketing `dispatched`, admin CRM `PAID`, immigration `Settled`, ops docs) do not pollute the REVIEW queue. New user-facing risks still surface as BLOCKER/REVIEW.

## Severity levels (Pack D2B + D2E)

| Severity | Meaning |
|----------|---------|
| **BLOCKER** | Likely user-facing fake-production claim (i18n, screens, strong phrases). Default mode exits non-zero. |
| **REVIEW** | Suspicious phrase needing human review (ambiguous payment copy, config surfaced to UI, audit docs). |
| **ALLOWED_DOMAIN_TERM** | Legitimate code/domain reference (payment services, wallet ledger, negated disclaimers, status enums, tests). |
| **DOC_EXAMPLE** | Docs/audit/protocol text listing forbidden examples or safety rules — not runtime copy. |

## Categories

### Payment / Wallet

Flags wording that can imply money moved, funds held/released, or completed financial outcomes.

**Not auto-BLOCKER** when found in: payment/wallet/ledger services, pricing config, migrations, internal docs, tests, negated disclaimers (`not paid`, `not settled`, `≠ paid`).

**BLOCKER / REVIEW** when found in: i18n strings, screen labels, CTAs, marketing copy implying live payment without gates.

### SOS / Global Lifeline

Flags dispatch, live GPS sharing, authority notification, recording started.

**Not auto-BLOCKER** when negated (`does not dispatch`, `not an emergency service`, `call local emergency number`, `preview only`, `guidance only`) or when `dispatched` is a **marketing automation** trigger status in `src/services/marketing/*` (Pack D2E allowlist).

### D2E path/context allowlists (narrow)

These downgrade to `ALLOWED_DOMAIN_TERM` or `DOC_EXAMPLE` — they do **not** hide new user-facing risks elsewhere:

| Context | Example | Why safe |
|---------|---------|----------|
| `src/services/marketing/*` | `BrainRunStatus = 'dispatched'` | Campaign trigger sent — not SOS dispatch |
| `src/screens/admin/SalesLeadCRM.tsx` | `SALES_LEAD_STATUS.PAID` | Admin CRM pipeline enum |
| `src/screens/admin/*` + `(mock)` | Cash-Out · Treasury (mock) | Admin demo surface |
| `src/i18n/strings.ts` + `residencyStatus*` | `'Settled'` | Immigration label — not payment settlement |
| `__DEV__` console | `hooks settled` | React lifecycle diagnostic |
| Internal code vars | `const paid =`, `const payout =` | Not user-facing copy |
| `mvpSurfaceGate` | cash-out **not enabled** | Negative surface gate |
| `docs/handoff/*`, `docs/P4_*`, `docs/PILOT_*`, `docs/RECEIPT_*` | schema `status: 'paid'` | Ops/runbook docs — not runtime copy |
| i18n negation | `simulator only`, `not a confirmed paid appointment` | Explicit disclaimer |

### AI Autonomy

Flags autonomous call/book/pay/settle without human confirmation.

**Allowed in docs** when describing prohibited behavior or future gated phases.

### Legal / Medical / Official

Flags official certificate, guaranteed legal/medical outcomes, government approval.

**Not BLOCKER** when negated (`not medical advice`, `not legal advice`, `not an official certificate`).

## How to run

```bash
# Default — exit non-zero only on BLOCKER
node scripts/viona-forbidden-claims-check.mjs

# Strict — exit non-zero on BLOCKER or REVIEW
node scripts/viona-forbidden-claims-check.mjs --strict

# JSON output (includes full findings list)
node scripts/viona-forbidden-claims-check.mjs --json

# Legacy fail-on-any (all severities)
node scripts/viona-forbidden-claims-check.mjs --fail-on-any

# Write baseline snapshot (optional)
node scripts/viona-forbidden-claims-check.mjs --write-baseline
```

Scans:

- `src/**/*.ts`, `src/**/*.tsx`, `src/**/*.json`
- `docs/**/*.md`

Ignores: `node_modules`, build artifacts, binary assets.

## Why the baseline is noisy

The monorepo contains **real payment/wallet/SOS/AI implementation code** and **hundreds of internal audit/architecture docs** that mention domain terms (`escrow`, `payout`, `settled`, `dispatched`) in technical or negated contexts. Pack D2B classifies these as `ALLOWED_DOMAIN_TERM` or `DOC_EXAMPLE` instead of treating every match as a release failure.

## How to fix real findings

When a **BLOCKER** or confirmed **REVIEW** is user-facing and misleading:

1. Rewrite to honest readiness: **Lite**, **Demo**, **Pilot**, **Beta**, **Gated**, **Coming Soon**, **Preview**.
2. Add clear negation where needed: "does not dispatch", "not payment captured", "simulator only".
3. Never fake: payment captured, refund guaranteed, SOS dispatch, GPS shared, AI autonomous booking/payment, official certification, medical/legal guarantees.
4. Do **not** silently whitelist runtime copy. The marker below is for docs/examples only:

```txt
VIONA_FORBIDDEN_CLAIMS_ALLOWED_EXAMPLE
```

## Import recommendation

| Phase | Action |
|-------|--------|
| **Now** | Import as **manual audit tool** on release waves touching money, SOS, AI telephony, or merchant surfaces. |
| **Optional** | After D2E baseline refresh, `--strict` can PASS when REVIEW = 0 — still not wired to CI until operator approves. |
| **Not yet** | Do not use `--fail-on-any` as a mandatory gate — too many domain-term matches before triage. |

See also: `docs/ai-context/VIONA_FORBIDDEN_CLAIMS_BASELINE_TRIAGE.md`
