# Pack40A — Read-Only Tenant Provenance Inventory Evidence

Status: **EXECUTION COMPLETE** — bounded read-only staging discovery under operator phrase
`APPROVE_PACK40A_READ_ONLY_TENANT_PROVENANCE_INVENTORY`. No product-code enforcement, no schema
change, no data mutation, no deployment, no production access.

## 1. Verified master SHA

`43e799bcfe6d887aeccbfec22876c86d83435be8` — includes Pack40 provenance-hardened planning (PR #341).

## 2. PR #341 merge state

**MERGED** @ `43e799bcfe6d887aeccbfec22876c86d83435be8` (2026-07-14).

## 3. Branch and execution

| Field | Value |
|---|---|
| Branch | `chore/pack40a-read-only-tenant-provenance-inventory` |
| Script | `scripts/inventory-viona-pack40a-tenant-provenance.ts` |
| Execution | Single run, staging database, read-only Prisma operations only |

## 4. Redacted staging identity

| Check | Result |
|---|---|
| Staging project ref | `euqbfanilcssjiwwtcby` — **present** in `DATABASE_URL` / `DIRECT_URL` (not printed) |
| Redacted target | `postgresql://aws-…base.com:6543/postgres` (host partially redacted in script output) |
| `VIONA_DEPLOYMENT_STAGE` | `unknown` (production hard-block not triggered) |
| Production selected? | **No** — staging ref gate passed; production deployment stage blocked |

Evidence that target is staging: same Supabase project ref (`euqbfanilcssjiwwtcby`) used by established
VIONA staging scripts (`provision-local-pilot-accounts-staging.ts`, `smoke-public-staging-api.mjs`,
Pack36A provisioning/QA).

## 5. Source-level provenance facts (preserved)

- `VionaRequest.tenantId` is required, non-null `String`.
- Pack19 create accepts arbitrary non-empty **client-supplied** `tenantId`.
- Pack35 webhook create uses **server-resolved** merchant tenant.
- No verified canonical consumer sentinel in source.
- Registry absence is **not** consumer provenance.
- Audit absence is **not** Pack19/consumer proof.

## 6. Static script safety results

| Gate | Result |
|---|---|
| Forbidden mutation identifiers in script | **None** (`create`/`update`/`delete`/`upsert`/`$executeRaw`/`$queryRaw` absent) |
| External HTTP / provider clients | **None** |
| Secret logging | **None** — masked DB URL only |
| TypeScript typecheck | **Pass** (no errors on inventory script) |
| ESLint on inventory script | **Pass** (0 errors) |
| Git allowlist | **Within allowlist** at execution time |

## 7. Inventory size gate

| Metric | Value |
|---|---|
| Boundary | 50,000 `VionaRequest` rows |
| Total requests | **10** |
| Gate | **PASSED** |

## 8. Aggregate inventory results

| # | Aggregate | Count |
|---|---|---|
| 1 | Total `VionaRequest` rows | **10** |
| 2 | Distinct `tenantId` values | **4** |
| 3 | Total `MerchantProfile` rows | **1** |
| 4 | Active `MerchantProfile` rows | **1** |
| 5 | Inactive `MerchantProfile` rows | **0** |
| 6 | Requests matching a `MerchantProfile.tenantId` | **5** |
| 7 | Matching + active profile | **5** |
| 8 | Matching + inactive profile | **0** |
| 9 | Requests matching **no** profile tenant | **5** |
| 10 | Distinct unmatched tenant values | **3** |
| 11 | Positively webhook-associated (`webhookMessageAccepted`) | **5** |
| 12 | Webhook + profile tenant match | **5** |
| 13 | Webhook + no profile tenant match | **0** |
| 14 | Non-webhook + profile tenant match | **0** |
| 15 | Non-webhook + no profile tenant match | **5** |
| 16 | Profile-matched + owner aligned with profile owner | **5** |
| 17 | Profile-matched + owner misaligned | **0** |
| 18 | Duplicate profile tenant mappings | **0** (schema `@unique` on `tenantId`) |

## 9. Synthetic fixture aggregates (source-committed labels only)

| Safe label | Request count |
|---|---|
| `pack36aQaTenant` | **5** |
| `pack31E2eTenant` | **1** |
| `stagingPingTenant` | **0** |
| `pilotTenantA` | **0** |
| `pilotTenantB` | **0** |

Fixture tenant **values** were not printed. Counts use exact constants from source files only.

## 10. Unresolved population

| Metric | Count |
|---|---|
| Unresolved requests (non-registry-matched tenant-bearing rows) | **5** (50% of staging population) |
| Labeled consumer | **0** — no row classified as consumer |

## 11. Privacy and redaction

- No raw tenant IDs, request IDs, user IDs, profile IDs, audit IDs, or payloads stored in this document.
- Sanitized aggregate JSON: `docs/design/evidence/pack40a-tenant-provenance-inventory/summary.json`.

## 12. Explicit non-classification

**No row was classified as consumer.** Unmatched registry rows remain **unresolvedTenant** only.

## 13. No data modified

**Confirmed:** script used count / groupBy / findMany(select minimal) only. `dataModified: false`.

## 14. No Pack40A enforcement

**Confirmed:** no access-policy, controller, service, or test enforcement implemented.

## 15. Canonical consumer provenance decision

**`canonicalConsumerProvenanceConfirmed: false`**

Neither immutable server-owned source logic nor staging evidence establishes a canonical consumer
`tenantId` representation (null, sentinel, or equivalent). Statistical patterns (frequency, prefixes,
test-looking values) were **not** used as consumer proof.

## 16. Pack40A readiness result

**BLOCKED**

Pack40A implementation (`APPROVE_PACK40A_TENANT_CONTEXT_AND_READ_ENFORCEMENT`) **must not** be
authorized until a **docs-only provenance model / remediation plan** defines how consumer-classified
rows are positively identified (likely requiring Pack19 create-path and/or schema alignment — separate
pack, not this inventory).

Merchant-classified enforcement (exact profile tenant match + webhook-positive paths) is **evidence-supported** for registry-matched rows only.

## 17. Interpretation (required statements)

1. Registry-matched rows have positive merchant association where owner aligns with profile owner (**5/5** matched rows).
2. Webhook-associated rows have positive Pack35 ingress evidence (**5** rows).
3. Unmatched rows remain **`unresolvedTenant`** (**5** rows) — not consumer.
4. Non-webhook unmatched rows remain **origin-unresolved** (**5** rows).
5. Common patterns do not prove consumer provenance.
6. High frequency does not prove consumer provenance (not applied).
7. Test-looking fixture labels do not auto-prove consumer provenance.
8. Client-supplied Pack19 tenant values cannot be retroactively trusted from format alone.
9. Inventory does not alter authorization behavior.
10. Inventory does not authorize Pack40A implementation.
11. No reclassification, normalization, or backfill performed.

## 18. Recommended next architecture step

Author a **docs-only Pack40 consumer-provenance model plan** (or amend Pack40 plan §12) defining
either:

- a server-owned canonical consumer tenant marker at Pack19 create time, **or**
- an additive nullable/provenance column (separate schema pack if required),

before granting `APPROVE_PACK40A_TENANT_CONTEXT_AND_READ_ENFORCEMENT`.

Merchant-registry + webhook-positive enforcement can proceed in planning as a **partial** Pack40A
scope only if operator explicitly splits consumer vs merchant paths — default remains **full Pack40A blocked**.
