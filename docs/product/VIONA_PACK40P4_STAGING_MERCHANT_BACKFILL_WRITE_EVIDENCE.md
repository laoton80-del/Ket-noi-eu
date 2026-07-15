# Pack40P4W — Staging Merchant Provenance Backfill Write Evidence

Status: **EXECUTION COMPLETE — STAGING WRITE ONLY**

Operator phrase: `APPROVE_PACK40P4_STAGING_MERCHANT_BACKFILL_WRITE`

---

## 1. Verified master SHA

`f97e0b5d20a14b18bda096b88f28a4638448830f` — `docs(viona): record Pack40P4 merchant backfill dry run (#349)`

## 2. PR #349 state and merge commit

**MERGED** @ `2026-07-15T07:25:38Z`, merge commit `f97e0b5d20a14b18bda096b88f28a4638448830f`

## 3. Branch and execution commit

- Branch: `chore/pack40p4-staging-merchant-backfill-write`
- Commit: recorded at PR open time

## 4. Redacted staging identity

| Label | Value |
|---|---|
| Supabase project ref | `euqbfanilcssjiwwtcby` (verified in `DATABASE_URL`/`DIRECT_URL`, values not recorded) |
| Target database host | `db.euqbfanilcssjiwwtcby.supabase.co` (redacted label only) |

## 5. Approved candidate count and digest

| Field | Value |
|---|---|
| Count | **5** |
| Algorithm | `sha256-v1` |
| Digest | `aa74f63813af18e26afca268175b2b40246159619cda5438aaf40c6d5f930213` |

## 6. Pre-write aggregate state

| Metric | Count |
|---|---|
| Total VionaRequest | 10 |
| `legacyUnresolved` | 10 |
| `merchant` | 0 |
| `consumer` | 0 |

## 7. Candidate-set revalidation result

| Check | Result |
|---|---|
| Recomputed count | **5** |
| Recomputed digest | **matches approved** |
| Blocked reasons | **0** |
| Candidate set revalidated | **true** |

## 8. Transaction isolation and strategy

- Prisma `$transaction` with **`isolationLevel: 'Serializable'`**
- In-transaction: re-read candidates, validate digest/count, guarded `updateMany` per row (exactly one affected row each), post-update invariant checks
- Rollback on any invariant failure (no partial remediation)

## 9. Exact authorized fields

Only these fields were written:

```text
scopeKind: legacyUnresolved → merchant
merchantProfileId: null → exact resolved MerchantProfile.id
```

## 10. Transaction result

**SUCCESS** — single transaction committed.

## 11. Rows updated

**5** (exact approved population)

## 12. Post-write provenance distribution

| scopeKind | Count |
|---|---|
| `legacyUnresolved` | 5 |
| `merchant` | 5 |
| `consumer` | 0 |
| **Total** | **10** (unchanged) |

## 13. Approved-set post-state

| Check | Result |
|---|---|
| Approved rows now `merchant` | **5/5** |
| Approved rows still `legacyUnresolved` | **0/5** |
| Post-write digest | **matches approved** |

## 14. Unresolved excluded-row preservation

Five non-webhook `legacyUnresolved` rows remain unchanged (not labeled consumer; not backfilled).

## 15. Consumer preservation

Consumer count **0** before and after; **0** consumer rows modified.

## 16. Request-count preservation

Total VionaRequest count **10** before and after.

## 17. TenantId preservation

**0** tenantId modifications (`tenantIdsModified: 0`).

## 18. Audit-event preservation

Audit-event count unchanged (`auditEventCountChanged: false`).

## 19. MerchantProfile preservation

MerchantProfile count and activation state unchanged (`merchantProfileCountChanged: false`).

## 20. Privacy confirmation

No request IDs, user IDs, tenant IDs, profile IDs, audit payloads, credentials, or personal timestamps were printed, stored, or committed.

## 21. Confirmation no IDs were retained

Candidate IDs held in memory only for transactional guards and digest verification; not written to disk or logs.

## 22. Confirmation no deployment occurred

No Fly deploy or application deployment action.

## 23. Confirmation no migration/schema action occurred

No Prisma migrate command; no schema file changes.

## 24. Confirmation no secret or production action occurred

No secret access/change; production not touched.

## 25. Pack40P5 remains separately authorized

This write does not execute Pack40P5 provenance verification.

## 26. Pack40A remains blocked

No access-policy or read-enforcement changes.

## 27. Static test and quality gates

| Gate | Result |
|---|---|
| `test-viona-pack40p4-merchant-backfill-write.ts` | **31 PASS** |
| `test-viona-pack40p1-provenance-schema.ts` | **21/21 PASS** |
| `npx tsc --noEmit` | **PASS** |
| ESLint (apply + test scripts) | **PASS** |

## 28. Final classification

**READY_FOR_PACK40P4_WRITE_EVIDENCE_PR_REVIEW**
