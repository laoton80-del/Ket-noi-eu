# VIONA Forbidden Claims Baseline Triage (Pack D2B + D2E)

**Generated:** Pack D2B Cursor refinement; Pack D2E allowlist/baseline refresh after D2D copy fixes (`8878854`).

## Summary (post-D2E)

| Severity | Count | Action |
|----------|------:|--------|
| BLOCKER | 0 | None auto-failing default gate |
| REVIEW | 0 | Queue cleared via narrow path/context allowlists |
| ALLOWED_DOMAIN_TERM | ~687 | Domain/negation/status vocabulary — no action |
| DOC_EXAMPLE | ~502 | Internal audit/ops/handoff docs — no action |

**History:** D2B raw ~1111 matches → D2B triage ~46 REVIEW → D2D copy fix −5 REVIEW → D2E allowlist −41 REVIEW.

## D2E allowlist groups absorbed

### 1. Marketing automation `dispatched` (19 findings)

- Files: `src/services/marketing/AutoPilotBrain.ts`, `AutoTriggerService.ts`
- Downgrade: `ALLOWED_DOMAIN_TERM`
- Rationale: Campaign/trigger dispatch status — not SOS/emergency dispatch.

### 2. Admin CRM `PAID` (5 findings)

- File: `src/screens/admin/SalesLeadCRM.tsx`
- Downgrade: `ALLOWED_DOMAIN_TERM`
- Rationale: Internal sales pipeline enum — not user wallet/payment claim.

### 3. Immigration `Settled` (1 finding)

- File: `src/i18n/strings.ts` (`residencyStatusDinhCu`)
- Downgrade: `ALLOWED_DOMAIN_TERM`
- Rationale: Residency label — not payment settlement.

### 4. `__DEV__` hooks settled (1 finding)

- File: `src/screens/WalletTopUpScreen.tsx`
- Downgrade: `ALLOWED_DOMAIN_TERM`
- Rationale: React hooks diagnostic — not payment settlement.

### 5. Admin mock cash-out / payout (2 findings)

- File: `src/screens/admin/AdminDashboardScreen.tsx`
- Downgrade: `ALLOWED_DOMAIN_TERM`
- Rationale: Admin-only mock fintech scanner — `(mock)` label.

### 6. Internal code variables (4 findings)

- Files: `LocalScreen.tsx` (`paid`), `LocalFixerCheckoutScreen.tsx` (`payout`)
- Downgrade: `ALLOWED_DOMAIN_TERM`
- Rationale: Internal result variables — not user-facing strings.

### 7. Surface gate negative disclaimer (1 finding)

- File: `src/navigation/mvpSurfaceGate.tsx`
- Downgrade: `ALLOWED_DOMAIN_TERM`
- Rationale: Explicit cash-out **not enabled** message.

### 8. i18n negated disclaimers (2 findings)

- File: `src/i18n/locales/en.json` (`simulator only`, `not a confirmed paid appointment`)
- Downgrade: `ALLOWED_DOMAIN_TERM` via expanded negation patterns.

### 9. Ops/handoff documentation (6 findings)

- Files: `docs/handoff/*`, `docs/P4_*`, `docs/PILOT_*`, `docs/RECEIPT_*`
- Downgrade: `DOC_EXAMPLE`
- Rationale: Runbook/schema docs — not runtime copy.

## What should NOT be auto-fixed

- Payment service variable names, types, and ledger terminology
- Prisma/Supabase migration SQL
- Negative disclaimers and semantic color doctrine comments
- Booking/request status enums (`dispatched`, `escrow`, `settled` as state names)
- Internal audit markdown listing forbidden phrases for reviewers
- Test fixtures describing payment flows

## Checker modes (post-D2E)

```bash
node scripts/viona-forbidden-claims-check.mjs          # PASS (BLOCKER=0)
node scripts/viona-forbidden-claims-check.mjs --strict # PASS (REVIEW=0)
node scripts/viona-forbidden-claims-check.mjs --json
node scripts/viona-forbidden-claims-check.mjs --write-baseline
```

## Import recommendation

**A) Ready for D2E allowlist/baseline commit** — `--strict` now PASS with REVIEW=0. Still **manual audit tool only** until operator wires CI.

New user-facing copy outside allowlisted paths still surfaces as BLOCKER/REVIEW. Allowlists are **narrow and path-based** — they do not blanket-whitelist payment/SOS phrases repo-wide.

See also: `docs/ai-context/VIONA_FORBIDDEN_CLAIMS_CHECKER.md`
