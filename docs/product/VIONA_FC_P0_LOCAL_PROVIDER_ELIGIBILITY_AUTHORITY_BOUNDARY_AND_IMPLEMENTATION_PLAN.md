# VIONA — FC-P0 Local Provider Eligibility Authority  
## Boundary and Implementation Plan

**Operator authorization:** `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_ELIGIBILITY_AUTHORITY_BOUNDARY_AND_IMPLEMENTATION_PLAN`  
**Mode:** `DOCS_ONLY_NO_IMPLEMENTATION_NO_DEPLOY`  
**Baseline:** `origin/master` @ `19dbc2f1c52aa2c61dfe8c47dab913dc08a70dfb` (PR #414 containment verified)  
**Branch:** `docs/viona-fc-p0-local-provider-eligibility-authority-boundary-plan`  
**Primary classification:** `READY_FOR_VIONA_FC_P0_LOCAL_PROVIDER_ELIGIBILITY_AUTHORITY_PLAN_PR_REVIEW`

```text
VIONA_FC_P0_LOCAL_PROVIDER_ELIGIBILITY_AUTHORITY_BOUNDARY
DOCS_ONLY_NO_IMPLEMENTATION
MINIMAL_SCHEMA_EXTENSION_REQUIRED
LOCAL_PROVIDER_AUTHORITY_OWNER_INTERNAL_OPS
FC_P0_STILL_BLOCKED
REQUEST_ONLY_NO_CHARGE_PRESERVED
PACK40S_NOT_AUTHORIZED
APPLE_EAS_PHASE_D2_DEFERRED
```

---

## 0. Canonical truth (locked)

1. PR #414 removed invalid Tourism → Local provider coupling (verified on master).
2. Raw UUID consumer input remains removed.
3. Local create settles to `PROVIDER_SELECTION_UNAVAILABLE`.
4. **No** canonical Local provider eligibility authority exists in schema or routes.
5. FC-P0 Local create remains **blocked**.
6. This pack **does not** authorize implementation, staging activation, or live QA.

---

## 1. Audit A — Existing authority-signal inventory

| ID | Source / symbol | Classification |
|---|---|---|
| C01 | `Business.id` existence (`createLocalServiceRequest` `findUnique`) | `BUSINESS_EXISTENCE_ONLY` |
| C02 | `Business.category` / `BizType` | `NO_RELEVANT_AUTHORITY` (do not infer Local eligibility) |
| C03 | `Business.isPremiumRank` / `isTopAd` / ad credits | `EXISTING_PUBLIC_VISIBILITY_SIGNAL` (Tourism ranking only) |
| C04 | `Business.ownerId` | `MERCHANT_PRIVATE_SIGNAL` |
| C05 | Create existence check | `BUSINESS_EXISTENCE_ONLY` |
| C06 | `self_request_forbidden` | `EXISTING_PARTIAL_ELIGIBILITY_SIGNAL` (integrity only) |
| C07 | Optional legacy `Service` match | `EXISTING_SERVICE_CAPABILITY_SIGNAL` (weak; not Local type matrix) |
| C08 | `LocalServiceRequest.serviceType` on rows | `EXISTING_SERVICE_CAPABILITY_SIGNAL` (request-level only) |
| C09 | `LocalServiceType` / `LocalRequestSource` enums | `EXISTING_SERVICE_CAPABILITY_SIGNAL` (global vocabulary only) |
| C10 | `GET /api/local/requests` history | `EXISTING_PARTIAL_ELIGIBILITY_SIGNAL` (not first-time authority) |
| C11 | Merchant inbox / confirm / reject | `MERCHANT_PRIVATE_SIGNAL` |
| C12 | Ops Local list / audit / cancel | `OPS_ONLY_SIGNAL` |
| C13 | `GET /api/tourism/discover` | `EXISTING_PUBLIC_VISIBILITY_SIGNAL` (Travel; **rejected** for Local) |
| C14 | `TourismService` | `NO_RELEVANT_AUTHORITY` |
| C15 | `/api/business/ranking/*` | `MERCHANT_PRIVATE_SIGNAL` |
| C16 | `MerchantProfile.isActive` | `NO_RELEVANT_AUTHORITY` (Viona AI gateway; no Business FK) |
| C17 | `MerchantBrokerActivation` | `NO_RELEVANT_AUTHORITY` |
| C18 | Broker `register-business` | `BUSINESS_EXISTENCE_ONLY` |
| C19 | `localRoutes` lacking provider catalog | `UNMOUNTED_OR_INACTIVE_SIGNAL` |
| C20 | Client `PROVIDER_SELECTION_UNAVAILABLE` | Containment (honest absence of authority) |
| C21 | Staging pilot provision scripts | `MOCK_OR_FIXTURE_SIGNAL` |
| C22 | `User.isKYCVerified` / Role | `EXISTING_PARTIAL_ELIGIBILITY_SIGNAL` (account trust only) |
| C23 | `superAdminMiddleware` (`Role.ADMIN`) | `OPS_ONLY_SIGNAL` (**write-authority pattern** for future control) |

**Count of `EXISTING_AUTHORITATIVE_LOCAL_ELIGIBILITY`:** **0**

---

## 2. Audit B — Schema sufficiency

| Question | Answer |
|---|---|
| Distinguish Local provider vs generic Business? | **No** |
| Draft / active / suspended / retired Local eligibility? | **No** |
| Public B2C visibility vs merchant existence? | **No** |
| Supported Local service types per business? | **No** |
| Prevent Travel-only Business from Local create? | **No** |
| Temporary unavailability? | **No** |
| Activating / suspending actor? | **No** Local fields |
| Eligibility change audit? | **No** (request audit only) |
| Server-side eligibility on create? | **No** (existence + self + optional Service) |
| Safe B2C provider list route? | **No** |

### Conclusion (exact)

**`MINIMAL_SCHEMA_EXTENSION_REQUIRED`**

---

## 3. Audit C — Authority owner (exact)

**`LOCAL_PROVIDER_AUTHORITY_OWNER_INTERNAL_OPS`**

**Proof:**
- No merchant Local self-publication / activate / suspend API exists.
- `MerchantProfile.isActive` is fail-closed AI-gateway state with **no** Business relation.
- Local ops already uses `authMiddleware` + `superAdminMiddleware` (`Role.ADMIN`) for privileged Local writes (`POST /api/local/ops/requests/:id/cancel`).

**FC-P0 preference:** controlled internal ops/superAdmin activation — **not** merchant self-declared public eligibility.

---

## 4. Audit D — Eligibility rules (exact)

Canonical wire values for `LocalServiceType` (existing only):

`SERVICE_MENU` | `FIXER_HIRE` | `GENERIC_REQUEST` | `LEGAL_INTAKE` | `CLASSIFIED_LEAD`

### `IS_LOCAL_PROVIDER_SELECTABLE(businessId)`

True iff **all** of:

1. `Business` row exists for `businessId`.
2. `LocalProviderEligibility` row exists for `businessId` (unique).
3. `eligibility.status === ACTIVE`.
4. `eligibility.publicB2cVisible === true`.
5. `Business.name.trim().length > 0`.
6. `eligibility.supportedServiceTypes.length >= 1` (after sanitize).
7. Requester is not `Business.ownerId` (existing create integrity — applied at create time).

### `IS_LOCAL_PROVIDER_ALLOWED_FOR_SERVICE_TYPE(businessId, serviceType)`

True iff:

1. `IS_LOCAL_PROVIDER_SELECTABLE(businessId)`.
2. `serviceType` is a canonical `LocalServiceType`.
3. `serviceType ∈ eligibility.supportedServiceTypes`.

**Do not** infer compatibility from `BizType` or Tourism categories.

---

## 5. Audit E — Exact architecture (one)

**Outcome B — minimal schema extension.**

### Model: `LocalProviderEligibility`

One row per eligible Business (1:1).

| Field | Type | Notes |
|---|---|---|
| `id` | `String` `@id` `@default(uuid())` | |
| `businessId` | `String` `@unique` | FK → `Business.id` `onDelete: Cascade` |
| `status` | `LocalProviderEligibilityStatus` | See Audit F |
| `publicB2cVisible` | `Boolean` `@default(false)` | Must be true for B2C list/select |
| `supportedServiceTypes` | `LocalServiceType[]` | Existing enum; empty ⇒ not selectable |
| `activatedAt` | `DateTime?` | Set on transition to ACTIVE |
| `suspendedAt` | `DateTime?` | Set on SUSPENDED |
| `retiredAt` | `DateTime?` | Set on RETIRED |
| `createdAt` | `DateTime` `@default(now())` | |
| `updatedAt` | `DateTime` `@updatedAt` | |

`Business` gains relation: `localProviderEligibility LocalProviderEligibility?`

**Do not** put `suspensionReason` / `retirementReason` on this model (audit-event-only).  
**Do not** put audit actor ids on this model (actors live on `LocalProviderEligibilityAuditEvent`).  
**Do not** duplicate `Business.name` on eligibility (read name from Business at query time).  
**Do not** add payment, ranking, reviews, location-discovery, marketplace, or Tourism fields.

**Indexes:** `@unique` on `businessId`; `@@index([status, publicB2cVisible])`; **no GIN** on `supportedServiceTypes` (FC-P0).

### Enum: `LocalProviderEligibilityStatus`

`DRAFT` | `ACTIVE` | `SUSPENDED` | `RETIRED`

---

## 6. Audit F — Status lifecycle

| Status | B2C selectable? | May receive new Local request? | In list API? | Merchant editable? | Ops editable? | Terminal? |
|---|---|---|---|---|---|---|
| `DRAFT` | No | No | No | No (FC-P0) | Yes | No |
| `ACTIVE` | Only if `publicB2cVisible` + types | Yes (if selectable rule) | Yes (if selectable rule) | No (FC-P0) | Yes | No |
| `SUSPENDED` | No | No | No | No | Yes | Reversible → ACTIVE or RETIRED only (no reset-to-DRAFT) |
| `RETIRED` | No | No | No | No | Yes (limited) | **Terminal** |

**Transition authority (FC-P0):** `Role.ADMIN` via ops control routes only.

---

## 7. Audit G — Supported Local service types

| Rule | Definition |
|---|---|
| Vocabulary | Existing `LocalServiceType` only — no second enum |
| Empty `supportedServiceTypes` | Provider **not** selectable; create rejects |
| Unsupported type on create | Reject with safe 400 (`service_type_not_supported`) |
| Enforcement | **Both** list filtering **and** create service (server-side mandatory) |
| Client filtering | UX only — **not** authority |

---

## 8. Audit H — B2C read route (exact)

**`GET /api/local/providers`**

Grounded in `localRouter` conventions (`/api/local` + resource).

| Aspect | Lock |
|---|---|
| Auth | `authMiddleware` (same as all Local routes) |
| Middleware | Router-level JWT only (no superAdmin) |
| Controller | `LocalRequestController.getLocalProviders` |
| Service | `listSelectableLocalProviders` in `src/services/local/` |
| Returns | Only rows satisfying `IS_LOCAL_PROVIDER_SELECTABLE` |
| Pagination | `limit` / `skip` — default **50**, max **100** (match Local list services) |
| Ordering | Stable: `Business.name asc`, then `businessId asc` |
| Optional filter | `serviceType` query — if present, must be canonical; filter with `IS_LOCAL_PROVIDER_ALLOWED_FOR_SERVICE_TYPE` |
| Search / geo | **Out of FC-P0** (no new discovery product) |
| Empty | `200` + empty `items` (honest) |
| Malformed query | `400` |
| Rate limit | Optional read soft-limit; mutations unchanged |
| Tourism | **Forbidden** dependency |

---

## 9. Audit I — Safe public response DTO

```ts
type LocalProviderPublicDto = Readonly<{
  businessId: string;
  displayName: string;
  supportedServiceTypes: readonly LocalServiceType[];
}>;
// categoryLabel omitted in FC-P0 — do not fabricate Local category from Tourism BizType.

type LocalProviderListResponse = Readonly<{
  items: readonly LocalProviderPublicDto[];
  pagination: Readonly<{ limit: number; skip: number; returned: number }>;
}>;
```

**Exclude:** ownerId, email, phone, tax, payment/settlement, scores, suspension/retire reasons, notes, audit actors, status, private address, VietQR, secrets.

**Malformed rows:** skip (do not return); never 500 on single bad join.

---

## 10. Audit J — Write / admin control (exact)

**Approach:** internal Role.ADMIN endpoints under `/api/local/ops/providers` (exact routes locked by lifecycle + audit readiness remediations).

| Operation | Method / path |
|---|---|
| Register eligibility | `POST /api/local/ops/providers` |
| Update supported types / visibility | `PATCH /api/local/ops/providers/:businessId` |
| Activate | `POST /api/local/ops/providers/:businessId/activate` |
| Suspend | `POST /api/local/ops/providers/:businessId/suspend` |
| Retire | `POST /api/local/ops/providers/:businessId/retire` |

| Requirement | Lock |
|---|---|
| Auth | `authMiddleware` + `superAdminMiddleware` (`Role.ADMIN` only) |
| Validation | business exists; enum/status legality; ACTIVE invariants; unknown-key reject |
| Audit | `LocalProviderEligibilityAuditEvent` only (append-only create; Pack A2 writes) |
| Idempotency | Same-state / no-change PATCH → **200**, no update, no audit, `updatedAt` unchanged |
| Public self-activation | **Forbidden** in FC-P0 |

No broad admin console required; secured HTTP + operator evidence is sufficient.

---

## 11. Audit K — Create-endpoint enforcement

**`POST /api/local/requests`** — extend `createLocalServiceRequest` **before** insert:

1. Business exists (existing).
2. `IS_LOCAL_PROVIDER_SELECTABLE(businessId)`.
3. `IS_LOCAL_PROVIDER_ALLOWED_FOR_SERVICE_TYPE(businessId, serviceType)`.
4. Keep `self_request_forbidden`.
5. Keep optional `serviceId` checks if present.

| Failure reason | HTTP | Client-safe message class |
|---|---|---|
| `business_not_found` | 404 | existing |
| `provider_not_available` (ineligible / draft / suspended / retired / not public / empty types) | **404** | safe “Provider not available” — do not leak eligibility internals |
| `service_type_not_supported` | **400** | safe validation |
| `self_request_forbidden` | 400 | existing |

Foreign-key existence alone is **not** authority.

**Client mapping (future Pack B):** keep 404 → `SERVER_VALIDATION_ERROR`; 400 → `SERVER_VALIDATION_ERROR` (existing).

---

## 12. Audit L — First-time client integration (future Pack B)

Expected flow (not implemented here):

1. Composer default loader → `GET /api/local/providers` (not Tourism; not history).
2. Provider states: `PROVIDERS_LOADING` → `PROVIDERS_READY` / `PROVIDERS_EMPTY` / `PROVIDERS_LOAD_ERROR`.
3. Render `displayName` chips; store `businessId` internally.
4. Constrain service-type chips to intersection with `supportedServiceTypes` when non-empty response.
5. Submit blocked without selection; preserve `runLocalCreateSubmit` guard-before-JWT.
6. Unchanged create DTO (`source: LOCAL_SCREEN`).
7. Raw UUID remains absent; post-create refresh/expand preserved.

**Candidate files (Pack B only):**

- `src/services/local/localCreateBusinessSource.ts`
- `src/services/local/localCreateBusinessOptionModel.ts`
- `src/components/local/LocalUserRequestCreateComposer.tsx`
- `src/services/localUserRequestApi.ts` (add fetch providers)
- `src/domain/local/…` client contracts if needed
- EN/VI strings
- focused tests

---

## 13. Audit M — Empty / error / stale

| Case | Behavior |
|---|---|
| No eligible providers | `PROVIDERS_EMPTY` — honest “none available right now”; no POST |
| List network failure | `PROVIDERS_LOAD_ERROR` — retry; not create NETWORK_UNKNOWN |
| Unauthorized | Auth required → existing Login path; no auto-resubmit |
| Stale selection after refresh | Clear or invalidate; block POST |
| Suspended after list load | Create returns 404 `provider_not_available`; show safe message |
| Service type no longer supported | Create 400; re-constrain chips on refresh |
| Fallbacks forbidden | No UUID, no Tourism, no history-as-authority |

---

## 14. Audit N — Staging data / ops

| Rule | Lock |
|---|---|
| Structure vs data | Migration creates **structure only** — **no** auto-activate |
| Staging QA | Ops activates ≥1 existing legitimate staging `Business` via ops control path |
| Secrets | No real personal/merchant secrets in docs/scripts beyond existing pilot hygiene |
| Rollback | Suspend or retire eligibility row |
| Production | **Not** authorized by this plan or Pack A alone |

---

## 15. Audit O — Privacy / security

| Risk | Mitigation |
|---|---|
| Private merchant enumeration | List only ACTIVE+public+types; auth required |
| Ops fields leak | Exclude from B2C DTO |
| Unbounded scrape | Pagination max 100 |
| Client-forged eligibility | Server create enforcement |
| JWT / Prisma | Preserve session JWT; no mobile Prisma |
| Error leakage | Safe messages only |

---

## 16. Audit P — Implementation sequence (exact)

**Two ordered packs** (schema/backend risk ≠ client wiring risk):

| Order | Pack | May start only after |
|---|---|---|
| **A** | FC-P0 Local Provider Eligibility Authority — schema / backend / read / write / create enforce | This plan reviewed + merged + verified |
| **B** | FC-P0 Local Provider Authority Client Wiring | Pack A merged + post-merge verified on master |
| Then | Separate staging migrate/deploy authorization | Pack A (and usually B) verified; **operator phrase required** |
| Then | Controlled staging provider activation | Staging migrate authorized |
| Then | Controlled live Local create QA | Separate authorization |
| Then | FC-P0 closure verification | QA green |

---

## 17. Future pack cards

### Pack A — immediate next implementation pack (not authorized yet)

| Field | Value |
|---|---|
| Name | **FC-P0 Local Provider Eligibility Authority — Schema Backend** |
| Purpose | Add `LocalProviderEligibility` (+ status enum), ops write/control, `GET /api/local/providers`, create-service enforcement |
| Dependency | This boundary plan merged + verified |
| Allowed | `prisma/schema.prisma` + one migration; `src/routes/localRoutes.ts`; Local controllers/services; focused server tests; evidence; Kernel/Handoff |
| Forbidden | Client composer wiring; Tourism changes; payment/wallet/AI; Pack40S; deploy; auto seed activation |
| Schema | Minimal model + enum only |
| API | Ops providers + B2C list + create enforce |
| Auth | JWT + superAdmin for writes; JWT for list |
| Tests | Server tests 1–15 (see §18) |
| Deploy | **IMPLEMENTATION_ONLY_NO_DEPLOY** unless separate phrase |
| Evidence | `docs/product/VIONA_FC_P0_LOCAL_PROVIDER_ELIGIBILITY_AUTHORITY_SCHEMA_BACKEND_EVIDENCE.md` |
| Success | `READY_FOR_VIONA_FC_P0_LOCAL_PROVIDER_ELIGIBILITY_AUTHORITY_SCHEMA_BACKEND_PR_REVIEW` |
| Phrase | **`APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_ELIGIBILITY_AUTHORITY_SCHEMA_BACKEND`** |

### Pack B — client wiring (after Pack A verified)

| Field | Value |
|---|---|
| Name | **FC-P0 Local Provider Authority Client Wiring** |
| Purpose | Replace `PROVIDER_SELECTION_UNAVAILABLE` default with `GET /api/local/providers` loader; preserve UUID removal + submit guard |
| Dependency | Pack A merged + post-merge verified |
| Allowed | Local create client source/composer/API adapter/i18n/tests/evidence |
| Forbidden | Schema; backend; Tourism; deploy |
| Phrase | **`APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_CLIENT_WIRING`** |
| Success | `READY_FOR_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_CLIENT_WIRING_PR_REVIEW` |

### Later (separate phrases)

- Staging migrate/apply authorization  
- Staging provider activation  
- Live Local create QA  
- FC-P0 closure verification  

---

## 18. Test plan

**Server / authority (Pack A):**  
Ineligible excluded; draft/suspended/retired excluded; active+public included; private excluded; types serialized; unsupported type rejected on create; suspended rejected on create; unknown business safe; pagination; ordering; DTO privacy; unauthorized write rejected; control idempotency.

**Client (Pack B):**  
Zero-history load; displayName; internal businessId; no UUID; missing/stale block POST; type constraint; empty/load-error; guard; auth header; mappings; post-create; list/timeline/cancel; no Prisma; EN/VI.

**Release gates:** `tsc`, Local/server tests, `ci:expo-readiness`, `ci:release-discipline`, JWT, no-Prisma, Functions bundle, Modern Home A/B/C, SOS, Profile/Language, smoke.  
Pre-existing Functions TSC debt: record only.

---

## 19. Explicit non-goals

Broad marketplace; Tourism discovery; ranking; paid placement; reviews; ratings; availability calendar; booking; payment; Stripe; wallet; VIO debit; settlement; payout; subscriptions; AI matching; Leona; notifications; expiry; disputes; Pack40/Pack40S; production deploy; Apple/EAS; Phase D2.

**Preserve:** `REQUEST_ONLY_NO_CHARGE`

---

## 20. Immediate next operator action

Strict read-only review of this docs PR.  
Do **not** authorize Pack A implementation automatically.

After merge + post-merge verify of this plan:

**Authorize** `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_ELIGIBILITY_AUTHORITY_SCHEMA_BACKEND`  
as a separate IMPLEMENTATION_ONLY_NO_DEPLOY pack.

---

## 21. Final classification

`READY_FOR_VIONA_FC_P0_LOCAL_PROVIDER_ELIGIBILITY_AUTHORITY_PLAN_PR_REVIEW`

---

## 22. Remediation lineage (post–PR #415 / #416)

**PR #415** merged @ `dc5c625` — boundary plan.  
**PR #416** merged @ `435ddcd0f59b6e9295755398a54482788d7948ed` — lifecycle/write/audit/consistency locks.  
Strict review of #416: `BLOCKED_LOCAL_PROVIDER_AUDIT_MODEL_BOUNDARY_UNRESOLVED` (+ co-blockers).

**Current authoritative locks (supersede conflicts in this plan and the PR #416 remediation):**  
`docs/product/VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_PLAN_AUDIT_MODEL_AND_IMPLEMENTATION_READINESS_REMEDIATION.md`

| Topic | Locked decision |
|---|---|
| Owner | `LOCAL_PROVIDER_AUTHORITY_OWNER_ROLE_ADMIN_VIA_SUPERADMIN_MIDDLEWARE` (`Role.ADMIN` only) |
| Eligibility schema | No `suspensionReason` / `retirementReason` / audit actor ids on model |
| Lifecycle | Allowed transitions; `RETIRED` terminal; same-state → 200 / no update / no audit |
| Invalid transition / ACTIVE PATCH invariant | **409** |
| No-change PATCH | 200; no Prisma update; `updatedAt` unchanged; no audit |
| Write routes | Exact POST/PATCH/activate/suspend/retire |
| Audit | Complete `LocalProviderEligibilityAuditEvent` + dedicated enums; explicit prior/next columns; append-only; **no** `metadataJson` authority |
| Actor | `LocalProviderEligibilityAuditActorType.ROLE_ADMIN` + `actorUserId` |
| Create consistency | In-tx re-read; READ COMMITTED bounded race A–E |
| Post-activation empty name | Exclude from list/create; **do not** silently mutate eligibility |
| Tests | In-repo numbered cases **1–43** (A1: 1–29; A2: 30–43) |
| Sequence | **A1 → A2 → B** |
| Immediate phrase | `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_ELIGIBILITY_AUTHORITY_SCHEMA_DOMAIN_ENFORCEMENT` (**unauthorized**) |

**FC-P0 remains blocked until A1→A2→B complete under separate authorizations.**
