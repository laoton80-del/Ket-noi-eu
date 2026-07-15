# Pack40P4D — Merchant Provenance Backfill Dry Run Evidence

Status: **EXECUTION COMPLETE — READ-ONLY STAGING DRY RUN**

Operator phrase: `APPROVE_PACK40P4_MERCHANT_BACKFILL_DRY_RUN`

P2D deployed-state prerequisite (from PR #348):

```text
STAGING_SCHEMA_AND_CREATE_PATH_CODE_DEPLOYED
PROVENANCE_DATA_VERIFICATION_STILL_REQUIRED
```

---

## 1. Verified master SHA

`e7616e3f5955d177e629426d75d68f39574f5acb` — `docs(viona): record Pack40P2D staging provenance deployment (#348)`

## 2. PR #348 state and merge commit

**MERGED** @ `2026-07-15T07:08:47Z`, merge commit `e7616e3f5955d177e629426d75d68f39574f5acb`

## 3. Branch and evidence commit

- Branch: `chore/pack40p4-merchant-backfill-dry-run`
- Commit: recorded at PR open time

## 4. Redacted staging identity

| Label | Value |
|---|---|
| Supabase project ref | `euqbfanilcssjiwwtcby` (verified in `DATABASE_URL`/`DIRECT_URL`, values not recorded) |
| Target database host | `db.euqbfanilcssjiwwtcby.supabase.co` (redacted label only) |
| Fly app (P2D context) | `viona-api-staging-eu` |

## 5. P2D deployed-state markers

Pack40P1 schema applied (P3). Pack40P2 create-path code deployed (P2D v23). This dry run performs **no** request QA and **no** provenance row inspection beyond aggregate candidate evaluation.

## 6. Source-backed candidate rules

A row qualifies only when **all** hold (merged Pack40P plan §11.1 + P4D authorization):

| Condition | Rule |
|---|---|
| A | `scopeKind = legacyUnresolved` and `merchantProfileId = null` |
| B | ∃ audit `eventType = webhookMessageAccepted` linked by FK |
| C | `VionaRequest.tenantId` exactly equals `MerchantProfile.tenantId` |
| D | Exactly one `MerchantProfile` for tenant (unique constraint) |
| E | `VionaRequest.ownerUserId = MerchantProfile.ownerUserId` |
| F | No contradictory provenance or duplicate webhook evidence |

Registry match alone is **insufficient** without webhook evidence.

## 7. Static read-only safety results

| Gate | Result |
|---|---|
| Structural self-scan (no Prisma mutations/raw SQL) | **PASS** |
| No HTTP/provider SDK imports | **PASS** |
| `npx tsc --noEmit` | **PASS** |
| ESLint on dry-run script | **PASS** |

## 8. Size-gate result

| Metric | Count |
|---|---|
| Total VionaRequest | **10** |
| Total VionaRequestAuditEvent | **26** |
| Total MerchantProfile | **1** |
| Boundary | 50,000 |
| Gate | **PASS** |

## 9. Required aggregate counts

| # | Aggregate | Count |
|---|---|---|
| 1 | Total VionaRequest rows | 10 |
| 2 | `legacyUnresolved` rows | 10 |
| 3 | `consumer` rows | 0 |
| 4 | `merchant` rows | 0 |
| 5 | Unresolved + null `merchantProfileId` | 10 |
| 6 | Unresolved + non-null `merchantProfileId` | 0 |
| 7 | Unresolved + positive `webhookMessageAccepted` | 5 |
| 8 | Webhook-positive + exact tenant/profile match | 5 |
| 9 | Webhook-positive + no profile match | 0 |
| 10 | Webhook-positive + ambiguous profile match | 0 |
| 11 | Webhook-positive + owner aligned | 5 |
| 12 | Webhook-positive + owner mismatch | 0 |
| 13 | Webhook-positive + owner alignment unprovable | 0 |
| 14 | **Fully qualified merchant candidates** | **5** |
| 15 | Active MerchantProfile candidates | 5 |
| 16 | Inactive MerchantProfile candidates | 0 |
| 17 | Duplicate/contradictory webhook evidence | 0 |
| 18 | Registry-matched unresolved without webhook | 0 |
| 19 | Webhook-positive tenant mismatch | 0 |
| 20 | Excluded contradictory current provenance | 0 |

## 10. Candidate exclusions by reason

| Reason | Count |
|---|---|
| Not legacy-unresolved / already classified | 0 |
| Unresolved without webhook evidence | 5 (not labeled consumer) |
| Inconsistent unresolved + non-null FK | 0 |
| Tenant/profile mismatch | 0 |
| Ambiguous profile mapping | 0 |
| Owner mismatch | 0 |
| Owner alignment unprovable | 0 |
| Duplicate webhook accepted events | 0 |

## 11. Active/inactive candidate split

- Active MerchantProfile: **5**
- Inactive MerchantProfile: **0**

## 12. Ambiguity result

**None.** Zero ambiguous profile mappings, zero duplicate webhook evidence, zero inconsistent unresolved FK rows.

## 13. Owner-alignment result

All 5 webhook-positive, tenant-matched rows have positively proven owner alignment (`ownerUserId = MerchantProfile.ownerUserId`). Zero mismatches; zero unprovable rows.

## 14. Candidate-set digest

| Field | Value |
|---|---|
| Algorithm | `sha256-v1` |
| Constant (committed, non-secret) | `viona-pack40p4d-candidate-digest-v1` |
| Candidate count | **5** |
| SHA-256 digest | `aa74f63813af18e26afca268175b2b40246159619cda5438aaf40c6d5f930213` |

Digest is a population-integrity marker for a later P4W revalidation — not authorization by itself.

## 15. Privacy/redaction confirmation

No request IDs, user IDs, tenant IDs, MerchantProfile IDs, audit IDs, message text, payloads, credentials, or exact event-level timestamps were printed, stored, or committed.

## 16. Confirmation that no IDs were retained

Candidate IDs were held in memory only for digest computation; not written to disk or logs.

## 17. Confirmation that no data was modified

Script uses structurally read-only Prisma operations only. `dataModified: false`.

## 18. Confirmation that no row became merchant

No `scopeKind` or `merchantProfileId` writes occurred.

## 19. Confirmation that no consumer backfill exists

No consumer classification or backfill path was executed or created.

## 20. Confirmation that no deployment, migration or secret action occurred

No Fly deploy, Prisma migrate, secret access/change, or production action.

## 21. P4W readiness decision

**P4W design-ready:** yes — candidate set is non-ambiguous, owner alignment is positively proven, digest is reproducible, and a transactional P4W script can revalidate the same conditions before writing.

**P4W authorized:** no — requires separate `APPROVE_PACK40P4_STAGING_MERCHANT_BACKFILL_WRITE`.

## 22. Pack40A remains blocked

No access-policy or read-enforcement changes.

## 23. Consistency snapshot (execution time)

| Signal | Value |
|---|---|
| Execution timestamp (UTC) | `2026-07-15T07:17:30.095Z` |
| Total requests | 10 |
| Total audit events | 26 |
| Total MerchantProfiles | 1 |
| Latest webhook audit bucket (UTC hour) | `2026-07-14T13:00:00.000Z` |
| Candidate digest | `aa74f63813af18e26afca268175b2b40246159619cda5438aaf40c6d5f930213` |

## 24. Final classification

**READY_FOR_PACK40P4_DRY_RUN_EVIDENCE_PR_REVIEW**

Hypothesis check: prior Pack40A inventory suggested **5** webhook-positive, registry-matched, owner-aligned unresolved rows. Dry-run result: **5** fully qualified candidates — consistent, not forced.
