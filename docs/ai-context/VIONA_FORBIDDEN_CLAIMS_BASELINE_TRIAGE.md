# VIONA Forbidden Claims Baseline Triage (Pack D2B)

**Generated:** Pack D2B Cursor refinement on isolated worktree `ket-noi-eu-pack-d2`.

## Summary (post-D2B)

| Severity | Count | Action |
|----------|------:|--------|
| BLOCKER | 0 | None auto-failing default gate |
| REVIEW | ~46 | Human audit queue |
| ALLOWED_DOMAIN_TERM | ~606 | No action — domain/negation/status vocabulary |
| DOC_EXAMPLE | ~485 | No action — internal audit/architecture/runbook docs |

**Raw phrase matches (D2):** 1111 → **classified total:** ~1143 (same matches, split by severity).

## Noisy domains (expected)

### Payment / wallet (~1074 raw matches)

Most matches are **not** user-facing fake claims:

- Payment/wallet/ledger/stripe/billing service implementations
- Commercial entitlement config and pricing doctrine comments
- Semantic color docs (`paid ≠ settled` disclaimers in design tokens)
- Architecture/state-machine docs describing escrow, payout, capture as **domain vocabulary**

**Do NOT auto-fix** by deleting terms from service code or audit docs.

### SOS (~40–47 raw matches)

- Marketing automation `BrainRunStatus = 'dispatched'` (campaign dispatch, not emergency)
- Local merchant/request status UI enums (`dispatched` = request sent to merchant)
- Audit docs listing forbidden SOS phrases

**Do NOT auto-fix** status enum labels without product/UX review.

### AI autonomy (~1–8 raw matches)

Mostly docs or gated feature descriptions. Review individually if surfaced in i18n.

### Legal / medical / official (~7–10 raw matches)

Mostly audit checklists (`not medical diagnosis`) — classified DOC_EXAMPLE.

## Recommended cleanup phases

### Phase 1 — Manual audit import (now)

- Run `node scripts/viona-forbidden-claims-check.mjs` before money/SOS/AI/merchant release waves.
- Triage **REVIEW** only; ignore ALLOWED_DOMAIN_TERM and DOC_EXAMPLE.
- Default exit PASS is acceptable while BLOCKER = 0.

### Phase 2 — i18n / user copy (human)

Priority REVIEW files:

- `src/i18n/locales/*.json` — ambiguous `paid`, `captured`, `settled`, `payout` in user strings
- `src/screens/admin/SalesLeadCRM.tsx` — verify admin-only and gated copy
- Marketing services — ensure `dispatched` never surfaces as SOS language in UI

Fix pattern: add **Lite / Demo / Pilot / Preview** labels and negation; never imply live payment or emergency dispatch.

### Phase 3 — Docs hygiene (optional)

- Add `VIONA_FORBIDDEN_CLAIMS_ALLOWED_EXAMPLE` only to docs that intentionally list forbidden phrases.
- Keep audit docs as-is; checker already classifies `docs/audit`, `docs/architecture`, etc. as DOC_EXAMPLE.

### Phase 4 — CI gate (later)

- When BLOCKER stays 0 and REVIEW < ~20 in i18n/screens, consider `--strict` in CI.
- Do **not** enable `--fail-on-any` until raw grep noise is understood.

## What should NOT be auto-fixed

- Payment service variable names, types, and ledger terminology
- Prisma/Supabase migration SQL
- Negative disclaimers and semantic color doctrine comments
- Booking/request status enums (`dispatched`, `escrow`, `settled` as state names)
- Internal audit markdown listing forbidden phrases for reviewers
- Test fixtures describing payment flows

## Baseline artifact

Optional machine snapshot:

```bash
node scripts/viona-forbidden-claims-check.mjs --write-baseline
```

Writes `scripts/viona-forbidden-claims-baseline.json` (findings + summary). Not required for daily use.

## Import recommendation

**A) Safe to import as manual audit tool** — D2B severity triage makes the checker usable without blocking on 1000+ domain-term matches.

Not yet safe as mandatory CI gate (`--strict` still fails on ~46 REVIEW items).
