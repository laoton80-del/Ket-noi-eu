# VIONA.TOURISM.LEGACY_SETTLED_BACKFILL_RUNBOOK_1

**Document ID:** `VIONA.TOURISM.LEGACY_SETTLED_BACKFILL_RUNBOOK_1`  
**Script:** `scripts/backfills/backfill-tourism-settlement-metadata.ts`  
**Prerequisite migration:** `20260519120000_tourism_settlement_metadata`  
**Related design:** [VIONA_TOURISM_EXISTING_ROWS_COMPATIBILITY_1.md](../architecture/VIONA_TOURISM_EXISTING_ROWS_COMPATIBILITY_1.md)  

---

## Purpose

Mark existing **settle-on-book** `TourismBooking` rows so future **hold-on-submit** logic does not treat them as held-only rows.

This backfill **only** updates settlement metadata columns. It does **not**:

- Change `status`
- Create wallet `Transaction` rows
- Mutate `Wallet` balances
- Run settlement, refund, or cancellation

---

## Prerequisites

1. Schema merged to target branch (`TourismSettlementMode`, metadata columns on `TourismBooking`).
2. Migration applied in the target database:

```bash
npx prisma migrate deploy
```

3. `DATABASE_URL` points at the correct environment database.
4. Tourism wallet hold feature **not** enabled (`TOURISM_SETTLEMENT_MODE` remains legacy until sign-off).

---

## Commands

### Dry-run (default — no writes)

```bash
npx tsx scripts/backfills/backfill-tourism-settlement-metadata.ts
```

Optional:

```bash
npx tsx scripts/backfills/backfill-tourism-settlement-metadata.ts --sample-limit 20
```

### Apply (explicit flag required)

```bash
npx tsx scripts/backfills/backfill-tourism-settlement-metadata.ts --apply
```

---

## Expected dry-run output

```
[tourism-settlement-backfill] mode=DRY-RUN

[tourism-settlement-backfill] summary
  total scanned: <N>
  already tagged: <N>
  candidate legacy settled: <N>
  manual review (left UNKNOWN): <N>
  no action: <N>
  ledger corroboration (sample M): <K> matched provider BOOKING tx

[tourism-settlement-backfill] sample IDs
  already_tagged: ...
  candidate_legacy: ...
  manual_review: ...

[tourism-settlement-backfill] dry-run complete — no rows updated.
```

---

## Candidate detection (conservative)

A row is updated **only** when:

| Rule | Detail |
|------|--------|
| Mode | `settlementMode` is `UNKNOWN`, or `LEGACY_SETTLE_ON_BOOK` with missing `providerSettledAt` |
| Paid | `totalPaidVIG > 0` |
| Unsettled metadata | `providerSettledAt` is null |
| Strong signal | `netProviderEarningsVIG > 0` **or** `providerFeeVIG + touristFeeVIG > 0` |
| Or completed | `status = COMPLETED` |

**Manual review (not auto-updated):**

- `status = CANCELLED` with `totalPaidVIG > 0`
- `UNKNOWN` + paid but no fee signal and not `COMPLETED`

**Apply writes:**

- `settlementMode = LEGACY_SETTLE_ON_BOOK`
- `providerSettledAt = COALESCE(providerSettledAt, fxLockedAt, updatedAt, startDate)`
- `createdAt = COALESCE(createdAt, fxLockedAt, startDate)`
- `updatedAt` — Prisma-managed on update

---

## Review checklist (before `--apply`)

- [ ] Dry-run counts reviewed by engineering
- [ ] Sample `candidate_legacy` IDs spot-checked against ledger (tourist debit + provider/treasury credits)
- [ ] `manual_review` bucket empty or each ID documented with ops decision
- [ ] Post-migration verification: zero risky rows:

```sql
SELECT COUNT(*) FROM "TourismBooking"
WHERE status = 'PENDING' AND "totalPaidVIG" > 0
  AND "providerSettledAt" IS NULL AND "settlementMode" = 'UNKNOWN';
```

- [ ] Finance/ledger sign-off recorded
- [ ] Product/safety sign-off: hold mode still **off** until this completes

---

## Environment order

| Order | Environment | Action |
|-------|-------------|--------|
| 1 | Local / dev | `migrate deploy` → dry-run → apply if test data |
| 2 | Staging | `migrate deploy` → dry-run → ledger review → `--apply` |
| 3 | Production | `migrate deploy` → dry-run → sign-off → `--apply` in maintenance window |

---

## Idempotency

Re-running `--apply` only updates rows that still match `UNKNOWN`/`LEGACY` + `providerSettledAt IS NULL` criteria. Already tagged rows are skipped.

---

## Rollback / restore

- **Metadata-only** — no wallet reversal in this script.
- To revert tags for specific IDs (ops-only, after review):

```sql
UPDATE "TourismBooking"
SET "settlementMode" = 'UNKNOWN',
    "providerSettledAt" = NULL
WHERE id IN ('<uuid>');
```

- Do **not** bulk-revert production without ledger approval.
- Prefer forward fix: re-run dry-run and document exceptions rather than mass rollback.

---

## Sign-off checklist

| Role | Sign-off |
|------|----------|
| Engineering | Dry-run + apply logs attached; migration deploy confirmed |
| Finance / ledger | Sample reconciliation of `candidate_legacy` rows |
| Product / safety | Hold mode gated until post-apply SQL verification passes |

---

## After backfill

1. Re-run dry-run — expect `candidate legacy settled: 0` (or only new ambiguous rows).
2. Proceed to `VIONA.TOURISM.WALLET_HOLD.1` only after all sign-offs.
3. New books should eventually write `HOLD_ON_SUBMIT` / metadata in the hold pack (not this script).

---

*End of runbook.*
