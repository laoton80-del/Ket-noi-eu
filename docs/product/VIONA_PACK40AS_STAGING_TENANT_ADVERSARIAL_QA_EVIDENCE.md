# Pack40AS — Staging Tenant Adversarial Read QA Evidence

Status: **EXECUTION COMPLETE — AUTHENTICATED GET-ONLY STAGING QA**

Operator phrase: `APPROVE_PACK40AS_STAGING_TENANT_ADVERSARIAL_QA`

Pack40A adversarial QA result: **`PACK40A_STAGING_ADVERSARIAL_QA_GREEN`** (closure pending evidence PR merge)

---

## 1. Verified master SHA

`3d96f83167626aa445ed0063427f7857eb5f5e4b`

## 2. PR #353 merge state and merge commit

**MERGED** @ `2026-07-15T09:30:04Z`, merge commit `3d96f83167626aa445ed0063427f7857eb5f5e4b`

## 3. Branch and evidence commit

- Branch: `chore/pack40as-staging-tenant-adversarial-qa`
- Commit: recorded at PR open time

## 4. Staging release

**v24-verified** on `viona-api-staging-eu` (Pack40A read enforcement deployed per Pack40AD)

## 5. Redacted staging identities

| Label | Value |
|---|---|
| Fly app | `viona-api-staging-eu` |
| Public API (redacted) | `https://viona-api-staging-eu.fly.dev` |
| Supabase project ref | `euqbfanilcssjiwwtcby` |
| Database host (redacted) | `db.euqbfanilcssjiwwtcby.supabase.co` |

## 6. Fly-log limitation

`fly logs` was **not** used as a gate (prior Windows `401`/hang limitation documented in Pack40AD). QA relied on HTTP results, read-only DB fixture verification, Fly releases metadata, and pre/post invariants.

## 7. Fixture discovery result

| Fixture | Marker / rule | Provenance verified |
|---|---|---|
| Consumer | `pack40p5-consumer-ee22193` | `scopeKind=consumer`, `merchantProfileId=null` |
| Merchant (P5 webhook) | `pack40p5-webhook-ee22193` | `scopeKind=merchant`, trusted profile FK + tenant snapshot |
| Historical merchant | One approved P4W row (ID redacted) | `scopeKind=merchant`, P4W digest match |
| Legacy unresolved | One excluded non-webhook row (ID redacted) | `scopeKind=legacyUnresolved`, `merchantProfileId=null` |

## 8. Positive dual-role proof

Read-only DB proof confirmed a **single authenticated actor** who:

1. Owns the `MerchantProfile` linked to the Pack35 merchant fixture; and
2. Holds existing user scope on the Pack19 consumer fixture.

Consumer branch and merchant branch both authorized for this actor without cross-swallowing.

## 9. Non-owner fixture proof

Distinct approved pilot identity (not the dual-role owner) used for adversarial denial tests.

## 10. Pre-QA provenance state

| scopeKind | Count |
|---|---|
| `legacyUnresolved` | **5** |
| `merchant` | **6** |
| `consumer` | **1** |
| **total** | **12** |

## 11. P4W digest verification

| Field | Result |
|---|---|
| Count | **5** (excluding P5 synthetic webhook merchant from backfill set) |
| Digest | matches approved `aa74f638…930213` |

## 12. Consumer owner list/detail results

| Check | Result |
|---|---|
| Dual-role owner list contains consumer fixture | **PASS** |
| Dual-role owner consumer detail HTTP 200 | **PASS** |
| MerchantProfile ownership does not hide consumer row | **PASS** |

## 13. Merchant owner list/detail results

| Check | Result |
|---|---|
| Dual-role owner list contains P5 merchant fixture | **PASS** |
| Dual-role owner merchant detail HTTP 200 | **PASS** |

## 14. Historical merchant results

| Check | Result |
|---|---|
| Dual-role owner list contains historical P4W merchant row | **PASS** |
| Dual-role owner historical detail HTTP 200 | **PASS** |

## 15. Legacy unresolved results

| Check | Result |
|---|---|
| Dual-role owner list excludes legacy fixture | **PASS** |
| Dual-role owner legacy detail → 404 / `Request not found` | **PASS** |
| Tenant/provenance query spoof does not expose legacy row | **PASS** |

## 16. Non-owner denial results

| Check | Result |
|---|---|
| Non-owner list excludes consumer, merchant, historical, legacy | **PASS** |
| Non-owner detail for each → 404 / `Request not found` | **PASS** |

## 17. Client-controlled expansion attempt results

Bounded GET query/header spoof attempts (`tenantId`, `expectedTenantId`, `merchantProfileId`, `scopeKind`, `directReadPolicy`, custom headers):

| Check | Result |
|---|---|
| Non-owner access remains denied | **PASS** |
| Legacy row remains denied | **PASS** |
| No additional list rows appear | **PASS** |

## 18. Existence-leak normalization results

Wrong-owner consumer, wrong-owner merchant, legacy-unresolved (owner scope), and synthetic nonexistent ID detail failures normalized to equivalent external behavior:

- HTTP **404**
- Public error **`Request not found`**
- No provenance/tenant-specific explanation

## 19. List/detail consistency

Authorized rows visible in both list and detail; denied rows omitted from list and not-found-safe on detail.

## 20. Inactive-merchant live-fixture limitation

No approved inactive `MerchantProfile` fixture on staging. Inactive-merchant read semantics remain covered by Pack40A local tests (**39/39**). **Not exercised live.**

## 21. Malformed-provenance live-fixture limitation

No staging rows mutated to manufacture malformed provenance. Covered structurally by Pack40A local tests only.

## 22. Post-QA preservation results

| Invariant | Result |
|---|---|
| Total VionaRequest count | unchanged |
| Provenance distribution | unchanged |
| P4W digest | unchanged |
| P5 consumer fixture | still consumer / null profile |
| P5 merchant fixture | still merchant / exact profile relation |
| Legacy fixture | still `legacyUnresolved` |
| Audit-event count | unchanged |
| MerchantProfile count / activation | unchanged |

## 23. Privacy confirmation

No request IDs, user IDs, tenant IDs, profile IDs, tokens, credentials, or message content committed to evidence.

## 24. Confirmation no IDs or credentials were retained

Tokens held in memory only for the QA run. Sanitized logs contain marker labels and boolean outcomes only.

## 25. Confirmation no data was modified

**0** creates, updates, or deletes. GET-only application requests against list/detail endpoints (+ established auth login precedent).

## 26. Confirmation no deployment, migration, secret or production action occurred

No Fly deploy, Prisma migrate, secret change, or production access.

## 27. Confirmation Pack40B/C/D/S remain unimplemented

Note, status, indirect enforcement, and Pack40S not implemented.

## 28. Pack40A staging QA result

**`PACK40A_STAGING_ADVERSARIAL_QA_GREEN`** — all mandatory live adversarial cases passed on staging release **v24**.

## 29. Pack40A closure recommendation

Merge this evidence PR, then record Pack40A read enforcement as **CLOSED/GREEN** in canonical docs. Pack40B/C/D remain separately authorized.

## 30. Final classification

**`READY_FOR_PACK40AS_QA_EVIDENCE_PR_REVIEW`**

Request budget: **24** authenticated GET + **3** unauthenticated GET (within authorized caps).
